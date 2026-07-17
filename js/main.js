// =================================
// エラッタオリジナリティ
// main.js
// =================================


// 画面取得
const screens = document.querySelectorAll(".screen");


// 画面切り替え
function changeScreen(screenId) {

    screens.forEach(screen => {

        screen.classList.remove("active");

    });


    const target = document.getElementById(screenId);


    if (target) {

        target.classList.add("active");

    }

}



// =================================
// タイトル → ホーム
// =================================

const startButton =
    document.getElementById("start-button");


if (startButton) {

    startButton.addEventListener(
        "click",
        () => {

            changeScreen("home-screen");

        }
    );

}



// =================================
// メニューカード
// =================================

const menuButtons =
    document.querySelectorAll(
        ".card-button"
    );


menuButtons.forEach(button => {


    button.addEventListener(
        "click",
        () => {


            const target =
                button.dataset.screen;


            changeScreen(target);


        }
    );


});



// =================================
// 戻るボタン
// =================================

const backButtons =
    document.querySelectorAll(
        ".back-button"
    );


backButtons.forEach(button => {


    button.addEventListener(
        "click",
        () => {


            changeScreen(
                "home-screen"
            );


        }
    );


});



// =================================
// 初期化
// =================================


console.log(
    "エラッタオリジナリティ 起動"
);
