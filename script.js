// ======================================
// エラッタオリジナリティ
// script.js
// ======================================

// Renderサーバー
const SERVER_URL = "https://cardgame-sinuchi.onrender.com";

// Socket
let socket = null;

// カード
let cardsDatabase = [];
let myDeck = [];

// プロフィール
let profile = {
    name: "ゲスト"
};

// -------------------------------
// 起動
// -------------------------------
window.onload = async () => {

    loadLocalData();

    await loadCardsJSON();

};

// -------------------------------
// ローカルデータ読込
// -------------------------------
function loadLocalData() {

    const savedProfile = localStorage.getItem("eo_profile");

    if (savedProfile) {

        profile = JSON.parse(savedProfile);

        document.getElementById("username-input").value = profile.name;

        document.getElementById("profile-status").textContent =
            `おかえりなさい、${profile.name} さん！`;

    }

    const savedDeck = localStorage.getItem("eo_deck");

    if (savedDeck) {

        myDeck = JSON.parse(savedDeck);

    }

}

// -------------------------------
// プロフィール保存
// -------------------------------
function saveProfile() {

    const name = document.getElementById("username-input").value.trim();

    if (name === "") {

        alert("名前を入力してください。");
        return;

    }

    profile.name = name;

    localStorage.setItem("eo_profile", JSON.stringify(profile));

    document.getElementById("profile-status").textContent =
        "プロフィールを保存しました！";

}

// -------------------------------
// cards.json読込
// -------------------------------
async function loadCardsJSON() {

    try {

        const response = await fetch("cards.json");

        cardsDatabase = await response.json();

        console.log(cardsDatabase.length + "枚読み込みました。");

    } catch (e) {

        console.error(e);

        alert("cards.json の読み込みに失敗しました。");

    }

}

// -------------------------------
// 画面切替
// -------------------------------
function switchScreen(screenId) {

    document.querySelectorAll(".screen").forEach(screen => {

        screen.classList.remove("active");

    });

    document.getElementById(screenId).classList.add("active");

}

// -------------------------------
// デッキ編集
// -------------------------------
function openDeckEditor() {

    switchScreen("deck-editor");

}

function closeDeckEditor() {

    switchScreen("home-screen");

}

// -------------------------------
// デッキ保存
// -------------------------------
function saveDeck() {

    if (myDeck.length < 35 || myDeck.length > 60) {

        alert("デッキは35～60枚で作成してください。");

        return;

    }

    localStorage.setItem("eo_deck", JSON.stringify(myDeck));

    alert("保存しました。");

    switchScreen("home-screen");

}

// -------------------------------
// オンライン対戦
// -------------------------------
function startMatching() {

    alert("ここは後で作ります。");

}
