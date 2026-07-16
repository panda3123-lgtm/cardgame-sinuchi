// エラッタオリジナリティ メイン制御


let scene = "title";


const app = document.getElementById("app");



// 画面切り替え

function changeScene(next){

    scene = next;

    render();

}



// 描画

function render(){


    if(scene === "title"){

        titleScreen();

    }


    else if(scene === "menu"){

        menuScreen();

    }


}



// タイトル画面

function titleScreen(){


    app.innerHTML = `


    <h1>
    エラッタオリジナリティ
    </h1>


    <button onclick="changeScene('menu')">

    START

    </button>


    `;


}




// メニュー画面

function menuScreen(){


    app.innerHTML = `


    <h1>
    メニュー
    </h1>


    <button onclick="battleStart()">

    対戦開始

    </button>



    <button onclick="deckEdit()">

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




// 仮ボタン

function battleStart(){

    alert("対戦画面は後で作成");

}



function deckEdit(){

    alert("デッキ編成は後で作成");

}



function cardList(){

    alert("カード一覧は後で作成");

}



function setting(){

    alert("設定は後で作成");

}



// 起動

render();
