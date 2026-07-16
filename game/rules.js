// ======================================
// エラッタオリジナリティ
// rules.js
// ルール管理
// ======================================





const RULES = {



// デッキ枚数

minDeck:35,

maxDeck:60,



// 同名カード枚数

maxSameCard:3



};









// ==========================
// 制限カード
// ==========================


const LIMITS = {



banned:[


    "フェンリル",

    "雪の包容"


],





limited:{


    "これあげる":1,


    "小夜峰綾香":1,


    "シュラフ・アリーナ":1


},





semiLimited:{


    "ネズミ3.57864":2


}





};









// ==========================
// デッキチェック
// ==========================


function checkDeck(deck){



if(
deck.length < RULES.minDeck ||
deck.length > RULES.maxDeck
){


return false;


}







let count={};





for(
let card of deck
){





if(
LIMITS.banned
.includes(card.name)
){


return false;


}







count[card.name]
=
(
count[card.name] || 0
)
+1;



}








for(
let name in count
){



let limit =
RULES.maxSameCard;





if(
LIMITS.limited[name]
){


limit =
LIMITS.limited[name];


}





if(
LIMITS.semiLimited[name]
){


limit =
LIMITS.semiLimited[name];


}







if(
count[name] > limit
){


return false;


}



}





return true;


}









// ==========================
// 勝利判定
// ==========================


function checkVictory(player){



if(
player.lp<=0
){


return true;


}





if(
player.deck.length===0
){


return true;


}





return false;


}









module.exports =
{

RULES,

checkDeck,

checkVictory

};
