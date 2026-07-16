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
