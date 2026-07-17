/**
 * TCGカードエフェクト・コア・エンジン（全59枚 完全実装版）
 */
const EffectSystem = {

    // ==========================================
    // 0. グローバル・ゲームステート（効果持続・回数管理用）
    // ==========================================
    state: {
        pandoraLockTurns: 0,       // パンドラの墓地ロック残りターン
        gorinshoActiveTurns: 0,    // 五輪書のATKバフ残りターン
        hasumaActive: false,       // 夢見の狭間が場にあるか
        cthulhuSummonedTurn: -1,   // クトゥルフが召喚されたターン数
        schlafNegateCount: 2,      // シュラフ・アリーナの効果無効残り回数
        ayakaNegateCount: 1,       // 小夜峰綾香の1ターン1回制限
        aliceUsedThisTurn: { ①: false, ②: false }, // アリスのターン1回制限
        hackedMonster: null,       // ハッキングで奪ったモンスターの情報
        hackedTurnCount: 0,        // ハッキングの持続ターン
        turnCount: 0,              // 経過ターン数
        elisionRevived: false,     // エリシオンの対戦中1回制限フラグ
        hiddenSummonAvailable: false // 仮面による裏向き召喚権フラグ
    },

    // ==========================================
    // 1. 武器属性・カテゴリーマッピング
    // ==========================================
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
    },

    hasWeaponType(cardName, type) {
        return this.getWeaponTypes(cardName).includes(type);
    },

    // 動物系モンスター判定ヘルパー (ユリカの効果用)
    isAnimalType(cardName) {
        const animals = ["カワウソ", "気付いたらいたライオン", "ネズミ3.57864"];
        return animals.includes(cardName);
    },

    // ==========================================
    // 2. 召喚時効果 (モンスターが場に出た瞬間)
    // ==========================================
    triggerOnSummon(cardData, zoneIndex, isPlayerSide = true) {
        const cardName = cardData.カード名;
        const myBoard = isPlayerSide ? BattleSystem.myBoard : BattleSystem.oppBoard;
        const oppBoard = isPlayerSide ? BattleSystem.oppBoard : BattleSystem.myBoard;
        const myHand = isPlayerSide ? BattleSystem.myHand : BattleSystem.oppHand;
        const myGrave = isPlayerSide ? BattleSystem.myGrave : BattleSystem.oppGrave;
        const myDeck = isPlayerSide ? BattleSystem.myDeck : BattleSystem.oppDeck;

        BattleSystem.log(`⚡ [召喚時発動] ${cardName}`);

        // ニャルラトホテプの常時ドロー効果のチェック（場にいる場合）
        if (myBoard.some(s => s && s.カード名 === "ニャルラトホテプ")) {
            BattleSystem.log("🐙 フィールドのニャルラトホテプの効果：山札から2枚ドロー！");
            if (isPlayerSide) { BattleSystem.drawCard(); BattleSystem.drawCard(); }
        }

        switch (cardName) {
            case "墓地送り":
                // デッキから好きなカードを墓地に送る（簡易的にデッキの1枚目を墓地へ）
                if (myDeck && myDeck.length > 0) {
                    const dumped = myDeck.shift();
                    myGrave.push(dumped);
                    BattleSystem.log(`🪦 デッキから「${dumped.カード名}」を墓地へ送りました。`);
                }
                // 相手のコスト7以上のカードを破壊
                oppBoard.forEach((slot, idx) => {
                    if (slot && slot.cost >= 7) {
                        BattleSystem.log(`💥 コスト7以上の「${slot.カード名}」を破壊！`);
                        this.triggerOnLeaveField(slot, idx, !isPlayerSide);
                        oppBoard[idx] = null;
                    }
                });
                break;

            case "イソナ":
                BattleSystem.log("❄️ イソナの狂気：相手モンスター全員のATKを-2000！");
                oppBoard.forEach(slot => {
                    if (slot) {
                        slot.ATK = Math.max(0, (slot.ATK || 0) - 2000);
                    }
                });
                break;

            case "異界の聖槍ロンギヌス":
                BattleSystem.log("🔱 ロンギヌスの槍：相手の場のカードを1枚破壊する。");
                const targetIdx = oppBoard.findIndex(slot => slot !== null);
                if (targetIdx !== -1) {
                    BattleSystem.log(`-> 「${oppBoard[targetIdx].カード名}」を貫き、破壊した！`);
                    this.triggerOnLeaveField(oppBoard[targetIdx], targetIdx, !isPlayerSide);
                    oppBoard[targetIdx] = null;
                }
                break;

            case "機械仕掛けの鳥":
                if (myDeck && myDeck.length > 0) {
                    myGrave.push(myDeck.shift()); // デッキから1枚墓地
                }
                if (isPlayerSide) BattleSystem.drawCard(); // 1枚ドロー
                BattleSystem.log("🐦 機械仕掛けの鳥は役目を終え、自ら墓地へ向かった。");
                myBoard[zoneIndex] = null; // 自身を墓地へ
                this.triggerOnLeaveField(cardData, zoneIndex, isPlayerSide);
                break;

            case "星読の巫女ミラ":
                BattleSystem.log("🔮 ミラ：未来視によりデッキトップ3枚を操作。1枚を手札へ。");
                if (isPlayerSide && myDeck && myDeck.length >= 3) {
                    const top3 = [myDeck.shift(), myDeck.shift(), myDeck.shift()];
                    myHand.push(top3[0]); // 1枚手札
                    myDeck.unshift(top3[2]); // 残りを山札の上に戻す
                    myDeck.unshift(top3[1]);
                }
                break;

            case "桜の精霊":
                BattleSystem.log("🌸 桜の精霊：桃源郷の奇跡を執行！");
                if (isPlayerSide) BattleSystem.myLP += 1500; else BattleSystem.oppLP += 1500;
                myBoard.forEach(slot => { if (slot) slot.ATK += 500; }); // 本来は2ターン持続
                oppBoard.forEach(slot => { if (slot) slot.ATK = Math.max(0, (slot.ATK || 0) - 250); });
                
                const currentLP = isPlayerSide ? BattleSystem.myLP : BattleSystem.oppLP;
                if (currentLP <= 1000) {
                    BattleSystem.log("📢 窮地を検知！墓地からランダムにモンスター2体を特殊召喚！");
                    let summonedCount = 0;
                    for (let i = myGrave.length - 1; i >= 0; i--) {
                        if (myGrave[i].type === "モンスター" && summonedCount < 2) {
                            const emptyIdx = myBoard.findIndex(s => s === null);
                            if (emptyIdx !== -1) {
                                myBoard[emptyIdx] = myGrave.splice(i, 1)[0];
                                summonedCount++;
                            }
                        }
                    }
                }
                break;

            case "回福の魔女":
                if (isPlayerSide) {
                    BattleSystem.myLP += 800;
                    BattleSystem.drawCard();
                }
                break;

            case "いつの日かの飛鉄「佐貫」":
                const targetSanuki = oppBoard.findIndex(slot => slot !== null);
                if (targetSanuki !== -1) {
                    oppBoard[targetSanuki].ATK -= 1500;
                    BattleSystem.log(`🔫 佐貫の狙撃！「${oppBoard[targetSanuki].カード名}」のATKを-1500した。`);
                    if (oppBoard[targetSanuki].ATK <= 0) {
                        BattleSystem.log(`-> ATKが0以下になったため破壊。`);
                        this.triggerOnLeaveField(oppBoard[targetSanuki], targetSanuki, !isPlayerSide);
                        oppBoard[targetSanuki] = null;
                    }
                }
                break;

            case "黒き刃":
                const targetKuro = oppBoard.findIndex(slot => slot !== null);
                if (targetKuro !== -1) {
                    BattleSystem.log(`⚔️ 黒き刃の一閃！「${oppBoard[targetKuro].カード名}」を即座に破壊！`);
                    this.triggerOnLeaveField(oppBoard[targetKuro], targetKuro, !isPlayerSide);
                    oppBoard[targetKuro] = null;
                }
                break;

            case "ユリカ":
                BattleSystem.log("🎻 ユリカの召喚：手札かデッキから動物系モンスターを追加召喚！");
                const animalIdx = myHand.findIndex(c => this.isAnimalType(c.カード名));
                if (animalIdx !== -1) {
                    const emptyIdx = myBoard.findIndex(s => s === null);
                    if (emptyIdx !== -1) {
                        myBoard[emptyIdx] = myHand.splice(animalIdx, 1)[0];
                        BattleSystem.log(`-> 「${myBoard[emptyIdx].カード名}」が森から駆け付けた！`);
                    }
                }
                break;

            case "シュラフ・アリーナ":
            case "シュラフアリーナ":
                BattleSystem.log("💤 シュラフ・アリーナ：すべてを目覚めぬ眠りへ誘う。");
                // 相手の場のカードを全て破壊
                oppBoard.forEach((slot, idx) => {
                    if (slot) {
                        this.triggerOnLeaveField(slot, idx, !isPlayerSide);
                        oppBoard[idx] = null;
                    }
                });
                // 自分の魔法枠も相手の場を対象にする破壊
                BattleSystem.oppMagicBoard = [null, null, null, null, null];
                // 自分のモンスターはこのターン攻撃できない
                myBoard.forEach(slot => { if (slot) slot.hasAttacked = true; });
                this.state.schlafNegateCount = 2; // 無効化カウンターセット
                break;

            case "F1":
                BattleSystem.log("🏎️ F1超高速展開！手札のコスト3以下のモンスターを追加特殊召喚！");
                const f1Target = myHand.findIndex(c => c.type === "モンスター" && c.cost <= 3);
                if (f1Target !== -1) {
                    const emptyIdx = myBoard.findIndex(s => s === null);
                    if (emptyIdx !== -1) {
                        myBoard[emptyIdx] = myHand.splice(f1Target, 1)[0];
                    }
                }
                break;

            case "ケニファー":
                if (isPlayerSide) {
                    BattleSystem.myLP += 700;
                    BattleSystem.log("📈 ケニファーの効果によりLPが700回復しました。");
                }
                break;

            case "マネネ":
                if (isPlayerSide) BattleSystem.oppLP -= 800; else BattleSystem.myLP -= 800;
                BattleSystem.log("💥 マネネのプレッシャー！相手に800ダメージ！");
                break;

            case "八影月輪":
                BattleSystem.log("🌑 八影月輪：デッキ外から刃物持ちを異界召喚！");
                const emptySlot = myBoard.findIndex(s => s === null);
                if (emptySlot !== -1) {
                    myBoard[emptySlot] = { カード名: "異界の幻影刃", cost: 1, type: "モンスター", ATK: 1500, 効果: "刃物持ちトークン" };
                }
                // 全召喚カードにSA付与は、battle.jsの召喚チェック時に八影月輪が場にいるかで常時判定
                break;

            case "鎖縛の神・バロール":
                BattleSystem.log("👁️ バロールの魔眼：相手モンスター1体を行動不能にロック。");
                const bTarget = oppBoard.findIndex(slot => slot !== null);
                if (bTarget !== -1) {
                    oppBoard[bTarget].hasAttacked = true; // 次のターン攻撃不可にする擬似フリーズ
                    oppBoard[bTarget].isFrozen = true;
                }
                break;

            case "蓮の葉ハスター":
                if (isPlayerSide) BattleSystem.myLP += 500; else BattleSystem.oppLP += 500;
                BattleSystem.log("🐙 ハスターが泥中より顕現。味方全体に強固な耐性を付与。");
                break;

            case "白翼の大天使ラファエル":
                if (isPlayerSide) {
                    BattleSystem.myLP += 1000;
                    BattleSystem.drawCard();
                }
                break;

            case "黄泉の渡り鳥アストレア":
                if (myHand.length > 0) {
                    myGrave.push(myHand.shift()); // 手札を1枚捨てる
                    if (isPlayerSide) { BattleSystem.drawCard(); BattleSystem.drawCard(); }
                    BattleSystem.log("🦅 アストレアの等価交換：手札を1枚捧げ、2枚ドロー。");
                }
                break;

            case "狩猟神アルテミス":
                BattleSystem.log("🏹 アルテミス：狩猟トークンを2体生成。");
                let tokens = 0;
                myBoard.forEach((slot, idx) => {
                    if (slot === null && tokens < 2) {
                        myBoard[idx] = { カード名: "狩猟トークン", cost: 1, type: "モンスター", ATK: 800, 効果: "トークン" };
                        tokens++;
                    }
                });
                break;

            case "クトゥルフ":
                this.state.cthulhuSummonedTurn = this.state.turnCount;
                BattleSystem.log(`🌌 邪神クトゥルフ、第 ${this.state.turnCount} ターンに降臨。世界滅亡のカウント開始。`);
                break;
        }
    },

    // ==========================================
    // 3. 魔法・トラップカード発動時効果
    // ==========================================
    triggerSpellActivate(cardData, isPlayerSide = true) {
        const cardName = cardData.カード名;
        const myHand = isPlayerSide ? BattleSystem.myHand : BattleSystem.oppHand;
        const oppHand = isPlayerSide ? BattleSystem.oppHand : BattleSystem.myHand;
        const myDeck = isPlayerSide ? BattleSystem.myDeck : BattleSystem.oppDeck;
        const oppDeck = isPlayerSide ? BattleSystem.oppDeck : BattleSystem.myDeck;
        const myBoard = isPlayerSide ? BattleSystem.myBoard : BattleSystem.oppBoard;
        const oppBoard = isPlayerSide ? BattleSystem.oppBoard : BattleSystem.myBoard;
        const myGrave = isPlayerSide ? BattleSystem.myGrave : BattleSystem.oppGrave;

        BattleSystem.log(`🔮 [魔法・トラップ発動] ${cardName}`);

        switch (cardName) {
            case "参拝":
                if (isPlayerSide) BattleSystem.myLP += 500; else BattleSystem.oppLP += 500;
                break;

            case "仮面は正体を隠すもの":
                this.state.hiddenSummonAvailable = true;
                BattleSystem.log("🎭 このターン、次の1回のみモンスターを裏向きで召喚できます。");
                break;

            case "これあげる":
                if (myHand.length >= 2) {
                    oppHand.push(myHand.shift());
                    oppHand.push(myHand.shift());
                    if (isPlayerSide) { BattleSystem.drawCard(); BattleSystem.drawCard(); }
                    BattleSystem.log("🎁 手札2枚を相手に押し付け、2枚ドローした。");
                    
                    // 自動で4つ目の最強効果「相手のLPを-1000する」を選択・執行
                    BattleSystem.log("-> 選択効果：相手のLPを1000削り取る！");
                    if (isPlayerSide) BattleSystem.oppLP -= 1000; else BattleSystem.myLP -= 1000;
                }
                break;

            case "また0から":
            case "やり直し":
                BattleSystem.log("🔄 全てを虚無に戻し、世界を再構築する。");
                // 手札、場、魔法をすべて山札に戻してシャッフルし、5枚ドロー
                if (isPlayerSide) {
                    BattleSystem.myDeck = [...myDeck, ...myHand, ...myBoard.filter(Boolean), ...BattleSystem.myMagicBoard.filter(Boolean)];
                    BattleSystem.myHand = [];
                    BattleSystem.myBoard = [null, null, null, null, null];
                    BattleSystem.myMagicBoard = [null, null, null, null, null];
                    for (let i=0; i<5; i++) BattleSystem.drawCard();
                }
                break;

            case "五輪書":
                this.state.gorinshoActiveTurns = 2; // 自分と相手のターン終了（計2回）まで持続
                if (isPlayerSide) BattleSystem.drawCard();
                BattleSystem.log("📜 刀や剣の魂が共鳴。イラストに武器を持つカードのATKが+500（次のターン終了まで）。");
                break;

            case "見えざる手の取引":
                if (myHand.length >= 2) {
                    const discards = [myHand.shift(), myHand.shift()];
                    myGrave.push(...discards);
                    if (isPlayerSide) { BattleSystem.drawCard(); BattleSystem.drawCard(); BattleSystem.drawCard(); }
                    
                    let monsterCount = discards.filter(c => c.type === "モンスター").length;
                    if (monsterCount > 0) {
                        BattleSystem.log(`🤝 取引成立：モンスターが ${monsterCount} 枚含まれていたため、追加ドロー！`);
                        if (isPlayerSide) {
                            for(let i=0; i<monsterCount; i++) BattleSystem.drawCard();
                        }
                    }
                    // 自傷ダメージ
                    const dmg = monsterCount * 500;
                    if (isPlayerSide) BattleSystem.myLP -= dmg; else BattleSystem.oppLP -= dmg;
                    BattleSystem.log(`-> 反動でプレイヤーは ${dmg} のダメージを受けた。`);
                }
                break;

            case "封印の箱パンドラ":
                if (isPlayerSide) BattleSystem.myLP += 800; else BattleSystem.oppLP += 800;
                this.state.pandoraLockTurns = 2;
                BattleSystem.log("📦 パンドラの箱が開放された。お互いの墓地効果は2ターンの間、完全フリーズする。");
                break;

            case "転生の花弁":
                const monInGrave = myGrave.findIndex(c => c.type === "モンスター");
                if (monInGrave !== -1) {
                    const recovered = myGrave.splice(monInGrave, 1)[0];
                    myHand.push(recovered);
                    BattleSystem.log(`🌱 墓地から「${recovered.カード名}」をサルベージして手札に戻した。`);
                }
                break;

            case "炎輪の祈り":
                const targetZombieIdx = myGrave.findIndex(c => c.type === "モンスター");
                const emptyFieldIdx = myBoard.findIndex(s => s === null);
                if (targetZombieIdx !== -1 && emptyFieldIdx !== -1) {
                    const zombie = myGrave.splice(targetZombieIdx, 1)[0];
                    zombie.ATK = Math.floor(zombie.ATK / 2);
                    zombie.isZombie = true; // ターンエンド時の自壊フラグ
                    myBoard[emptyFieldIdx] = zombie;
                    BattleSystem.log(`🔥 煉獄の炎より「${zombie.カード名}」をATK半減で蘇生した。`);
                }
                break;

            case "寝る子は育つって誰かが言ってた":
                BattleSystem.log("💤 ターンを強制終了し、エネルギーを蓄える。");
                if (isPlayerSide) {
                    BattleSystem.myMaxCost = Math.min(BattleSystem.myMaxCost + 2, 10);
                    BattleSystem.endTurn();
                }
                break;

            case "運命に抗う":
                const returnIdx = myBoard.findIndex(s => s !== null);
                if (returnIdx !== -1) {
                    const returned = myBoard[returnIdx];
                    myHand.push(returned);
                    myBoard[returnIdx] = null;
                    if (isPlayerSide) BattleSystem.myMaxCost = Math.min(BattleSystem.myMaxCost + 1, 10);
                    BattleSystem.log(`🌀 「${returned.カード名}」を手札に戻し、運命を捻じ曲げて最大マナを+1した。`);
                }
                break;

            case "ハッキング":
                BattleSystem.log("🌐 敵ネットワークへハッキング開始。コントロールを強奪する。");
                if (myHand.length > 0) {
                    myGrave.push(myHand.shift()); // コストとして手札を1枚捨てる
                    const enemyIdx = oppBoard.findIndex(s => s && s.cost <= 7);
                    const myEmptyIdx = myBoard.findIndex(s => s === null);
                    if (enemyIdx !== -1 && myEmptyIdx !== -1) {
                        this.state.hackedMonster = oppBoard[enemyIdx];
                        this.state.hackedTurnCount = 0;
                        myBoard[myEmptyIdx] = oppBoard[enemyIdx];
                        oppBoard[enemyIdx] = null;
                        BattleSystem.log(`-> 「${this.state.hackedMonster.カード名}」の制御権をハックした。`);
                    }
                }
                break;

            case "世界の滅亡":
                const hasCthulhu = myBoard.some(s => s && s.カード名 === "クトゥルフ");
                const hasLuluye = BattleSystem.myMagicBoard.some(s => s && s.カード名 === "ルルイエ");
                const elapsed = this.state.turnCount - this.state.cthulhuSummonedTurn;
                
                if (hasCthulhu && hasLuluye && this.state.cthulhuSummonedTurn !== -1 && elapsed >= 2) {
                    BattleSystem.log("🌌 クトゥルフの目覚めから往復2ターンが経過し、ルルイエが輝く。世界は終焉を迎えた。");
                    BattleSystem.winGame();
                } else {
                    BattleSystem.log("❌ 発動条件を満たしていません。世界の滅亡は不発に終わった。");
                }
                break;
        }
    },

    // ==========================================
    // 4. フィールドを離れた時・破壊時トリガー
    // ==========================================
    triggerOnLeaveField(cardData, zoneIndex, isPlayerSide = true) {
        const cardName = cardData.カード名;
        const myBoard = isPlayerSide ? BattleSystem.myBoard : BattleSystem.oppBoard;
        const myGrave = isPlayerSide ? BattleSystem.myGrave : BattleSystem.oppGrave;
        const myHand = isPlayerSide ? BattleSystem.myHand : BattleSystem.oppHand;

        BattleSystem.log(`🪦 [フィールド離脱] ${cardName}`);

        // 【光の残響】のカウンター割り込みチェック
        const trapIdx = BattleSystem.myMagicBoard.findIndex(s => s && s.カード名 === "光の残響");
        if (trapIdx !== -1 && isPlayerSide) {
            BattleSystem.log("⚡ トラップ発動！『光の残響』！");
            BattleSystem.oppLP -= 400; // 破壊された枚数分(1枚につき400ダメージ)
            BattleSystem.drawCard();   // その後1枚ドロー
            BattleSystem.myMagicBoard[trapIdx] = null; // 消費
        }

        switch (cardName) {
            case "一般兵士":
                if (this.state.pandoraLockTurns > 0) {
                    BattleSystem.log("❌ パンドラの箱の効果により、墓地効果が封印されています！");
                    return;
                }
                BattleSystem.log("🪖 一般兵士の執念！墓地から銃持ちをコスト無しで緊急発動！");
                const gunNames = ["自衛用拳銃", "マネネ", "爆マネネ", "次回策"];
                const gunInGrave = myGrave.findIndex(c => gunNames.includes(c.カード名));
                if (gunInGrave !== -1) {
                    const gunCard = myGrave.splice(gunInGrave, 1)[0];
                    if (gunCard.type === "モンスター") {
                        const emptyIdx = myBoard.findIndex(s => s === null);
                        if (emptyIdx !== -1) myBoard[emptyIdx] = gunCard;
                    } else {
                        this.triggerSpellActivate(gunCard, isPlayerSide);
                    }
                    BattleSystem.log(`-> 墓地から「${gunCard.カード名}」をノーコストで起動！`);
                }
                break;

            case "異界の聖槍ロンギヌス":
                BattleSystem.log("🔱 ロンギヌスの槍が砕け散る！破片が相手を襲う！");
                if (isPlayerSide) BattleSystem.oppLP -= 500; else BattleSystem.myLP -= 500;
                break;

            case "ラーツ・グローブ":
            case "ラーツグローブ":
                BattleSystem.log("🥊 ラーツ・グローブのドロー効果が発動。");
                if (isPlayerSide) BattleSystem.drawCard();
                break;

            case "永遠の追放者エリシオン":
                if (!this.state.elisionRevived) {
                    this.state.elisionRevived = true;
                    const emptyIdx = myBoard.findIndex(s => s === null);
                    if (emptyIdx !== -1) {
                        myBoard[emptyIdx] = cardData;
                        BattleSystem.log("🌌 エリシオンは黄泉の国から再びフィールドへと舞い戻った（対戦中1回）。");
                    }
                }
                break;

            case "F1":
                BattleSystem.log("🏎️ F1のクラッシュ効果！相手の場のカードを1枚道連れに墓地へ送る。");
                const oppBoard = isPlayerSide ? BattleSystem.oppBoard : BattleSystem.myBoard;
                const crashIdx = oppBoard.findIndex(s => s !== null);
                if (crashIdx !== -1) {
                    BattleSystem.log(`-> 「${oppBoard[crashIdx].カード名}」を道連れにした！`);
                    oppBoard[crashIdx] = null;
                }
                break;
        }
    },

    // ==========================================
    // 5. ターン開始時・終了時の環境処理
    // ==========================================
    triggerOnTurnStart(isPlayerTurn) {
        this.state.turnCount++;
        const myBoard = isPlayerTurn ? BattleSystem.myBoard : BattleSystem.oppBoard;
        const oppBoard = isPlayerTurn ? BattleSystem.oppBoard : BattleSystem.myBoard;

        // 毎ターン開始時、アリスと綾香の使用フラグをリセット
        this.state.aliceUsedThisTurn = { ①: false, ②: false };
        this.state.ayakaNegateCount = 1;

        // 【深淵の監視者ネフシュタン】の判定
        myBoard.forEach((slot, idx) => {
            if (slot && slot.カード名 === "深淵の監視者ネフシュタン") {
                const myLP = isPlayerTurn ? BattleSystem.myLP : BattleSystem.oppLP;
                const oppLP = isPlayerTurn ? BattleSystem.oppLP : BattleSystem.myLP;
                if (myLP < oppLP) {
                    BattleSystem.log("👁️ ネフシュタンの眼光が相手を射抜く！");
                    const targetIdx = oppBoard.findIndex(s => s !== null);
                    if (targetIdx !== -1) {
                        this.triggerOnLeaveField(oppBoard[targetIdx], targetIdx, !isPlayerTurn);
                        oppBoard[targetIdx] = null;
                    }
                    if (isPlayerTurn) BattleSystem.myLP += 300; else BattleSystem.oppLP += 300;
                }
            }
        });
    },

    triggerOnTurnEnd(isPlayerTurn) {
        const myBoard = isPlayerTurn ? BattleSystem.myBoard : BattleSystem.oppBoard;
        const oppBoard = isPlayerTurn ? BattleSystem.oppBoard : BattleSystem.myBoard;

        // 持続効果のターン減少
        if (this.state.pandoraLockTurns > 0) this.state.pandoraLockTurns--;
        if (this.state.gorinshoActiveTurns > 0) this.state.gorinshoActiveTurns--;

        // 【炎輪の祈り】の自壊処理
        myBoard.forEach((slot, idx) => {
            if (slot && slot.isZombie) {
                BattleSystem.log(`🔥 炎輪の契約終了。「${slot.カード名}」は塵に還り、敵に500ダメージ。`);
                if (isPlayerTurn) BattleSystem.oppLP -= 500; else BattleSystem.myLP -= 500;
                myBoard[idx] = null;
            }
        });

        // 【ハッキング】の返却処理
        if (this.state.hackedMonster && isPlayerTurn) {
            this.state.hackedTurnCount++;
            if (this.state.hackedTurnCount >= 2) {
                const oppEmptyIdx = oppBoard.findIndex(s => s === null);
                if (oppEmptyIdx !== -1) {
                    oppBoard[oppEmptyIdx] = this.state.hackedMonster;
                    // 自ボードから削除
                    const myIdx = myBoard.findIndex(s => s && s.カード名 === this.state.hackedMonster.カード名);
                    if (myIdx !== -1) myBoard[myIdx] = null;
                    BattleSystem.log(`🌐 ハッキング終了。「${this.state.hackedMonster.カード名}」の制御権が相手に戻りました。`);
                    this.state.hackedMonster = null;
                }
            }
        }
    },

    // ==========================================
    // 6. ダメージ前トラップ・割り込み処理
    // ==========================================
    triggerBeforeDamage(damageAmount, sourceCard, isPlayerSide = true) {
        // 【自衛用拳銃】のインターセプトチェック
        const magicBoard = isPlayerSide ? BattleSystem.myMagicBoard : BattleSystem.oppMagicBoard;
        const trapIdx = magicBoard.findIndex(s => s && s.カード名 === "自衛用拳銃");

        if (trapIdx !== -1 && sourceCard && sourceCard.cost <= 3) {
            BattleSystem.log("🔫 トラップ発動！『自衛用拳銃』！");
            BattleSystem.log(`-> コスト3以下の「${sourceCard.カード名}」の効果ダメージを完全に無効化し、粉砕！`);
            if (isPlayerSide) BattleSystem.oppLP -= 500; else BattleSystem.myLP -= 500;
            magicBoard[trapIdx] = null; // トラップカードを消費
            return true; // ダメージ無効フラグをON
        }
        return false;
    },

    // ==========================================
    // 7. ドローイベントへの割り込み
    // ==========================================
    triggerOnDrawEvent(isPlayerSide = true) {
        // 【夢見の狭間】のコイントス処理
        // 夢見の狭間は発動時に破壊されない（永続する魔法として処理）
        const magicBoard = isPlayerSide ? BattleSystem.myMagicBoard : BattleSystem.oppMagicBoard;
        const hasHazama = magicBoard.some(s => s && s.カード名 === "夢見の狭間");

        if (hasHazama) {
            const coin = Math.random() < 0.5 ? "表" : "裏";
            BattleSystem.log(`🪙 [夢見の狭間] コイントス ⇒ 【${coin}】`);
            if (coin === "表") {
                BattleSystem.log("-> 運命は微笑んだ！追加でもう1枚ドロー！");
                if (isPlayerSide) BattleSystem.drawCard();
            } else {
                BattleSystem.log("-> 運命は拒絶した。墓地のカード1枚をランダムに山札へ戻す。");
                const myGrave = isPlayerSide ? BattleSystem.myGrave : BattleSystem.oppGrave;
                const myDeck = isPlayerSide ? BattleSystem.myDeck : BattleSystem.oppDeck;
                if (myGrave.length > 0) {
                    const randIdx = Math.floor(Math.random() * myGrave.length);
                    myDeck.push(myGrave.splice(randIdx, 1)[0]);
                }
            }
        }
    },

    // ==========================================
    // 8. 任意タイミング・起動効果アクティベート
    // ==========================================
    
    // 【雲盧之譜アリス】の①と②の効果
    activateAliceEffect(type, isPlayerSide = true) {
        if (type === 1 && !this.state.aliceUsedThisTurn.①) {
            this.state.aliceUsedThisTurn.① = true;
            if (isPlayerSide) {
                BattleSystem.myLP -= 500;
                BattleSystem.oppLP -= 1000;
            } else {
                BattleSystem.oppLP -= 500;
                BattleSystem.myLP -= 1000;
            }
            BattleSystem.log("♟️ アリスの効果①：自身の生命を削り、相手に1000の精神ダメージ！");
        } 
        else if (type === 2 && !this.state.aliceUsedThisTurn.②) {
            this.state.aliceUsedThisTurn.② = true;
            if (isPlayerSide) { BattleSystem.drawCard(); BattleSystem.drawCard(); }
            BattleSystem.log("♟️ アリスの効果②：LP変動の因果を書き換え、手札を2枚補給した。");
        }
    },

    // 【シュラフ・アリーナ】のピーピング（手札確認）効果
    activateSchlafPeeping(isPlayerSide = true) {
        if (isPlayerSide && BattleSystem.myCurrentCost >= 1) {
            BattleSystem.myCurrentCost -= 1;
            const oppHandNames = BattleSystem.oppHand.map(c => `[${c.カード名}]`).join(", ");
            BattleSystem.log(`👁️ シュラフ・アリーナ：敵の手札を完全にハックした ⇒ ${oppHandNames || "手札なし"}`);
        }
    }
};
