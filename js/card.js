// =================================
// エラッタオリジナリティ
// card.js
// =================================


let cardDatabase = [];


// カード読み込み
async function loadCards() {

    try {

        const response = await fetch("cards.json");

        cardDatabase = await response.json();

        console.log(
            "カード読み込み完了",
            cardDatabase.length + "枚"
        );


        renderCardList();


    } catch(error) {

        console.error(
            "cards.json読み込み失敗",
            error
        );

    }

}



// =================================
// カード一覧表示
// =================================

function renderCardList(cards = cardDatabase) {


    const area =
        document.getElementById("card-list");


    if(!area) return;


    area.innerHTML = "";


    cards.forEach(card => {


        const element =
            document.createElement("div");


        element.className =
            "card";


        element.innerHTML = `

            <img 
            src="images/${card.image}"
            alt="${card.name}"
            >


            <h3>${card.name}</h3>


            <p>
            ${card.type}
            </p>


            <p>
            コスト：${card.cost}
            </p>


            <p>
            ATK：
            ${card.atk ?? "-"}
            </p>

        `;


        element.onclick = () => {

            showCardDetail(card);

        };


        element.oncontextmenu = (e)=>{

            e.preventDefault();

            addCardToDeck(card);

        };


        area.appendChild(element);


    });

}



// =================================
// カード詳細
// =================================

function showCardDetail(card) {


    const detail =
        document.getElementById(
            "card-detail"
        );


    if(detail){


        detail.innerHTML = `

        <img src="images/${card.image}">


        <h2>${card.name}</h2>


        <p>
        種類：
        ${card.type}
        </p>


        <p>
        コスト：
        ${card.cost}
        </p>


        <p>
        ATK：
        ${card.atk ?? "-"}
        </p>


        <p>
        色：
        ${card.color.join(",")}
        </p>


        <p>
        ${card.effect}
        </p>


        `;


        return;

    }


    alert(
`${card.name}

種類:${card.type}

コスト:${card.cost}

ATK:${card.atk ?? "-"}

${card.effect}`
    );

}



// =================================
// 検索
// =================================

function searchCards(keyword){


    const result =
        cardDatabase.filter(card =>

            card.name.includes(keyword)

        );


    renderCardList(result);

}



// 起動

loadCards();
