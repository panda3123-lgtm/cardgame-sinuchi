// ======================================
// エラッタオリジナリティ
// effect.js
// カード効果管理
// ======================================



const effects = {





    // ============================
    // ダメージ
    // ============================


    damage800:
    (game,player)=>{


        let enemy =
        game.getEnemy(
            player.id
        );



        enemy.lp -= 800;



        game.checkWin();


    },







    // ============================
    // 回復
    // ============================


    heal500:
    (game,player)=>{


        player.lp += 500;



    },








    // ============================
    // ドロー
    // ============================


    draw2:
    (game,player)=>{


        game.draw(
            player,
            2
        );


    },







    // ============================
    // 相手カード破壊
    // ============================


    destroyTarget:
    (game,player,target)=>{


        if(!target){

            return;

        }



        let enemy =
        game.getEnemy(
            player.id
        );



        game.destroyCard(
            target,
            enemy
        );


    },








    // ============================
    // 攻撃力アップ
    // ============================


    atkUp500:
    (game,player,target)=>{


        if(target){


            target.atk += 500;


        }


    }





};









// ==================================
// 効果発動
// ==================================


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
