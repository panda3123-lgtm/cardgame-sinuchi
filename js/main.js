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
