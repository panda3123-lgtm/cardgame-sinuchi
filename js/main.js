// ====================================================================
// エラッタオリジナリティ - main.js (完全統合フロントエンド)
// サーバーの400行のロジックと完全に噛み合う、妥協のないUIコントロール
// ====================================================================

const GameClient = {
    socket: null,
    gameState: null,
    
    // 画面側で保持すべき「プレイヤーの操作状態」
    uiState: {
        phase: "IDLE", // "IDLE" | "ATTACK_TARGETING"
        selectedAttackerIndex: null, // 攻撃しようとしている自陣モンスターのインデックス
    },

    init() {
        this.socket = io('http://localhost:3000');
        this.bindEvents();
    },

    bindEvents() {
        // ==========================================
        // 🖥️ UI画面切り替えイベント（今回追加した部分）
        // ==========================================
        document.querySelectorAll('button[data-target]').forEach(button => {
            button.addEventListener('click', (e) => {
                // 全ての画面から active を外す（非表示にする）
                document.querySelectorAll('.screen').forEach(screen => {
                    screen.classList.remove('active');
                });
                
                // ボタンに設定されたターゲット(次の画面)に active を付ける（表示する）
                const targetId = button.getAttribute('data-target');
                const targetScreen = document.getElementById(targetId);
                if (targetScreen) {
                    targetScreen.classList.add('active');
                }
            });
        });

        // ==========================================
        // 🌐 通信イベント
        // ==========================================
        this.socket.on("match-found", (data) => {
            console.log("マッチング成功！ Room:", data.roomId);
            
            // UI切り替えロジックを使ってバトル画面へ遷移
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById("battle-screen").classList.add('active');
            
            this.logMessage("対戦相手が見つかりました！バトル開始！");
        });

        this.socket.on("game-update", (state) => {
            this.gameState = state;
            // 状態が更新されたらUIの選択状態をリセット
            this.resetUIState();
            this.renderAll();
        });

        this.socket.on("opponent-disconnected", () => {
            alert("対戦相手が切断しました。あなたの勝利です！");
            location.reload();
        });

        // ==========================================
        // 🎮 UI操作イベント（バトル・ロビー）
        // ==========================================
        const btnJoin = document.getElementById("btn-join");
        if (btnJoin) {
            btnJoin.onclick = () => {
                const playerName = document.getElementById("input-name").value || "ゲスト";
                // ※本来はデッキ構築画面から取得するが、統合テスト用にデフォルトデッキを送信
                const sampleDeck = [
                    { カード名: "一般兵士", type: "モンスター", cost: 1, ATK: 1000 },
                    { カード名: "マネネ", type: "モンスター", cost: 2, ATK: 800 },
                    { カード名: "桜の精霊", type: "モンスター", cost: 4, ATK: 1500 },
                    { カード名: "参拝", type: "魔法", cost: 1 },
                    { カード名: "自衛用拳銃", type: "トラップ", cost: 2 },
                    { カード名: "クトゥルフ", type: "モンスター", cost: 8, ATK: 3000 },
                    { カード名: "ルルイエ", type: "魔法", cost: 3 }
                ];
                
                this.socket.emit("join-lobby", { name: playerName, deck: sampleDeck });
                
                const lobbyStatus = document.getElementById("lobby-status");
                if(lobbyStatus) lobbyStatus.textContent = "マッチング待機中...";
                btnJoin.disabled = true;
            };
        }

        const btnTurnEnd = document.getElementById("btn-turn-end");
        if (btnTurnEnd) {
            btnTurnEnd.onclick = () => {
                if (!this.gameState || !this.gameState.isMyTurn) return;
                this.socket.emit("end-turn");
            };
        }

        // ダイレクトアタック用のクリック領域（相手のLPやアイコン部分）
        const oppStatusArea = document.getElementById("opponent-status-area");
        if (oppStatusArea) {
            oppStatusArea.onclick = () => {
                this.handleDirectAttack();
            };
        }
    },

    // ==========================================
    // 🎮 プレイヤーのアクション（操作ロジック）
    // ==========================================

    // 手札をクリックした時の処理（カードの使用）
    handleHandClick(cardIndex, cardData) {
        if (!this.gameState.isMyTurn) {
            this.logMessage("相手のターン中です。");
            return;
        }
        if (this.gameState.me.currentCost < cardData.cost) {
            this.logMessage(`コストが足りません。(必要: ${cardData.cost})`);
            return;
        }

        // サーバーへカード使用要求を送信
        this.socket.emit("use-card", { cardIndex: cardIndex });
        this.logMessage(`${cardData.カード名} を使用しました！`);
    },

    // 自分の場のモンスターをクリックした時の処理（アタッカーの選択）
    handleMyBoardClick(boardIndex, cardData) {
        if (!this.gameState.isMyTurn) return;
        if (cardData.hasAttacked) {
            this.logMessage("このモンスターは既に攻撃済みです。");
            return;
        }

        // アタッカーとして選択状態にする
        this.uiState.phase = "ATTACK_TARGETING";
        this.uiState.selectedAttackerIndex = boardIndex;
        this.logMessage(`${cardData.カード名} で攻撃します。ターゲットを選んでください。`);
        this.renderAll(); // 選択状態の枠色などを反映するため再描画
    },

    // 相手の場のモンスターをクリックした時の処理（ターゲットの選択）
    handleOpponentBoardClick(boardIndex, targetCardData) {
        if (this.uiState.phase !== "ATTACK_TARGETING" || this.uiState.selectedAttackerIndex === null) {
            return;
        }

        const attacker = this.gameState.me.board[this.uiState.selectedAttackerIndex];
        this.socket.emit("attack", { 
            attackerIndex: this.uiState.selectedAttackerIndex, 
            targetIndex: boardIndex 
        });

        this.logMessage(`${attacker.カード名} が ${targetCardData.カード名} に攻撃！`);
        this.resetUIState();
    },

    // 相手プレイヤーへのダイレクトアタック
    handleDirectAttack() {
        if (this.uiState.phase !== "ATTACK_TARGETING" || this.uiState.selectedAttackerIndex === null) {
            return;
        }

        // 相手の場にモンスターがいる場合はダイレクトアタック不可（挑発等のルールがあればここに追記可能）
        const hasOpponentMonsters = this.gameState.opp.board.some(slot => slot !== null);
        if (hasOpponentMonsters) {
            this.logMessage("相手の場にモンスターがいるため、ダイレクトアタックできません！");
            return;
        }

        const attacker = this.gameState.me.board[this.uiState.selectedAttackerIndex];
        this.socket.emit("attack", { 
            attackerIndex: this.uiState.selectedAttackerIndex, 
            targetIndex: null // nullはダイレクトアタックのフラグとしてサーバーで処理される
        });

        this.logMessage(`${attacker.カード名} のダイレクトアタック！`);
        this.resetUIState();
    },

    resetUIState() {
        this.uiState.phase = "IDLE";
        this.uiState.selectedAttackerIndex = null;
    },

    logMessage(msg) {
        const logArea = document.getElementById("battle-log");
        if (logArea) {
            const p = document.createElement("p");
            p.textContent = msg;
            logArea.prepend(p); // 最新のログを上に追加
        }
        console.log("[GAME]:", msg);
    },

    // ==========================================
    // 🎨 レンダリング（画面描画）
    // ==========================================

    renderAll() {
        if (!this.gameState) return;

        // 勝敗判定
        if (this.gameState.winnerId) {
            const isWin = this.gameState.winnerId === this.socket.id;
            alert(isWin ? "あなたの勝利です！" : "相手の勝利です...");
            return;
        }

        // ステータスヘッダーの更新
        this.renderStatus();

        // 各ゾーンの描画
        this.renderHand(this.gameState.me.hand);
        
        this.renderBoard("player-board", this.gameState.me.board, true);
        this.renderMagicBoard("player-magic", this.gameState.me.magicBoard, true);
        
        this.renderBoard("opponent-board", this.gameState.opp.board, false);
        this.renderMagicBoard("opponent-magic", this.gameState.opp.magicBoard, false);
    },

    renderStatus() {
        const state = this.gameState;
        
        const myStatus = document.getElementById("player-status");
        if(myStatus) {
            myStatus.innerHTML = `
                <strong>${state.me.name || "YOU"}</strong><br>
                LP: ${state.me.lp} | COST: ${state.me.currentCost} / ${state.me.maxCost}<br>
                墓地: ${state.me.graveCount}枚
            `;
        }

        const oppStatus = document.getElementById("opponent-status-area");
        if(oppStatus) {
            oppStatus.innerHTML = `
                <strong>${state.opp.name || "OPPONENT"}</strong><br>
                LP: ${state.opp.lp} | COST: ${state.opp.currentCost} / ${state.opp.maxCost}<br>
                手札: ${state.opp.handCount}枚 | 墓地: ${state.opp.graveCount}枚
            `;
            // ターゲット選択中の場合、相手の顔（ステータス領域）を赤く光らせて攻撃可能をアピール
            if (this.uiState.phase === "ATTACK_TARGETING") {
                oppStatus.style.border = "2px solid red";
                oppStatus.style.cursor = "crosshair";
            } else {
                oppStatus.style.border = "none";
                oppStatus.style.cursor = "default";
            }
        }

        const turnDisplay = document.getElementById("turn-display");
        if(turnDisplay) {
            turnDisplay.textContent = `Turn ${state.turnCount} - ${state.isMyTurn ? "あなたのターン" : "相手のターン"}`;
        }
            
        const btnTurnEnd = document.getElementById("btn-turn-end");
        if(btnTurnEnd) {
            btnTurnEnd.disabled = !state.isMyTurn;
        }
    },

    renderHand(handData) {
        const container = document.getElementById("player-hand");
        if(!container) return;
        container.innerHTML = "";

        handData.forEach((card, index) => {
            const cardEl = this.createCardElement(card);
            
            // コスト不足の場合は暗くするなどの視覚効果
            if (this.gameState.me.currentCost < card.cost) {
                cardEl.style.opacity = "0.5";
            }

            cardEl.onclick = () => this.handleHandClick(index, card);
            container.appendChild(cardEl);
        });
    },

    renderBoard(containerId, boardData, isMine) {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = "";

        boardData.forEach((card, index) => {
            if (!card) {
                const emptyEl = document.createElement("div");
                emptyEl.className = "empty-slot";
                container.appendChild(emptyEl);
                return;
            }

            const cardEl = this.createCardElement(card);

            // 自分の場のモンスターの場合の処理
            if (isMine) {
                if (card.hasAttacked) {
                    cardEl.style.opacity = "0.5"; // 攻撃済みは暗くする
                } else if (this.uiState.selectedAttackerIndex === index) {
                    cardEl.style.border = "3px solid yellow"; // 選択中アタッカーは強調
                }
                cardEl.onclick = () => this.handleMyBoardClick(index, card);
            } 
            // 相手の場のモンスターの場合の処理（ターゲット選択）
            else {
                if (this.uiState.phase === "ATTACK_TARGETING") {
                    cardEl.style.cursor = "crosshair"; // 狙撃カーソルに変更
                    cardEl.style.boxShadow = "0 0 10px red";
                }
                cardEl.onclick = () => this.handleOpponentBoardClick(index, card);
            }

            container.appendChild(cardEl);
        });
    },

    renderMagicBoard(containerId, magicData, isMine) {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = "";

        magicData.forEach((card, index) => {
            if (!card) {
                const emptyEl = document.createElement("div");
                emptyEl.className = "empty-slot magic-slot";
                container.appendChild(emptyEl);
                return;
            }

            const cardEl = this.createCardElement(card);
            // 魔法・罠はクリックアクションを設けない（サーバー側で自動トリガーされるため）
            container.appendChild(cardEl);
        });
    },

    // カードのDOM要素を生成するヘルパー関数
    createCardElement(card) {
        const el = document.createElement("div");
        el.className = "card-item";
        
        // モンスターか魔法かで表示内容を変える
        if (card.type === "モンスター") {
            el.innerHTML = `
                <div class="card-name">${card.カード名}</div>
                <div class="card-cost">C:${card.cost}</div>
                <div class="card-atk">ATK: ${card.ATK || 0}</div>
            `;
        } else {
            el.innerHTML = `
                <div class="card-name">${card.カード名}</div>
                <div class="card-cost">C:${card.cost}</div>
                <div class="card-type">${card.type}</div>
            `;
        }
        return el;
    }
};

// アプリケーション起動
window.addEventListener('DOMContentLoaded', () => GameClient.init());
