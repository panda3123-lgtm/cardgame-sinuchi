// ======================================
// エラッタオリジナリティ
// script.js
// ======================================

// ---------- サーバー ----------
const SERVER_URL = "https://cardgame-sinuchi.onrender.com";

let socket = null;

// ---------- カード ----------
let cardsDatabase = [];
let myDeck = [];

// ---------- プロフィール ----------
let profile = {
    name: "ゲスト"
};

// ---------- ゲーム状態 ----------
let gameState = {
    isMyTurn: false,

    myLP: 8000,
    opponentLP: 8000,

    myCost: 0,
    myMaxCost: 0,
    opponentCost: 0,

    myDeckArray: [],

    myHand: [],
    myField: [],
    opponentField: [],

    myGraveyard: [],
    opponentGraveyard: [],

    isNextSummonFaceDown: false,

    apocalypseCount: 0,

    activeEffects: {
        goshoBonus: false
    }
};

// ---------- イラスト判定 ----------
const CARD_TAGS = {

    gun: [
        "一般兵士",
        "いつの日かの飛鉄「佐貫」",
        "シュラフ・アリーナ",
        "自衛用拳銃",
        "次回策"
    ],

    sword: [
        "八影月輪",
        "黒き刃",
        "永遠の追放者エリシオン",
        "静寂の剣士ジーク"
    ],

    katana: [
        "小夜峰綾香",
        "カワウソ",
        "奔華片名代",
        "ユリカ"
    ],

    blade: [
        "八影月輪",
        "黒き刃",
        "永遠の追放者エリシオン",
        "静寂の剣士ジーク",

        "小夜峰綾香",
        "カワウソ",
        "奔華片名代",
        "ユリカ",

        "氷結の地",
        "イソナ",
        "異界の聖槍ロンギヌス",
        "ラーツ・グローブ"
    ]

};

// ---------- 起動 ----------
window.onload = async () => {

    loadLocalData();

    await loadCardsJSON();

};

// ======================================
// 以下に関数を書いていく
// ======================================
