// エラッタオリジナリティ 対戦画面


let player = {

    name:"自分",

    lp:8000,

    cost:1,

    maxCost:1,

    hand:[],

    field:[]

};



let enemy = {

    name:"相手",

    lp:8000,

    cost:2,

    maxCost:2,

    hand:[],

    field:[]

};





function battleScreen(){


    app.innerHTML = `


    <h1>
    対戦
    </h1>


    <div>

    相手

    <h2>
    LP:
    ${enemy.lp}
    </h2>


    <div>

    場

    </div>


    </div>



    <hr>



    <h2>

    自分のターン

    </h2>


    <p>

    コスト:
    ${player.cost}
    /
    ${player.maxCost}

    </p>



    <h2>

    LP:
    ${player.lp}

    </h2>



    <div>

    手札

    </div>



    <div>

    場

    </div>



    <button onclick="endTurn()">

    ターン終了

    </button>


    `;


}





function endTurn(){


    player.cost = player.maxCost;


    player.maxCost++;



    battleScreen();


}

// エラッタオリジナリティ 対戦処理


let player = {

    name:"自分",

    lp:8000,

    cost:1,

    maxCost:1,

    deck:[],

    hand:[],

    field:[],

};



let enemy = {

    name:"相手",

    lp:8000,

    cost:2,

    maxCost:2,

    deck:[],

    hand:[],

    field:[]

};




// 対戦開始

async function startBattleGame(){


    let saveDeck =
    localStorage.getItem("deck");


    if(!saveDeck){

        alert("デッキがありません");

        return;

    }



    player.deck =
    JSON.parse(saveDeck);



    shuffle(player.deck);



    drawCards(player,5);



    changeScene("battle");


}






// シャッフル

function shuffle(array){


    for(let i=array.length-1;i>0;i--){


        let j =
        Math.floor(Math.random()*(i+1));


        [
            array[i],
            array[j]
        ]
        =
        [
            array[j],
            array[i]
        ];

    }

}





// ドロー

function drawCards(player,num){


    for(let i=0;i<num;i++){


        if(player.deck.length===0){

            alert("デッキ切れ");

            return;

        }



        player.hand.push(
            player.deck.shift()
        );


    }


}







// 対戦画面

function battleScreen(){


    app.innerHTML = `


<h1>
対戦
</h1>



<h2>
相手 LP:${enemy.lp}
</h2>



<div>

相手フィールド

</div>



<hr>



<h2>
自分 LP:${player.lp}
</h2>


<p>

コスト:

${player.cost}

/

${player.maxCost}

</p>



<h2>
手札
</h2>


<div class="cardList">


${
player.hand.map((card,index)=>`


<div class="card"
onclick="selectCard(${index})">

${card.name}

<br>

コスト:${card.cost}


</div>


`).join("")
}



</div>



<button onclick="endTurn()">

ターン終了

</button>



`;

}





// カード選択

function selectCard(index){


    let card =
    player.hand[index];


    alert(
    card.name+"を選択"
    );


}






function endTurn(){


    player.maxCost++;


    if(player.maxCost>10){

        player.maxCost=10;

    }



    player.cost =
    player.maxCost;



    drawCards(player,1);



    battleScreen();


}
