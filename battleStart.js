// エラッタオリジナリティ 対戦準備


function battleStartScreen(){


    let deck =
    localStorage.getItem("deck");



    app.innerHTML = `


    <h1>
    対戦準備
    </h1>


    ${
        deck
        ?
        `
        <p>
        デッキ確認完了
        </p>

        <p>
        枚数：
        ${JSON.parse(deck).length}
        枚
        </p>


        <button onclick="startBattleGame()">

        対戦開始

        </button>

        `
        :
        `
        <p>
        デッキがありません
        </p>

        `
    }



    <button onclick="changeScene('menu')">

    戻る

    </button>


    `;


}





function startBattleGame(){


    alert(
    "対戦画面へ移動します"
    );


}
