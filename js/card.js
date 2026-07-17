/**
 * カードオブジェクト生成・管理システム
 */
const CardSystem = {
    // 日本語のJSONデータからHTML要素を生成する
    createCardElement(cardData, location = 'pool') {
        const card = document.createElement('div');
        card.className = `card-item color-${cardData.color || 'none'}`;
        card.dataset.id = cardData.id || cardData.カード名; // IDがなければカード名をキーにする

        // カードの枠色を決定（複数色ある場合は最初の色をベースに）
        let borderColors = cardData.color || ["グレー"];
        if (Array.isArray(borderColors)) {
            card.style.borderColor = this.getColorCode(borderColors[0]);
        } else {
            card.style.borderColor = this.getColorCode(borderColors);
        }

        // カード内部のテキスト・レイアウト構築
        card.innerHTML = `
            <div class="card-cost">${cardData.cost !== undefined ? cardData.cost : ''}</div>
            <div class="card-name">${cardData.カード名}</div>
            <div class="card-type-line">[${cardData.type || '不明'}]</div>
            <div class="card-stats">
                ${cardData.ATK !== undefined ? `<span class="atk">⚔️${cardData.ATK}</span>` : ''}
                ${cardData.DEF !== undefined ? `<span class="def">🛡️${cardData.DEF}</span>` : ''}
            </div>
        `;

        // クリック時の挙動（プールにいるか、デッキにいるか、バトル中か）
        card.addEventListener('click', () => {
            if (location === 'pool') {
                DeckEditor.addCardToDeck(cardData);
            } else if (location === 'deck') {
                DeckEditor.removeCardFromDeck(cardData.カード名);
            } else if (location === 'battle') {
                BattleSystem.onCardClicked(cardData, card);
            }
        });

        return card;
    },

    // 日本語の色名からCSS用のカラーコードを返す
    getColorCode(colorName) {
        const colors = {
            "赤": "#ff4d4d",
            "青": "#4da6ff",
            "緑": "#4dff4d",
            "黄": "#ffff4d",
            "黒": "#333333",
            "白": "#ffffff",
            "ピンク": "#ff99cc",
            "紫": "#b366ff",
            "オレンジ": "#ffa64d",
            "金": "#ffd700"
        };
        return colors[colorName] || "#888888";
    }
};
