// ====================================================================
// エラッタオリジナリティ - main.js (完全修正版)
// ====================================================================

const GameClient = {
    socket: null,
    gameState: null,
    uiState: { phase: "IDLE", selectedAttackerIndex: null },

    init() {
        this.socket = io('http://localhost:3000');
        this.bindEvents();
    },

    bindEvents() {
        // --- 画面切り替え（イベント委譲） ---
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-target]');
            if (button) {
                const targetId = button.getAttribute('data-target');
                const targetScreen = document.getElementById(targetId);
                if (targetScreen) {
                    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                    targetScreen.classList.add('active');
                }
            }
        });

        // --- 通信イベント ---
        this.socket.on("match-found", (data) => {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            if(document.getElementById("battle-screen")) document.getElementById("battle-screen").classList.add('active');
            this.logMessage("対戦相手が見つかりました！バトル開始！");
        });

        this.socket.on("game-update", (state) => {
            this.gameState = state;
            this.resetUIState();
            this.renderAll();
        });

        // --- 操作イベント ---
        const btnJoin = document.getElementById("btn-join");
        if (btnJoin) {
            btnJoin.addEventListener("click", (e) => {
                const playerName = document.getElementById("input-name") ? document.getElementById("input-name").value : "ゲスト";
                const sampleDeck = [{カード名: "一般兵士", type: "モンスター", cost: 1, ATK: 1000}];
                this.socket.emit("join-lobby", { name: playerName, deck: sampleDeck });
                if(document.getElementById("lobby-status")) document.getElementById("lobby-status").textContent = "マッチング待機中...";
                e.target.disabled = true;
            });
        }
    },

    resetUIState() { this.uiState = { phase: "IDLE", selectedAttackerIndex: null }; },
    
    logMessage(msg) {
        const logArea = document.getElementById("battle-log");
        if (logArea) {
            const p = document.createElement("p");
            p.textContent = msg;
            logArea.prepend(p);
        }
    },

    renderAll() {
        if (!this.gameState) return;
        this.renderStatus();
        this.renderBoard("player-board", this.gameState.me.board, true);
    },

    renderStatus() {
        const s = this.gameState;
        const myStatus = document.getElementById("player-status");
        if(myStatus) myStatus.innerHTML = "<strong>" + s.me.name + "</strong><br>LP: " + s.me.lp;
        const turnDisp = document.getElementById("turn-display");
        if(turnDisp) turnDisp.textContent = s.isMyTurn ? "あなたのターン" : "相手のターン";
    },

    renderBoard(id, data, isMine) {
        const cont = document.getElementById(id);
        if(!cont) return;
        cont.innerHTML = "";
        data.forEach((card, i) => {
            const el = document.createElement("div");
            el.className = card ? "card-item" : "empty-slot";
            if (card) el.textContent = card.カード名;
            cont.appendChild(el);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => GameClient.init());
