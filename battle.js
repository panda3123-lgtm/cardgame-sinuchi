/**
 * バトル進行・盤面管理システム
 */
const BattleSystem = {
    myLP: 8000,
    oppLP: 8000,
    myMaxCost: 0,
    myCurrentCost: 0,
    isMyTurn: false,
    currentPhase: 'WAITING', // DRAW, MAIN, BATTLE, END
    myHand: [],
    myBoard: [null, null, null, null, null], // モンスターゾーン5枠
    myMagicBoard: [null, null, null, null, null], // 魔法・罠ゾーン5枠
    oppBoard: [null, null, null, null, null],
    oppMagicBoard: [null, null, null, null, null],
    selectedCardFromHand: null,
    selectedAttackerIndex: null,

    init() {
        this.setupFieldZones();
        this.setupEventListeners();
    },

    // 盤面のゾーン（枠）をHTMLに物理的に生成する
    setupFieldZones() {
        const pZones = document.getElementById('player-zones');
        const pMZones = document.getElementById('player-magic-zones');
        const oZones = document.getElementById('opponent-zones');
        const oMZones = document.getElementById('opponent-magic-zones');

        if (!pZones) return;

        pZones.innerHTML = ''; pMZones.innerHTML = '';
        oZones.innerHTML = ''; oMZones.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            pZones.appendChild(this.createZoneElement('player-monster', i));
            pMZones.appendChild(this.createZoneElement('player-magic', i));
            oZones.appendChild(this.createZoneElement('opponent-monster', i));
            oMZones.appendChild(this.createZoneElement('opponent-magic', i));
        }
    },

    createZoneElement(type, index) {
        const zone = document.createElement('div');
        zone.className = `field-zone ${type}-zone`;
        zone.dataset.index = index;
        zone.style.width = '70px';
        zone.style.height = '100%';
        zone.style.border = '1px solid #3a3d52';
        zone.style.borderRadius = '4px';
        zone.style.background = 'rgba(255,255,255,0.02)';

        zone.addEventListener('click', () => this.onZoneClicked(type, index));
        return zone;
    },

    setupEventListeners() {
        const turnEndBtn = document.getElementById('btn-turn-end');
        if (turnEndBtn) {
            turnEndBtn.addEventListener('click', () => {
                if (this.isMyTurn) this.endTurn();
            });
        }
    },

    // ゲーム開始（オンライン対戦成立時に呼ばれる）
    startBattle(goesFirst, initialDeck) {
        this.myLP = 8000;
        this.oppLP = 8000;
        this.myMaxCost = 0;
        this.myHand = [];
        this.myBoard = [null, null, null, null, null];
        this.myMagicBoard = [null, null, null, null, null];
        this.oppBoard = [null, null, null, null, null];
        this.oppMagicBoard = [null, null, null, null, null];
        
        // 山札（シャッフルされたカードデータのコピー配列）を作成
        this.deck = [...initialDeck];

        this.log("ゲーム開始！");
        this.updateUI();

        // 初期手札5枚ドロー
        for (let i = 0; i < 5; i++) {
            this.drawCard();
        }

        if (goesFirst) {
            this.startMyTurn();
        } else {
            this.startOpponentTurn();
        }
    },

    drawCard() {
        if (this.deck.length === 0) {
            this.log("山札がなくなりました！敗北します。");
            this.loseGame();
            return;
        }
        const card = this.deck.pop();
        this.myHand.push(card);
        this.renderHand();
    },

    renderHand() {
        const handContainer = document.getElementById('player-hand');
        if (!handContainer) return;
        handContainer.innerHTML = '';

        this.myHand.forEach((cardData, idx) => {
            const cardEl = CardSystem.createCardElement(cardData, 'battle');
            cardEl.dataset.handIndex = idx;
            if (this.selectedCardFromHand === idx) {
                cardEl.style.transform = 'translateY(-15px)';
                cardEl.style.boxShadow = '0 0 15px #00ffff';
            }
            handContainer.appendChild(cardEl);
        });
    },

    startMyTurn() {
        this.isMyTurn = true;
        this.myMaxCost = Math.min(this.myMaxCost + 1, 10); // 毎ターン最大コストが1ずつ増加（最大10）
        this.myCurrentCost = this.myMaxCost;
        this.currentPhase = 'DRAW';
        this.log(`あなたのターン (コスト: ${this.myCurrentCost})`);
        
        this.drawCard();
        this.currentPhase = 'MAIN';
        this.updateUI();
    },

    startOpponentTurn() {
        this.isMyTurn = false;
        this.currentPhase = 'OPPONENT_TURN';
        this.log("相手のターンです...");
        this.updateUI();
    },

    endTurn() {
        this.selectedCardFromHand = null;
        this.selectedAttackerIndex = null;
        this.log("ターンを終了しました。");
        OnlineSystem.sendTurnEnd();
        this.startOpponentTurn();
    },

    // 手札のカードをクリックした時の処理
    onCardClicked(cardData, element) {
        if (!this.isMyTurn || this.currentPhase !== 'MAIN') return;

        const handIdx = parseInt(element.dataset.handIndex);
        if (this.selectedCardFromHand === handIdx) {
            this.selectedCardFromHand = null; // 選択解除
        } else {
            this.selectedCardFromHand = handIdx;
        }
        this.renderHand();
    },

    // 盤面の各枠（ゾーン）をクリックした時の処理
    onZoneClicked(type, index) {
        if (!this.isMyTurn) return;

        // 手札から召喚/配置する処理
        if (this.selectedCardFromHand !== null && type.startsWith('player')) {
            const cardData = this.myHand[this.selectedCardFromHand];

            // コストチェック
            if (cardData.cost > this.myCurrentCost) {
                alert("コストが足りません！");
                return;
            }

            if (type === 'player-monster' && (cardData.type === 'モンスター' || cardData.type === 'トークン')) {
                if (this.myBoard[index] !== null) return; // すでに存在する
                this.myCurrentCost -= cardData.cost;
                this.myBoard[index] = { ...cardData, hasAttacked: false };
                this.myHand.splice(this.selectedCardFromHand, 1);
                this.selectedCardFromHand = null;
                
                this.log(`「${cardData.カード名}」を召喚！`);
                EffectSystem.triggerOnSummon(cardData, index); // 効果発動
                
                OnlineSystem.sendFieldSync();
                this.renderHand();
                this.renderBoards();
                this.updateUI();
            } 
            else if (type === 'player-magic' && (cardData.type === '魔法' || cardData.type === 'スキル' || cardData.type === '環境')) {
                if (this.myMagicBoard[index] !== null) return;
                this.myCurrentCost -= cardData.cost;
                this.myMagicBoard[index] = cardData;
                this.myHand.splice(this.selectedCardFromHand, 1);
                this.selectedCardFromHand = null;

                this.log(`「${cardData.カード名}」を配置！`);
                EffectSystem.triggerSpellActivate(cardData); // 効果発動

                OnlineSystem.sendFieldSync();
                this.renderHand();
                this.renderBoards();
                this.updateUI();
            }
        } 
        // 攻撃の宣言
        else if (type === 'player-monster' && this.myBoard[index] !== null) {
            if (this.myBoard[index].hasAttacked) {
                alert("このクリーチャーは今ターン既に攻撃しています。");
                return;
            }
            this.selectedAttackerIndex = index;
            this.log(`「${this.myBoard[index].カード名}」で攻撃先を選択してください。`);
        } 
        // 攻撃対象の選択（相手のモンスター、またはダイレクトアタック）
        else if (type === 'opponent-monster' && this.selectedAttackerIndex !== null) {
            this.executeAttack(this.selectedAttackerIndex, index);
        }
    },

    // ダイレクトアタック用ボタンや敵陣空きクリック時の処理
    executeDirectAttack() {
        if (this.selectedAttackerIndex === null) return;
        const attacker = this.myBoard[this.selectedAttackerIndex];
        
        // 相手の盤面にモンスターがいないかチェック
        const hasBlocker = this.oppBoard.some(slot => slot !== null);
        if (hasBlocker) {
            alert("相手のモンスターを全滅させるまでダイレクトアタックはできません。");
            return;
        }

        const dmg = attacker.ATK || 0;
        this.oppLP -= dmg;
        attacker.hasAttacked = true;
        this.log(`「${attacker.カード名}」のダイレクトアタック！ 相手に ${dmg} のダメージ！`);
        this.selectedAttackerIndex = null;

        if (this.oppLP <= 0) {
            this.winGame();
        } else {
            OnlineSystem.sendFieldSync();
            this.renderBoards();
            this.updateUI();
        }
    },

    executeAttack(attackerIdx, targetIdx) {
        const attacker = this.myBoard[attackerIdx];
        const target = this.oppBoard[targetIdx];

        if (!target) {
            // 対象のゾーンに敵がいない場合はそのままダイレクト可能かチェック
            this.executeDirectAttack();
            return;
        }

        this.log(`「${attacker.カード名}」が「${target.カード名}」に攻撃！`);
        
        const atkPower = attacker.ATK || 0;
        const defPower = target.DEF || 0;

        if (atkPower > defPower) {
            this.log(`「${target.カード名}」を撃破！`);
            this.oppBoard[targetIdx] = null;
            // 貫通ダメージ計算（任意ルール：攻撃力ー守備力の差分をLPに与える）
            const overflow = atkPower - defPower;
            this.oppLP -= overflow;
            this.log(`相手に ${overflow} の戦闘ダメージ！`);
        } else if (atkPower === defPower) {
            this.log("相打ち！両方のモンスターが破壊されました。");
            this.myBoard[attackerIdx] = null;
            this.oppBoard[targetIdx] = null;
        } else {
            this.log(`返り討ち！「${attacker.カード名}」が破壊されました。`);
            this.myBoard[attackerIdx] = null;
            this.myLP -= (defPower - atkPower);
        }

        attacker.hasAttacked = true;
        this.selectedAttackerIndex = null;

        if (this.myLP <= 0) this.loseGame();
        if (this.oppLP <= 0) this.winGame();

        OnlineSystem.sendFieldSync();
        this.renderBoards();
        this.updateUI();
    },

    renderBoards() {
        this.syncZoneDOM('player-monster', this.myBoard);
        this.syncZoneDOM('player-magic', this.myMagicBoard);
        this.syncZoneDOM('opponent-monster', this.oppBoard);
        this.syncZoneDOM('opponent-magic', this.oppMagicBoard);
    },

    syncZoneDOM(classNamePrefix, boardArray) {
        boardArray.forEach((cardData, idx) => {
            const zoneEl = document.querySelector(`.${classNamePrefix}-zone[data-index="${idx}"]`);
            if (!zoneEl) return;
            zoneEl.innerHTML = '';
            if (cardData) {
                const cardEl = CardSystem.createCardElement(cardData, 'none');
                cardEl.style.width = '100%';
                cardEl.style.height = '100%';
                zoneEl.appendChild(cardEl);
            }
        });
    },

    updateUI() {
        document.getElementById('player-status').textContent = `YOU: LP ${this.myLP} / COST ${this.myCurrentCost}/${this.myMaxCost}`;
        document.getElementById('opponent-status').textContent = `OPPONENT: LP ${this.oppLP}`;
        
        const phaseDisplay = document.getElementById('current-phase-display');
        if (phaseDisplay) phaseDisplay.textContent = this.isMyTurn ? `あなたのメインフェイズ` : `相手のターン`;
    },

    log(text) {
        const logBox = document.getElementById('battle-log');
        if (!logBox) return;
        logBox.innerHTML += `<div>${text}</div>`;
        logBox.scrollTop = logBox.scrollHeight;
    },

    winGame() {
        alert("🎉 VICTORY !! あなたの勝利です！");
        if (typeof ProfileSystem !== 'undefined') ProfileSystem.addWin();
        Game.switchScreen('screen-menu');
    },

    loseGame() {
        alert("💀 DEFEAT ... あなたの敗北です。");
        Game.switchScreen('screen-menu');
    }
};
