// ======================================
// エラッタオリジナリティ
// game.js
// ゲーム本体
// ======================================



const {
    activateEffect
}
=
require("./effect");



const {
    checkVictory
}
=
require("./rules");







class Game {



constructor(
player1,
player2
){


this.players={};


this.players[player1.id]
=
this.createPlayer(
    player1,
    true
);



this.players[player2.id]
=
this.createPlayer(
    player2,
    false
);





this.turnPlayer =
player1.id;



this.turnCount=1;


this.phase="start";



}








// ==========================
// プレイヤー生成
// ==========================


createPlayer(data,first){



return {


id:data.id,


name:data.name,



lp:8000,



cost:
first ? 1 : 2,


maxCost:
first ? 1 : 2,



deck:
this.shuffle(
    data.deck || []
),



hand:[],


field:[],


graveyard:[],


traps:[]


};



}









// ==========================
// ゲーム開始
// ==========================


start(){



Object.values(
this.players
)
.forEach(
player=>{


this.draw(
player,
5
);



});



}









// ==========================
// シャッフル
// ==========================


shuffle(deck){


return deck
.sort(
()=>Math.random()-0.5
);


}








// ==========================
// ドロー
// ==========================


draw(player,num=1){


for(
let i=0;
i<num;
i++
){


if(player.deck.length===0){


player.lp=0;

return;


}



player.hand.push(
player.deck.shift()
);



}


}









// ==========================
// カード使用
// ==========================


useCard(
playerId,
index
){



let player =
this.players[playerId];



if(!player)
return;



let card =
player.hand[index];



if(!card)
return;




if(
player.cost < card.cost
)
return;






player.cost -=
card.cost;






player.hand.splice(
index,
1
);







if(card.type==="モンスター"){



player.field.push(
{

...card,

currentAtk:
card.atk,


canAttack:
false

}
);



}







else if(
card.type==="魔法"
){



activateEffect(
this,
player,
card
);



player.graveyard.push(
card
);



}







else if(
card.type==="トラップ"
){



player.traps.push(
{

...card,

set:true

}
);



}



}









// ==========================
// 攻撃
// ==========================


attack(
playerId,
attackerIndex,
targetIndex
){



let player =
this.players[playerId];



let enemy =
this.getEnemy(
playerId
);



if(!player || !enemy)
return;



let attacker =
player.field[
attackerIndex
];



if(!attacker)
return;




if(!attacker.canAttack)
return;







if(
enemy.field.length===0
){



enemy.lp -=
attacker.currentAtk;



}

else{



let target =
enemy.field[
targetIndex
];



if(!target)
return;



let damage =
attacker.currentAtk -
target.currentAtk;




if(damage>0){


enemy.lp -= damage;


target.destroy=true;


}


else if(damage<0){


player.lp += damage;


attacker.destroy=true;


}


else{


attacker.destroy=true;

target.destroy=true;


}



}







// ==========================
// ターン終了
// ==========================


endTurn(playerId){



if(
this.turnPlayer!==playerId
)
return;



let player =
this.players[playerId];



player.field.forEach(
card=>{

card.canAttack=true;

}
);





this.turnPlayer =
this.getEnemy(playerId)
.id;



this.turnCount++;



let next =
this.players[
this.turnPlayer
];



next.maxCost =
Math.min(
10,
next.maxCost+2
);



next.cost =
next.maxCost;



this.draw(
next
);



}









// ==========================
// 相手取得
// ==========================


getEnemy(id){


return Object.values(
this.players
)
.find(
p=>p.id!==id
);


}








// ==========================
// 状態送信
// ==========================


createState(){



return {


turnPlayer:
this.turnPlayer,



players:
Object.values(
this.players
)
.map(
p=>({

id:p.id,

name:p.name,

lp:p.lp,

cost:p.cost,

field:p.field,

hand:p.hand.length

})
)

};


}



}







module.exports =
{
Game
};
