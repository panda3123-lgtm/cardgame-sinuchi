// =================================
// エラッタオリジナリティ
// deck.js
// =================================


let currentDeck = [];



// 制限設定

const regulation = {


    limited:[

        "これあげる",
        "小夜峰綾香",
        "シュラフ・アリーナ"

    ],


    semiLimited:[

        "ネズミ3.57864"

    ]

};



// =================================
// デッキ追加
// =================================

function addCardToDeck(card){


    const count =
        currentDeck.filter(
            c=>c.name===card.name
        ).length;



    let limit = 3;



    if(
        regulation.limited
        .includes(card.name)
    ){

        limit = 1;

    }


    else if(
        regulation.semiLimited
        .includes(card.name)
    ){

        limit = 2;

    }



    if(count >= limit){

        alert(
        "このカードはこれ以上入れられません"
        );

        return;

    }



    currentDeck.push(card);


    renderDeck();


}



// =================================
// デッキ削除
// =================================

function removeCard(index){


    currentDeck.splice(
        index,
        1
    );


    renderDeck();


}



// =================================
// デッキ表示
// =================================

function renderDeck(){


    const area =
        document.getElementById(
            "deck-list"
        );


    if(!area)return;



    area.innerHTML = `

    <h3>
    デッキ
    (${currentDeck.length}枚)
    </h3>

    `;



    currentDeck.forEach(
        (card,index)=>{


        const div =
        document.createElement("div");


        div.innerHTML = `

        ${card.name}

        <button>
        削除
        </button>

        `;



        div.querySelector("button")
        .onclick=()=>{

            removeCard(index);

        };


        area.appendChild(div);


    });


}



// =================================
// デッキチェック
// =================================

function checkDeck(){


    if(
        currentDeck.length <35 ||
        currentDeck.length >60
    ){

        alert(
        "デッキは35〜60枚です"
        );


        return false;

    }


    return true;


}



// =================================
// 保存
// =================================

function saveDeck(){


    if(!checkDeck())
        return;



    localStorage.setItem(

        "errataDeck",

        JSON.stringify(
            currentDeck
        )

    );


if(typeof progressMission === "function"){

    progressMission(
        "deck_save",
        1
    );

}
    
    alert(
    "デッキを保存しました"
    );


}



// =================================
// 読み込み
// =================================

function loadDeck(){


    const data =
    localStorage.getItem(
        "errataDeck"
    );


    if(data){

        currentDeck =
        JSON.parse(data);

        renderDeck();

    }


}



// 起動

loadDeck();
