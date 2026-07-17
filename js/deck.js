/**
 * デッキ構築・制限チェックシステム
 */
const DeckEditor = {
    currentDeck: [], // 現在編集中のデッキ（カード名の配列、またはオブジェクトの配列）

    init() {
        this.loadDeckFromStorage();
        this.setupEventListeners();
        this.populateFilters();
    },

    // フィルター用セレクトボックスの初期化
    populateFilters() {
        const colorSelect = document.getElementById('deck-filter-color');
        if (!colorSelect) return;
        
        // 登場するすべての色を抽出
        const colors = new Set();
        Game.cardsData.forEach(c => {
            if (Array.isArray(c.color)) {
                c.color.forEach(col => colors.add(col));
            } else if (c.color) {
                colors.add(c.color);
            }
        });

        colors.forEach(color => {
            const opt = document.createElement('option');
            opt.value = color;
            opt.textContent = color;
            colorSelect.appendChild(opt);
        });
    },

    setupEventListeners() {
        const searchInput = document.getElementById('deck-search-input');
        const colorSelect = document.getElementById('deck-filter-color');
        const saveBtn = document.getElementById('btn-save-deck');

        if (searchInput) searchInput.addEventListener('input', () => this.renderPool());
        if (colorSelect) colorSelect.addEventListener('change', () => this.renderPool());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveDeckToStorage());
    },

    // カードプール（左側）の描画（検索・フィルター対応）
    renderPool() {
        const poolList = document.getElementById('card-pool-list');
        if (!poolList) return;
        poolList.innerHTML = '';

        const searchText = document.getElementById('deck-search-input').value.toLowerCase();
        const selectedColor = document.getElementById('deck-filter-color').value;

        Game.cardsData.forEach(card => {
            // 検索フィルター
            const matchName = card.カード名.toLowerCase().includes(searchText);
            let matchColor = true;
            if (selectedColor) {
                if (Array.isArray(card.color)) {
                    matchColor = card.color.includes(selectedColor);
                } else {
                    matchColor = card.color === selectedColor;
                }
            }

            if (matchName && matchColor) {
                const cardEl = CardSystem.createCardElement(card, 'pool');
                poolList.appendChild(cardEl);
            }
        });
    },

    // デッキ（右側）の描画
    renderDeck() {
        const deckContainer = document.getElementById('current-deck-cards');
        const countDisplay = document.getElementById('deck-card-count');
        if (!deckContainer) return;
        deckContainer.innerHTML = '';

        // 枚数カウント更新
        countDisplay.textContent = this.currentDeck.length;

        // デッキ内のカードを名前ごとに集計して見やすく表示
        const counts = {};
        this.currentDeck.forEach(card => {
            counts[card.カード名] = (counts[card.カード名] || 0) + 1;
        });

        Object.keys(counts).forEach(cardName => {
            const cardData = Game.cardsData.find(c => c.カード名 === cardName);
            if (!cardData) return;

            const row = document.createElement('div');
            row.className = 'deck-row-item';
            row.style.display = 'flex';
            row.style.justify = 'space-between';
            row.style.padding = '5px';
            row.style.background = 'rgba(255,255,255,0.05)';
            row.style.marginBottom = '4px';
            row.style.cursor = 'pointer';

            row.innerHTML = `
                <span>${cardData.カード名} x${counts[cardName]}</span>
                <span style="color: #ff4d4d;">削除</span>
            `;

            row.addEventListener('click', () => this.removeCardFromDeck(cardName));
            deckContainer.appendChild(row);
        });
    },

    // カードをデッキに追加（制限チェック付き）
    addCardToDeck(cardData) {
        // 1. 同名カードは3枚まで
        const sameCardCount = this.currentDeck.filter(c => c.カード名 === cardData.カード名).length;
        if (sameCardCount >= 3) {
            alert(`「${cardData.カード名}」はデッキに3枚までしか入れられません。`);
            return;
        }

        // 2. 最大70枚まで
        if (this.currentDeck.length >= 70) {
            alert("デッキの上限枚数は70枚です。");
            return;
        }

        this.currentDeck.push(cardData);
        this.renderDeck();
    },

    // カードをデッキから削除
    removeCardFromDeck(cardName) {
        const index = this.currentDeck.findIndex(c => c.カード名 === cardName);
        if (index !== -1) {
            this.currentDeck.splice(index, 1);
        }
        this.renderDeck();
    },

    // ストレージに保存（50枚〜70枚の判定）
    saveDeckToStorage() {
        if (this.currentDeck.length < 50 || this.currentDeck.length > 70) {
            alert(`デッキの枚数が不正です（現在: ${this.currentDeck.length}枚）。\n50枚以上70枚以下に調整してください。`);
            return;
        }

        // カード名だけの配列にして保存容量を節約
        const saveNames = this.currentDeck.map(c => c.カード名);
        localStorage.setItem('errata_deck', JSON.stringify(saveNames));
        alert("デッキを保存しました！");

        // ミッション達成チェック（デッキ保存）
        if (typeof MissionSystem !== 'undefined') {
            MissionSystem.triggerCheck('m002');
        }
    },

    // ストレージから読み込み
    loadDeckFromStorage() {
        const stored = localStorage.getItem('errata_deck');
        if (stored) {
            const names = JSON.parse(stored);
            this.currentDeck = names.map(name => Game.cardsData.find(c => c.カード名 === name)).filter(Boolean);
        } else {
            this.currentDeck = [];
        }
        Game.currentDeck = this.currentDeck;
        this.renderDeck();
    }
};
