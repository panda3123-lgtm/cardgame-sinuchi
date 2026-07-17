/**
 * オンライン通信同期・マッチングシステム
 */
const OnlineSystem = {
    socket: null,
    roomName: null,

    init() {
        // Socket.ioサーバーへ接続（ローカル検証時はlocalhost、本番はドメイン名に変えられます）
        this.socket = io('http://localhost:3000');
        this.setupSocketEvents();
        this.setupUI();
    },

    setupUI() {
        const matchBtn = document.getElementById('btn-start-matching');
        if (matchBtn) {
            matchBtn.addEventListener('click', () => this.startMatching());
        }
    },

    startMatching() {
        if (!Game.currentDeck || Game.currentDeck.length < 50) {
            alert("50枚以上の正規のデッキを構築して保存してからマッチングしてください。");
            return;
        }

        document.getElementById('matching-status').classList.remove('hidden');
        this.socket.emit('join_matchmaking', {
            playerName: Game.userProfile.name || "調査員"
        });
        console.log("マッチングキューに参入しました。");
    },

    setupSocketEvents() {
        // 対戦相手が見つかった
        this.socket.on('match_found', (data) => {
            this.roomName = data.room;
            document.getElementById('matching-status').classList.add('hidden');
            Game.switchScreen('screen-battle');
            
            BattleSystem.log(`対戦相手発見: ${data.opponent}`);
            
            // 先攻後攻の決定と、バトルの初期化
            const goesFirst = data.yourTurn;
            BattleSystem.startBattle(goesFirst, Game.currentDeck);
        });

        // 相手から盤面同期データを受信
        this.socket.on('sync_field', (opponentData) => {
            // 相手から見た自分(my)が、自分から見た相手(opp)になるため、逆転させて代入
            BattleSystem.oppBoard = opponentData.myBoard;
            BattleSystem.oppMagicBoard = opponentData.myMagicBoard;
            BattleSystem.oppLP = opponentData.myLP;
            
            BattleSystem.renderBoards();
            BattleSystem.updateUI();
        });

        // 相手がターンを終了した
        this.socket.on('opponent_turn_end', () => {
            BattleSystem.log("相手がターンを終了しました。");
            BattleSystem.startMyTurn();
        });

        // 相手が切断した
        this.socket.on('opponent_disconnected', () => {
            alert("対戦相手の通信が切断されました。あなたの不戦勝です！");
            BattleSystem.winGame();
        });
    },

    // 自分の最新の盤面・LP状態を相手に送りつける
    sendFieldSync() {
        if (!this.roomName) return;
        this.socket.emit('update_field', {
            room: this.roomName,
            field: {
                myBoard: BattleSystem.myBoard,
                myMagicBoard: BattleSystem.myMagicBoard,
                myLP: BattleSystem.myLP
            }
        });
    },

    // ターン終了シグナルを送信
    sendTurnEnd() {
        if (!this.roomName) return;
        this.socket.emit('turn_end', { room: this.roomName });
    }
};

// メインシステムロード後に初期化
window.addEventListener('DOMContentLoaded', () => {
    OnlineSystem.init();
});
