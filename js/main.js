/**
 * エラッタオリジナリティ 全体管理クラス
 */
const Game = {
    // グローバルデータ
    cardsData: [],
    userProfile: {},
    userMissions: [],
    currentDeck: [],

    // 初期化処理
    async init() {
        console.log("エラッタオリジナリティ システム起動...");
        try {
            // 1. 各種JSONデータの読み込み
            await this.loadGameData();
            
            // 2. 各システムモジュールの初期化（今後作成するファイルと連携）
            if (typeof ProfileSystem !== 'undefined') ProfileSystem.init();
            if (typeof MissionSystem !== 'undefined') MissionSystem.init();
            if (typeof DeckEditor !== 'undefined') DeckEditor.init();
            
            console.log("すべてのシステムデータが正常にロードされました。");
        } catch (error) {
            console.error("データの初期化に失敗しました:", error);
        }
    },

    // JSONファイルの読み込み
    async loadGameData() {
        // cards.json の読み込み
        const cardsResponse = await fetch('cards.json');
        this.cardsData = await cardsResponse.json();

        // mission.json の読み込み
        const missionResponse = await fetch('mission.json');
        this.userMissions = await missionResponse.json();
    },

    // 画面切り替えシステム
    switchScreen(screenId) {
        // すべての画面を非アクティブにする
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 指定された画面を表示
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`画面遷移: ${screenId}`);
            
            // 画面遷移時の個別トリガー
            this.onScreenLoaded(screenId);
        }
    },

    // 画面が開かれたときに実行する処理
    onScreenLoaded(screenId) {
        if (screenId === 'screen-deck' && typeof DeckEditor !== 'undefined') {
            DeckEditor.renderPool();
        }
        if (screenId === 'screen-mission' && typeof MissionSystem !== 'undefined') {
            MissionSystem.renderMissions();
        }
    }
};

// ページ読み込み完了時に起動
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// ==========================================
// サーバーから送られてきた状態をUIに反映する関数
// ==========================================

function updateGame(state) {
    if (!state) return;

    // 1. LP・ステータス更新 (ID名をHTMLに合わせて調整)
    const playerStatus = document.getElementById("player-status");
    const opponentStatus = document.getElementById("opponent-status");
    if(playerStatus) playerStatus.textContent = `YOU: LP ${state.me.lp} / COST ${state.me.cost}`;
    if(opponentStatus) opponentStatus.textContent = `OPPONENT: LP ${state.enemy.lp} / COST ${state.enemy.cost}`;

    // 2. 盤面と手札の同期
    renderCards("player-hand", state.me.hand, true); // 手札はクリック可能
    renderCards("player-zones", state.me.field, false);
    renderCards("opponent-zones", state.enemy.field, false);

    // 3. ログ更新
    if(state.lastLog) addLog(state.lastLog);
}

// カードを一括描画する共通関数
function renderCards(containerId, cards, isClickable) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ""; // 一旦クリア
    cards.forEach(card => {
        const div = document.createElement("div");
        div.className = "card-item";
        div.innerHTML = `
            <img src="images/${card.id}.png" alt="${card.name}">
            <div class="card-name">${card.name}</div>
        `;
        // クリックイベントの登録
        if (isClickable) {
            div.onclick = () => socket.emit("play-card", { cardId: card.id });
        }
        container.appendChild(div);
    });
}

// ログ用
function addLog(message) {
    const log = document.getElementById("battle-log");
    if (!log) return;
    const p = document.createElement("p");
    p.textContent = message;
    log.prepend(p);
}



// ==========================================
// オンライン対戦機能の統合（main.js の最後に追加）
// ==========================================

const OnlineSystem = {
    socket: null,
    
    init() {
        // ソケット接続
        this.socket = io('http://localhost:3000');
        
        // サーバーからの全状態受信イベントを待ち受け
        this.socket.on('game_update', (state) => {
            updateGame(state); // 既存の描画関数を呼び出し
        });

        // 対戦開始時の処理
        this.socket.on('match_found', (data) => {
            Game.switchScreen('screen-battle');
            addLog(`対戦相手発見: ${data.opponent}`);
        });
    },

    // サーバーへアクションを送信する共通窓口
    sendAction(type, payload) {
        this.socket.emit('player_action', { type, payload });
    }
};

// 起動時に OnlineSystem も初期化するよう追記
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
    OnlineSystem.init(); // 追加
});
