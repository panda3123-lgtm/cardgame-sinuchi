// エラッタオリジナリティ メイン制御


let scene = "title";


const app = document.getElementById("app");




// 画面変更

function changeScene(next){

    scene = next;

    render();

}




// 描画

function render(){


    if(scene === "title"){

        showTitle();

    }


    else if(scene === "menu"){

        showMenu();

    }


    else if(scene === "deck"){

        deckScreen();

    }


}






// タイトル

function showTitle(){


    app.innerHTML = `


    <h1>
    エラッタオリジナリティ
    </h1>


    <button onclick="changeScene('menu')">

    START

    </button>


    `;


}






// メニュー

function showMenu(){


    app.innerHTML = `


    <h1>
    メニュー
    </h1>



    <button onclick="battleStart()">

    対戦開始

    </button>



    <button onclick="changeScene('deck')">

    デッキ編成

    </button>



    <button onclick="cardList()">

    カード一覧

    </button>



    <button onclick="setting()">

    設定

    </button>



    `;


}







// 対戦

function battleStart(){


    alert(
    "対戦機能は次の段階で追加します"
    );


}






// カード一覧

function cardList(){


    alert(
    "カード一覧は後で追加します"
    );


}






// 設定

function setting(){


    alert(
    "設定は後で追加します"
    );


}






// 起動

render();
