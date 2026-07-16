// エラッタオリジナリティ デッキ編成


let allCards = [];

let myDeck = [];




// デッキ画面表示

async function deckScreen(){


    let response = await fetch("cards.json");

    allCards = await response.json();



    app.innerHTML = `


    <h1>
    デッキ編成
    </h1>


    <p>
    デッキ枚数：
    <span id="deckCount">
    0
    </span>
    枚
    </p>



    <div id="cards"></div>



    <button onclick="saveDeck()">

    保存

    </button>



    <button onclick="changeScene('menu')">

    戻る

    </button>


    `;



    showCards();


}





// カード一覧表示

function showCards(){


    let area =
    document.getElementById("cards");


    area.innerHTML = "";



    allCards.forEach(card=>{


        let button =
        document.createElement("button");



        button.innerHTML =
        card.name
        +
        "<br>"
        +
        "コスト:"
        +
        card.cost;



        button.onclick = ()=>{

            addDeck(card);

        };



        area.appendChild(button);



    });


}





// デッキ追加

function addDeck(card){


    if(myDeck.length >= 60){

        alert(
        "デッキは60枚まで"
        );

        return;

    }



    myDeck.push(card);



    document.getElementById(
    "deckCount"
    ).innerText =
    myDeck.length;



}




// 保存

function saveDeck(){


    if(myDeck.length < 35){

        alert(
        "デッキは35枚以上必要"
        );

        return;

    }



    localStorage.setItem(
    "deck",
    JSON.stringify(myDeck)
    );



    alert(
    "デッキ保存完了"
    );


}

// カード枚数確認

function cardLimitCheck(card){


    let count = myDeck.filter(
        c => c.name === card.name
    ).length;


    // 制限カード

    let limitCards = [
        "これあげる",
        "小夜峰綾香",
        "シュラフ・アリーナ"
    ];


    // 準制限カード

    let semiLimitCards = [
        "ネズミ3.57864"
    ];



    if(limitCards.includes(card.name)
       && count >= 1){

        return false;

    }



    if(semiLimitCards.includes(card.name)
       && count >= 2){

        return false;

    }



    if(count >= 3){

        return false;

    }



    return true;

}
