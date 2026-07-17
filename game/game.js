/**
 * サーバーサイド TCGバトルロジック ＆ 全59枚効果処理モジュール
 * 【エラッタオリジナリティルールブック Ver.現在 完全準拠版】
 */
class Game {
    constructor(p1, p2) {
        this.p1 = p1; 
        this.p2 = p2;

        // 各部屋で完全に独立したバトルステート
        this.state = {
            turnPlayerId: p1.id, 
            turnCount: 1,
            winnerId: null,
            
            // 【ルール修正】先攻の初期コストは1
            p1: {
                name: p1.name,
                lp: 8000,
                maxCost: 1,
                currentCost: 1,
                deck: [...p1.deck], 
                hand: [],
                board: [null, null, null, null, null],      
                magicBoard: [null, null, null, null, null], 
                grave: []
            },
            // 【ルール修正】後攻の初期コストは2
            p2: {
                name: p2.name,
                lp: 8000,
                maxCost: 2,
                currentCost: 2,
                deck: [...p2.deck],
                hand: [],
                board: [null, null, null, null, null],
                magicBoard: [null, null, null, null, null],
                grave: []
            },

            // エフェクトの持続・フラグ管理
            effects: {
                pandoraLockTurns: 0,
                gorinshoActiveTurns: 0,
                cthulhuSummonedTurn: -1,
                schlafNegateCount: 2,
                ayakaNegateCount: 1,
                aliceUsedThisTurn: { ①: false, ②: false },
                hackedMonster: null,
                hackedTurnCount: 0,
                elisionRevived: false
            }
        };
    }

    start() {
        console.log(`🎮 Game Started: ${this.p1.name} VS ${this.p2.name}`);
        // 初期ドロー (お互い5枚)
        for (let i = 0; i < 5; i++) {
            this.drawCard(this.p1.id, false);
            this.drawCard(this.p2.id, false);
        }
    }

    // 【ルール修正】isDrawPhaseがtrueの時にドローできなかったらデッキ切れ敗北
    drawCard(socketId, isDrawPhase = false) {
        const p = this.getPlayerState(socketId);
        if (p.deck.length > 0) {
            const card = p.deck.shift();
            p.hand.push(card);
            this.triggerOnDrawEvent(socketId);
        } else {
            if (isDrawPhase) {
                // ドローできなければ即敗北（＝相手の勝利）
                const opp = this.getOpponentState(socketId);
                this.state.winnerId = opp.id;
                console.log(`💀 デッキ切れにより敗北: ${p.name}`);
            }
        }
    }

    getPlayerState(socketId) {
        return this.p1.id === socketId ? this.state.p1 : this.state.p2;
    }
    getOpponentState(socketId) {
        return this.p1.id === socketId ? this.state.p2 : this.state.p1;
    }

    getWeaponTypes(cardName) {
        const types = [];
        const guns = ["一般兵士", "いつの日かの飛鉄「佐貫」", "シュラフアリーナ", "シュラフ・アリーナ", "自衛用拳銃", "次回策", "マネネ", "爆マネネ", "堕落マネネ"];
        const swords = ["八影月輪", "黒き刃", "永遠 store", "永遠の追放者エリシオン", "静寂の剣士ジーク"];
        const katanas = ["小夜峰綾香", "カワウソ", "奔花片名代", "奔華片名代", "ユリカ"];
        const blades = ["氷結の地", "イソナ", "異界の聖槍ロンギヌス", "ラーツグローブ", "ラーツ・グローブ"];

        if (guns.includes(cardName)) types.push("銃");
        if (swords.includes(cardName)) { types.push("剣"); types.push("刃物"); }
        if (katanas.includes(cardName)) { types.push("刀"); types.push("刃物"); }
        if (blades.includes(cardName)) types.push("刃物");
        return types;
    }

    // カード使用
    useCard(socketId, cardIndex) {
        if (this.state.turnPlayerId !== socketId) return; 

        const my = this.getPlayerState(socketId);
        const card = my.hand[cardIndex];
        if (!card || my.currentCost < card.cost) return; 

        my.currentCost -= card.cost;
        my.hand.splice(cardIndex, 1); 

        if (card.type === "モンスター") {
            const emptyIdx = my.board.findIndex(slot => slot === null);
            if (emptyIdx !== -1) {
                my.board[emptyIdx] = card;
                this.triggerOnSummon(card, emptyIdx, socketId);
            }
        } else if (card.type === "魔法" || card.type === "トラップ") {
            const emptyIdx = my.magicBoard.findIndex(slot => slot === null);
            if (emptyIdx !== -1) {
                my.magicBoard[emptyIdx] = card;
                this.triggerSpellActivate(card, socketId);
            }
        }
    }

    // 攻撃処理
    attack(socketId, attackerIndex, targetIndex) {
        if (this.state.turnPlayerId !== socketId) return;

        const my = this.getPlayerState(socketId);
        const opp = this.getOpponentState(socketId);

        const attacker = my.board[attackerIndex];
        if (!attacker || attacker.hasAttacked) return;

        attacker.hasAttacked = true; 

        let actualATK = attacker.ATK || 0;
        if (this.state.effects.gorinshoActiveTurns > 0) {
            const types = this.getWeaponTypes(attacker.カード名);
            if (types.includes("剣") || types.includes("刀")) {
                actualATK += 500;
            }
        }

        if (targetIndex === null || targetIndex === undefined || opp.board[targetIndex] === null) {
            // ダイレクトアタック
            const isBlocked = this.triggerBeforeDamage(actualATK, attacker, socketId);
            if (!isBlocked) {
                opp.lp -= actualATK;
                if (opp.lp <= 0) this.state.winnerId = socketId;
            }
        } else {
            // モンスター戦闘
            const target = opp.board[targetIndex];
            
            // 【ルール修正】ATKが異なる場合は差分ダメージが発生、同じ場合は相打ち
            if (actualATK > target.ATK) {
                // 攻撃側が勝利：相手に差分ダメージ
                const diff = actualATK - target.ATK;
                opp.lp -= diff;
                if (opp.lp <= 0) this.state.winnerId = socketId;

                this.triggerOnLeaveField(target, targetIndex, opp.id);
                opp.board[targetIndex] = null; 
            } 
            else if (actualATK < target.ATK) {
                // 防御側が勝利（返り討ち）：自分に差分ダメージ
                const diff = target.ATK - actualATK;
                my.lp -= diff;
                if (my.lp <= 0) this.state.winnerId = opp.id;

                this.triggerOnLeaveField(attacker, attackerIndex, socketId);
                my.board[attackerIndex] = null; 
            } 
            else {
                // ATKが同じ：両方破壊され、ダメージは発生しない
                this.triggerOnLeaveField(target, targetIndex, opp.id);
                this.triggerOnLeaveField(attacker, attackerIndex, socketId);
                opp.board[targetIndex] = null;
                my.board[attackerIndex] = null;
            }
        }
    }

    // ターン終了 ➔ 次のターンの開始フェイズ
    endTurn(socketId) {
        if (this.state.turnPlayerId !== socketId) return;

        this.triggerOnTurnEnd(socketId);
        this.state.turnPlayerId = (this.p1.id === socketId) ? this.p2.id : this.p1.id;
        
        if (this.state.turnPlayerId === this.p1.id) {
            this.state.turnCount++;
        }

        const nextPlayer = this.getPlayerState(this.state.turnPlayerId);
        
        // 【ルール修正】ターン開始時に最大コストを +2 する（上限10）
        nextPlayer.maxCost = Math.min(nextPlayer.maxCost + 2, 10);
        nextPlayer.currentCost = nextPlayer.maxCost; // 最大まで全回復
        
        nextPlayer.board.forEach(slot => { if(slot) slot.hasAttacked = false; });

        // 【ルール修正】ドローフェイズ（第二引数をtrueにしてデッキ切れ敗北を有効化）
        this.drawCard(this.state.turnPlayerId, true); 
        
        // 勝利が決まっていなければスタート時効果を発動
        if (!this.state.winnerId) {
            this.triggerOnTurnStart(this.state.turnPlayerId);
        }
    }

    // ------------------------------------------
    // 各種効果トリガーロジック（59枚エンジン）
    // ------------------------------------------
    triggerOnSummon(cardData, zoneIndex, socketId) {
        const cardName = cardData.カード名;
        const my = this.getPlayerState(socketId);
        const opp = this.getOpponentState(socketId);

        if (my.board.some(s => s && s.カード名 === "ニャルラトホテプ")) {
            this.drawCard(socketId, false); this.drawCard(socketId, false);
        }

        switch (cardName) {
            case "墓地送り":
                if (my.deck.length > 0) my.grave.push(my.deck.shift());
                opp.board.forEach((slot, idx) => {
                    if (slot && slot.cost >= 7) {
                        this.triggerOnLeaveField(slot, idx, opp.id);
                        opp.board[idx] = null;
                    }
                });
                break;
            case "イソナ":
                opp.board.forEach(slot => { if (slot) slot.ATK = Math.max(0, (slot.ATK || 0) - 2000); });
                break;
            case "異界の聖槍ロンギヌス":
                const targetIdx = opp.board.findIndex(slot => slot !== null);
                if (targetIdx !== -1) {
                    this.triggerOnLeaveField(opp.board[targetIdx], targetIdx, opp.id);
                    opp.board[targetIdx] = null;
                }
                break;
            case "機械仕掛けの鳥":
                if (my.deck.length > 0) my.grave.push(my.deck.shift());
                this.drawCard(socketId, false);
                my.board[zoneIndex] = null;
                this.triggerOnLeaveField(cardData, zoneIndex, socketId);
                break;
            case "桜の精霊":
                my.lp += 1500;
                my.board.forEach(slot => { if (slot) slot.ATK += 500; });
                opp.board.forEach(slot => { if (slot) slot.ATK = Math.max(0, (slot.ATK || 0) - 250); });
                break;
            case "マネネ":
                opp.lp -= 800;
                if (opp.lp <= 0) this.state.winnerId = socketId;
                break;
            case "クトゥルフ":
                this.state.effects.cthulhuSummonedTurn = this.state.turnCount;
                break;
        }
    }

    triggerSpellActivate(cardData, socketId) {
        const cardName = cardData.カード名;
        const my = this.getPlayerState(socketId);
        const opp = this.getOpponentState(socketId);

        switch (cardName) {
            case "参拝":
                my.lp += 500;
                break;
            case "これあげる":
                if (my.hand.length >= 2) {
                    opp.hand.push(my.hand.shift(), my.hand.shift());
                    this.drawCard(socketId, false); this.drawCard(socketId, false);
                    opp.lp -= 1000;
                    if (opp.lp <= 0) this.state.winnerId = socketId;
                }
                break;
            case "五輪書":
                this.state.effects.gorinshoActiveTurns = 2;
                this.drawCard(socketId, false);
                break;
            case "封印の箱パンドラ":
                my.lp += 800;
                this.state.effects.pandoraLockTurns = 2;
                break;
            case "世界の滅亡":
                const hasCthulhu = my.board.some(s => s && s.カード名 === "クトゥルフ");
                const hasLuluye = my.magicBoard.some(s => s && s.カード名 === "ルルイエ");
                const elapsed = this.state.turnCount - this.state.effects.cthulhuSummonedTurn;
                if (hasCthulhu && hasLuluye && this.state.effects.cthulhuSummonedTurn !== -1 && elapsed >= 2) {
                    this.state.winnerId = socketId; 
                }
                break;
        }
    }

    triggerOnLeaveField(cardData, zoneIndex, socketId) {
        const cardName = cardData.カード名;
        const my = this.getPlayerState(socketId);
        const opp = this.getOpponentState(socketId);

        const trapIdx = my.magicBoard.findIndex(s => s && s.カード名 === "光の残響");
        if (trapIdx !== -1) {
            opp.lp -= 400;
            if (opp.lp <= 0) this.state.winnerId = socketId;
            this.drawCard(socketId, false);
            my.magicBoard[trapIdx] = null;
        }

        my.grave.push(cardData);

        switch (cardName) {
            case "一般兵士":
                if (this.state.effects.pandoraLockTurns > 0) return; 
                const gunNames = ["自衛用拳銃", "マネネ", "爆マネネ", "次回策"];
                const gIdx = my.grave.findIndex(c => gunNames.includes(c.カード名));
                if (gIdx !== -1) {
                    const gunCard = my.grave.splice(gIdx, 1)[0];
                    if (gunCard.type === "モンスター") {
                        const eIdx = my.board.findIndex(s => s === null);
                        if (eIdx !== -1) my.board[eIdx] = gunCard;
                    } else {
                        this.triggerSpellActivate(gunCard, socketId);
                    }
                }
                break;
            case "異界の聖槍ロンギヌス":
                opp.lp -= 500;
                if (opp.lp <= 0) this.state.winnerId = socketId;
                break;
            case "永遠の追放者エリシオン":
                if (!this.state.effects.elisionRevived) {
                    this.state.effects.elisionRevived = true;
                    const eIdx = my.board.findIndex(s => s === null);
                    if (eIdx !== -1) my.board[eIdx] = cardData;
                }
                break;
        }
    }

    triggerOnTurnStart(socketId) {
        const my = this.getPlayerState(socketId);
        const opp = this.getOpponentState(socketId);

        my.board.forEach((slot, idx) => {
            if (slot && slot.カード名 === "深淵の監視者ネフシュタン" && my.lp < opp.lp) {
                const targetIdx = opp.board.findIndex(s => s !== null);
                if (targetIdx !== -1) {
                    this.triggerOnLeaveField(opp.board[targetIdx], targetIdx, opp.id);
                    opp.board[targetIdx] = null;
                }
                my.lp += 300;
            }
        });
    }

    triggerOnTurnEnd(socketId) {
        if (this.state.effects.pandoraLockTurns > 0) this.state.effects.pandoraLockTurns--;
        if (this.state.effects.gorinshoActiveTurns > 0) this.state.effects.gorinshoActiveTurns--;
    }

    triggerBeforeDamage(damageAmount, sourceCard, targetSocketId) {
        const opp = this.getPlayerState(targetSocketId); 
        const attacker = this.getOpponentState(targetSocketId);

        const trapIdx = opp.magicBoard.findIndex(s => s && s.カード名 === "自衛用拳銃");
        if (trapIdx !== -1 && sourceCard && sourceCard.cost <= 3) {
            attacker.lp -= 500; 
            if (attacker.lp <= 0) this.state.winnerId = targetSocketId;
            opp.magicBoard[trapIdx] = null; 
            return true; 
        }
        return false;
    }

    triggerOnDrawEvent(socketId) {
        const my = this.getPlayerState(socketId);
        const hasHazama = my.magicBoard.some(s => s && s.カード名 === "夢見の狭間");
        if (hasHazama) {
            if (Math.random() < 0.5) {
                this.drawCard(socketId, false);
            } else if (my.grave.length > 0) {
                const rIdx = Math.floor(Math.random() * my.grave.length);
                my.deck.push(my.grave.splice(rIdx, 1)[0]);
            }
        }
    }

    createStateForPlayer(socketId) {
        const isP1 = (this.p1.id === socketId);
        const me = isP1 ? this.state.p1 : this.state.p2;
        const opp = isP1 ? this.state.p2 : this.state.p1;

        return {
            isMyTurn: (this.state.turnPlayerId === socketId),
            turnCount: this.state.turnCount,
            winnerId: this.state.winnerId,
            me: {
                lp: me.lp,
                maxCost: me.maxCost,
                currentCost: me.currentCost,
                hand: me.hand, 
                board: me.board,
                magicBoard: me.magicBoard,
                graveCount: me.grave.length
            },
            opp: {
                name: opp.name,
                lp: opp.lp,
                maxCost: opp.maxCost,
                currentCost: opp.currentCost,
                handCount: opp.hand.length, 
                board: opp.board,
                magicBoard: opp.magicBoard,
                graveCount: opp.grave.length
            }
        };
    }
}

module.exports = { Game };
