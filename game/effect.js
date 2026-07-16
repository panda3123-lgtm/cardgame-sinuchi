// ======================================
// エラッタオリジナリティ
// effect.js
// カード効果処理
// ======================================





const effects = {





// ==========================
// ダメージ
// ==========================


damage500:
(game,player)=>{


let enemy =
game.getEnemy(
player.id
);



enemy.lp -= 500;



},








// ==========================
// ダメージ800
// ==========================


damage800:
(game,player)=>{


let enemy =
game.getEnemy(
player.id
);



enemy.lp -= 800;



},







// ==========================
// 回復
// ==========================


heal500:
(game,player)=>{


player.lp += 500;


},







// ==========================
// ドロー
// ==========================


draw2:
(game,player)=>{


game.draw(
player,
2
);


},







// ==========================
// 攻撃力アップ
// ==========================


atkUp500:
(game,player,target)=>{


if(!target)
return;



target.currentAtk += 500;



},







// ==========================
// モンスター破壊
// ==========================


destroyTarget:
(game,player,target)=>{


if(!target)
return;



target.destroy=true;



}






};










// ==========================
// 効果発動
// ==========================


function activateEffect(
game,
player,
card,
target=null
){



let effect =
effects[
card.effectId
];



if(!effect){



console.log(
"未登録効果:",
card.effectId
);



return;


}




effect(
game,
player,
target
);



}





module.exports =
{
activateEffect
};
