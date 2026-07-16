// ======================================
// エラッタオリジナリティ
// script.js
// ブラウザ側
// ======================================



// ==========================
// Socket
// ==========================


const socket =
io();



let cardsDatabase=[];


let myDeck=[];


let profile={

    name:"ゲスト"

};







// ==========================
// 起動
// ==========================


window.onload=async()=>{


    loadLocalData();


    await loadCardsJSON();


};







// ==========================
// データ読み込み
// ==========================


function loadLocalData(){


    let saved =
    localStorage.getItem(
        "eo_profile"
    );


    if(saved){


        profile =
        JSON.parse(saved);


        document.getElementById(
            "username-input"
        ).value =
        profile.name;


    }



    let deck =
    localStorage.getItem(
        "eo_deck"
    );


    if(deck){


        myDeck =
        JSON.parse(deck);


    }


}







// ==========================
// プロフィール
// ==========================


function saveProfile(){



    let name =
    document.getElementById(
        "username-input"
    )
    .value
    .trim();




    if(name===""){


        alert(
        "名前を入力してください"
        );


        return;

    }




    profile.name=name;



    localStorage.setItem(
        "eo_profile",
        JSON.stringify(profile)
    );


}







// ==========================
// cards.json
// ==========================


async function loadCardsJSON(){



    try{


        let response =
        await fetch(
            "cards.json"
        );


        cardsDatabase =
        await response.json();


        console.log(
            cardsDatabase.length+
            "枚読み込み"
        );



    }
    catch(e){


        console.error(e);


    }


}







// ==========================
// 画面切替
// ==========================


function switchScreen(id){


    document
    .querySelectorAll(
        ".screen"
    )
    .forEach(
        s=>s.classList.remove(
            "active"
        )
    );


    document
    .getElementById(id)
    .classList.add(
        "active"
    );


}







// ==========================
// デッキ
// ==========================


function openDeckEditor(){


    switchScreen(
        "deck-editor"
    );


}



function closeDeckEditor(){


    switchScreen(
        "home-screen"
    );


}







function saveDeck(){


    if(
    myDeck.length<35 ||
    myDeck.length>60
    ){


        alert(
        "デッキは35～60枚"
        );


        return;


    }



    localStorage.setItem(
        "eo_deck",
        JSON.stringify(myDeck)
    );


}








// ==========================
// マッチング
// ==========================


function startMatching(){


    switchScreen(
        "matching-screen"
    );



    socket.emit(
        "join-lobby",
        {


            name:
            profile.name,


            deck:
            myDeck


        }
    );


}







// ==========================
// マッチ成功
// ==========================


socket.on(
"match-found",
(data)=>{


    console.log(
        "対戦開始",
        data
    );


    switchScreen(
        "battle-screen"
    );


});







// ==========================
// 状態更新
// ==========================


socket.on(
"game-update",
(state)=>{


    updateGame(
        state
    );


});







function updateGame(state){



    if(!state)
    return;



    if(state.me){


        document.getElementById(
            "player-lp"
        )
        .textContent =
        state.me.lp;


    }



    if(state.enemy){


        document.getElementById(
            "enemy-lp"
        )
        .textContent =
        state.enemy.lp;


    }



}







// ==========================
// ターン終了
// ==========================


function endTurn(){



    socket.emit(
        "end-turn"
    );


}
