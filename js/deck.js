// js/deck.js
const DeckManager = {
    cardPool: [], // 最初は空にしておく
    currentDeck: [],

    // 起動時に非同期 (async) でデータを読み込む
    async init() {
        await this.loadCardData(); // JSONの読み込みを待つ
        
        this.renderCardPool();
        this.updateDeckView();

        // 50枚〜70枚のルールチェック
        document.getElementById('btn-save-deck')?.addEventListener('click', () => {
            if(this.currentDeck.length < 50) {
                alert(`デッキは50枚以上必要です！（現在: ${this.currentDeck.length}枚）`);
            } else if(this.currentDeck.length > 70) {
                alert(`デッキは70枚以下にしてください！（現在: ${this.currentDeck.length}枚）`);
            } else {
                alert("デッキを保存しました！");
            }
        });
    },

    // cards.json を読み込む処理
    async loadCardData() {
        try {
            const response = await fetch('cards.json'); // JSONファイルを取得
            if (!response.ok) throw new Error("Network response was not ok");
            this.cardPool = await response.json(); // 変数に格納
        } catch (error) {
            console.error("カードデータの読み込みに失敗しました:", error);
            alert("cards.json の読み込みに失敗しました。\n※HTMLを直接開いている場合は、ローカルサーバー経由で開く必要があります。");
        }
    },

    renderCardPool() {
        const poolEl = document.getElementById('card-pool-list');
        if(!poolEl) return;
        poolEl.innerHTML = '';
        
        this.cardPool.forEach(card => {
            const cardEl = this.createCardElement(card);
            cardEl.onclick = () => this.addToDeck(card);
            poolEl.appendChild(cardEl);
        });
    },

    updateDeckView() {
        const deckEl = document.getElementById('current-deck-cards');
        if(!deckEl) return;
        deckEl.innerHTML = '';
        deckEl.className = 'card-grid';

        this.currentDeck.forEach((card, index) => {
            const cardEl = this.createCardElement(card);
            cardEl.onclick = () => this.removeFromDeck(index);
            deckEl.appendChild(cardEl);
        });
        
        const header = deckEl.previousElementSibling;
        if(header && header.tagName === 'H3') {
            header.textContent = `現在のデッキ (${this.currentDeck.length} / 70)`;
        }
    },

    addToDeck(card) {
        if(this.currentDeck.length >= 70) {
            alert("デッキは最大70枚までです！");
            return;
        }
        this.currentDeck.push(card);
        this.updateDeckView();
    },

    removeFromDeck(index) {
        this.currentDeck.splice(index, 1);
        this.updateDeckView();
    },

    createCardElement(card) {
        const el = document.createElement('div');
        el.className = 'card-item';
        el.title = card.effect ? card.effect : '効果なし';
        
        const bottomDisplay = card.atk !== null 
            ? `<div style="font-size:10px; text-align:center; color:#ff8888;">ATK:${card.atk}</div>` 
            : `<div style="font-size:10px; text-align:center; color:#aaa;">${card.type}</div>`;

        el.innerHTML = `
            <div style="font-size:10px; background:#111; color:#fff; padding:2px; text-align:center; border-bottom: 1px solid #444;">Cost:${card.cost}</div>
            
            <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:2px;">
                <span style="font-size:8px; color:#666; text-align:center; word-break:break-all;">${card.image || 'No Image'}</span>
            </div>
            
            <div class="card-name" style="color:#fff; border-top: 1px solid #444; padding-top:2px;">${card.name}</div>
            ${bottomDisplay}
        `;
        return el;
    }
};

window.addEventListener('DOMContentLoaded', () => DeckManager.init());
