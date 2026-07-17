// ====================================================================
// エラッタオリジナリティ - server.js (完全統合版)
// ====================================================================
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// ====================================================================
// 🎮 GAME ENGINE CLASS (カード効果・バトルロジック内蔵)
// ====================================================================
class Game {
    constructor(p1, p2) {
        this.p1 = p1; 
        this.p2 = p2;

        // 各部屋で完全に独立したバトルステート
        this.state = {
            turnPlayerId: p1.id, 
            turnCount: 1,
            winnerId: null,
            
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
            p2: {
                name: p2.name,
                lp: 8000,
                maxCost: 1,
                currentCost: 1,
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
            this.drawCard(this.p1.id);
            this.drawCard(this.p2.id);
        }
    }

    drawCard(socketId) {
        const p = this.getPlayerState(socketId);
        if (p.deck.length > 0) {
            const card = p.deck.shift();
            p.hand.push(card);
            this.triggerOnDrawEvent(socketId);
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

    // カード使用 (モンスター召喚 / 魔法・罠セット)
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
            if (actualATK >= target.ATK) {
                this.triggerOnLeaveField(target, targetIndex, opp.id);
                opp.board[targetIndex] = null; 
            }
            if (actualATK <= target.ATK) {
                this.triggerOnLeaveField(attacker, attackerIndex, socketId);
                my.board[attackerIndex] = null; 
            }
        }
    }

    // ターン終了
    endTurn(socketId) {
        if (this.state.turnPlayerId !== socketId) return;

        this.triggerOnTurnEnd(socketId);
        this.state.turnPlayerId = (this.p1.id === socketId) ? this.p2.id : this.p1.id;
        
        if (this.state.turnPlayerId === this.p1.id) {
            this.state.turnCount++;
        }

        const nextPlayer = this.getPlayerState(this.state.turnPlayerId);
        nextPlayer.maxCost = Math.min(nextPlayer.maxCost + 1, 10);
        nextPlayer.currentCost = nextPlayer.maxCost;
        
        nextPlayer.board.forEach(slot => { if(slot) slot.hasAttacked = false; });

        this.drawCard(this.state.turnPlayerId); 
        this.triggerOnTurnStart(this.state.turnPlayerId);
    }

    // ------------------------------------------
    // 各種効果トリガーロジック
    // ------------------------------------------
    triggerOnSummon(cardData, zoneIndex, socketId) {
        const cardName = cardData.カード名;
        const my = this.getPlayerState(socketId);
        const opp = this.getOpponentState(socketId);

        if (my.board.some(s => s && s.カード名 === "ニャルラトホテプ")) {
            this.drawCard(socketId); this.drawCard(socketId);
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
                this.drawCard(socketId);
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
                    this.drawCard(socketId); this.drawCard(socketId);
                    opp.lp -= 1000;
                    if (opp.lp <= 0) this.state.winnerId = socketId;
                }
                break;
            case "五輪書":
                this.state.effects.gorinshoActiveTurns = 2;
                this.drawCard(socketId);
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
            this.drawCard(socketId);
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
                this.drawCard(socketId);
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

// ====================================================================
// 🌐 SERVER NETWORKING LOGIC
// ====================================================================
let waitingPlayers = [];
let rooms = {};
let games = {};

io.on("connection", (socket) => {
    console.log("接続:", socket.id);

    // ロビー参加 (マッチング)
    socket.on("join-lobby", (data) => {
        let player = {
            id: socket.id,
            name: data.name || "ゲスト",
            deck: data.deck || []
        };

        if (waitingPlayers.length > 0) {
            let opponent = waitingPlayers.shift();
            let roomId = "room_" + opponent.id + "_" + player.id;

            socket.join(roomId);
            io.sockets.sockets.get(opponent.id).join(roomId);

            rooms[socket.id] = roomId;
            rooms[opponent.id] = roomId;

            let game = new Game(opponent, player);
            games[roomId] = game;
            game.start();

            io.to(roomId).emit("match-found", { roomId: roomId });
            sendState(roomId);
        } else {
            waitingPlayers.push(player);
            console.log(`待機プレイヤー: ${player.name}`);
        }
    });

    // カード使用
    socket.on("use-card", (data) => {
        let roomId = rooms[socket.id];
        if (!roomId) return;
        games[roomId].useCard(socket.id, data.cardIndex);
        sendState(roomId);
    });

    // 攻撃
    socket.on("attack", (data) => {
        let roomId = rooms[socket.id];
        if (!roomId) return;
        games[roomId].attack(socket.id, data.attackerIndex, data.targetIndex);
        sendState(roomId);
    });

    // ターン終了
    socket.on("end-turn", () => {
        let roomId = rooms[socket.id];
        if (!roomId) return;
        games[roomId].endTurn(socket.id);
        sendState(roomId);
    });

    // 切断
    socket.on("disconnect", () => {
        console.log("切断:", socket.id);
        let roomId = rooms[socket.id];
        if (roomId) {
            io.to(roomId).emit("opponent-disconnected");
            delete games[roomId];
            delete rooms[socket.id];
        }
        waitingPlayers = waitingPlayers.filter(p => p.id !== socket.id);
    });
});

function sendState(roomId) {
    let game = games[roomId];
    if (!game) return;
    io.to(game.p1.id).emit("game-update", game.createStateForPlayer(game.p1.id));
    io.to(game.p2.id).emit("game-update", game.createStateForPlayer(game.p2.id));
}

http.listen(PORT, () => {
    console.log("Server started on port:", PORT);
});
