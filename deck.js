// エラッタオリジナリティ デッキ編成


let allCards = [];

let myDeck = [];





// デッキ画面

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
    ${myDeck.length}
    </span>

    枚

    </p>



    <div class="cardList" id="cards">

    </div>



    <div class="deckArea">


    <h2>
    現在のデッキ
    </h2>


    <div id="deck">

    </div>


    </div>



    <button onclick="saveDeck()">

    保存

    </button>



    <button onclick="changeScene('menu')">

    戻る

    </button>


    `;



    showCards();

    showDeck();


}







// カード一覧表示

function showCards(){


    let area =
    document.getElementById("cards");


    area.innerHTML = "";



    allCards.forEach(card=>{


        let div =
        document.createElement("div");


        div.className =
        "card";



        div.innerHTML = `

        ${card.name}

        <br>

        コスト:${card.cost}

        <br>

        ${card.type}

        `;



        div.onclick = ()=>{

            addDeck(card);

        };



        area.appendChild(div);


    });


}







// 制限確認

function canAddCard(card){


    let count =
    myDeck.filter(
        c=>c.name===card.name
    ).length;



    const limit = [

        "これあげる",
        "小夜峰綾香",
        "シュラフ・アリーナ"

    ];



    const semiLimit = [

        "ネズミ3.57864"

    ];



    if(limit.includes(card.name)
       && count >= 1){

        return false;

    }



    if(semiLimit.includes(card.name)
       && count >= 2){

        return false;

    }



    if(count >= 3){

        return false;

    }



    return true;


}







// デッキ追加

function addDeck(card){



    if(myDeck.length >= 60){

        alert(
        "デッキは60枚までです"
        );

        return;

    }




    if(!canAddCard(card)){


        alert(
        "このカードはこれ以上入れられません"
        );


        return;


    }




    myDeck.push(card);



    showDeck();



}








// デッキ表示

function showDeck(){


    let area =
    document.getElementById("deck");


    if(!area){

        return;

    }



    area.innerHTML = "";



    myDeck.forEach((card,index)=>{


        let div =
        document.createElement("div");



        div.innerHTML =

        `${index+1}.
        ${card.name}
        `;



        div.onclick = ()=>{


            myDeck.splice(index,1);


            showDeck();


        };



        area.appendChild(div);


    });



    let count =
    document.getElementById("deckCount");


    if(count){

        count.innerText =
        myDeck.length;

    }


}








// 保存

function saveDeck(){


    if(myDeck.length < 35){


        alert(
        "デッキは35枚以上必要です"
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
