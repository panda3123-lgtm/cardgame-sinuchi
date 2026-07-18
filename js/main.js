// js/main.js
const Game = {
    // ゲームの全体状態をここに集約
    state: {
        currentScreen: 'screen-title',
        profile: { name: 'プレイヤー', title: '初心者' },
        deck: [],
        cards: [] // cards.jsonから読み込む
    },

    async init() {
        // 1. データの読み込み
        await this.loadData();
        // 2. イベント登録
        this.bindEvents();
        // 3. 初期表示
        this.switchScreen('screen-title');
        console.log("Game System Initialized");
    },

    async loadData() {
        try {
            const res = await fetch('cards.json');
            this.state.cards = await res.json();
            console.log("カードデータ読み込み完了");
        } catch (e) {
            console.error("カード読み込み失敗", e);
        }
    },

    bindEvents() {
        // 画面切り替えボタンの共通化
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-target]');
            if (btn) this.switchScreen(btn.getAttribute('data-target'));
        });

        // デッキ構築画面の処理
        const btnSave = document.getElementById('btn-save-deck');
        if (btnSave) btnSave.onclick = () => this.saveDeck();
    },

    switchScreen(targetId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(targetId)?.classList.add('active');
        this.state.currentScreen = targetId;

        // 画面ごとの初期化処理
        if (targetId === 'screen-deck') this.renderDeckEditor();
    },

    renderDeckEditor() {
        const pool = document.getElementById('card-pool-list');
        pool.innerHTML = '';
        this.state.cards.forEach(card => {
            const el = document.createElement('div');
            el.className = 'card-item';
            el.innerHTML = `<div>Cost:${card.cost}</div><div>${card.name}</div>`;
            el.onclick = () => this.addCardToDeck(card);
            pool.appendChild(el);
        });
    },

    addCardToDeck(card) {
        this.state.deck.push(card);
        alert(`${card.name} をデッキに追加しました！`);
    },

    saveDeck() {
        if (this.state.deck.length < 50) {
            alert("50枚以上必要です！");
            return;
        }
        localStorage.setItem('myDeck', JSON.stringify(this.state.deck));
        alert("デッキを保存しました。これで対戦も可能です！");
    }
};

window.addEventListener('DOMContentLoaded', () => Game.init());
