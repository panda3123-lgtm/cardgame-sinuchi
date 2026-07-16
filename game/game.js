// ======================================
// エラッタオリジナリティ
// game.js
// ゲーム管理
// ======================================


class Game {


    constructor(player1, player2){


        this.players = {


            [player1.id]:player1,

            [player2.id]:player2


        };



        this.turnPlayer =
        player1.id;



        this.turnCount = 1;



        this.phase =
        "start";


        this.started = false;


    }






    // ============================
    // プレイヤー取得
    // ============================


    getPlayer(id){


        return this.players[id];


    }





    getEnemy(id){


        let ids =
        Object.keys(
            this.players
        );


        let enemyId =
        ids.find(
            x=>x!==id
        );


        return this.players[enemyId];


    }







    // ============================
    // ゲーム開始
    // ============================


    start(){


        Object.values(
            this.players
        )
        .forEach(player=>{


            player.lp = 8000;


            player.cost = 
            player.first
            ?1
            :2;


            player.maxCost =
            player.cost;



            player.hand=[];

            player.field=[];

            player.graveyard=[];

            player.traps=[];



            this.draw(
                player,
                5
            );


        });



        this.started=true;


        this.phase="main";


    }







    // ============================
    // ドロー
    // ============================


    draw(player,count=1){


        for(
        let i=0;
        i<count;
        i++
        ){



            if(
            player.deck.length===0
            ){


                this.endGame(
                    player.id
                );


                return;


            }



            player.hand.push(
                player.deck.shift()
            );


        }


    }








    // ============================
    // ターン開始
    // ============================


    startTurn(){


        let player =
        this.getPlayer(
            this.turnPlayer
        );



        player.maxCost =
        Math.min(
            player.maxCost+2,
            10
        );



        player.cost =
        player.maxCost;



        this.draw(player);



        this.phase="main";


    }







    // ============================
    // ターン終了
    // ============================


    endTurn(){


        let enemy =
        this.getEnemy(
            this.turnPlayer
        );



        this.turnPlayer =
        enemy.id;



        this.turnCount++;



        this.startTurn();


    }







    // ============================
    // 勝敗
    // ============================


    checkWin(){


        for(
        let id in this.players
        ){


            if(
            this.players[id].lp<=0
            ){


                this.endGame(
                    id
                );


            }


        }


    }







    endGame(loser){


        let winner =
        this.getEnemy(
            loser
        );



        console.log(
        winner.name+
        "の勝利"
        );



    }


}

// ============================
// カード使用
// ============================


useCard(playerId,index){


    let player =
    this.getPlayer(
        playerId
    );



    let card =
    player.hand[index];



    if(!card){

        return false;

    }



    // コスト確認

    if(
    player.cost < card.cost
    ){

        return false;

    }




    player.cost -= card.cost;




    // 手札から削除

    player.hand.splice(
        index,
        1
    );





    switch(card.type){



        case "モンスター":


            this.summon(
                player,
                card
            );


            break;





        case "魔法":


            activateEffect(
                this,
                player,
                card
            );


            player.graveyard.push(
                card
            );


            break;






        case "トラップ":


            this.setTrap(
                player,
                card
            );


            break;



    }



    return true;


}







// ============================
// 召喚
// ============================


summon(player,card){



    card.canAttack =
    card.abilities?.includes(
        "SA"
    );



    player.field.push(
        card
    );



}






// ============================
// トラップセット
// ============================


setTrap(player,card){


    card.set=true;


    player.traps.push(
        card
    );


}







// ============================
// 攻撃
// ============================


attack(playerId,attackerIndex,targetIndex=null){



    let player =
    this.getPlayer(
        playerId
    );



    let enemy =
    this.getEnemy(
        playerId
    );



    let attacker =
    player.field[
        attackerIndex
    ];



    if(!attacker){

        return;

    }




    if(
    !attacker.canAttack
    ){

        return;

    }






    if(enemy.field.length>0){


        let target =
        enemy.field[
            targetIndex
        ];



        this.battle(
            attacker,
            target,
            player,
            enemy
        );



    }
    else{


        enemy.lp -=
        attacker.atk;



        this.checkWin();


    }



    attacker.canAttack=false;


}






// ============================
// 戦闘
// ============================


battle(
attacker,
defender,
attackerPlayer,
defenderPlayer
){



    let damage =
    attacker.atk -
    defender.atk;




    if(damage>0){


        defenderPlayer.field =
        defenderPlayer.field.filter(
            c=>c!==defender
        );


        attackerPlayer.graveyard.push(
            defender
        );


        defenderPlayer.lp -= damage;


    }



    else if(damage<0){


        attackerPlayer.field =
        attackerPlayer.field.filter(
            c=>c!==attacker
        );


        attackerPlayer.graveyard.push(
            attacker
        );


        attackerPlayer.lp += damage;


    }



    else{


        attackerPlayer.field =
        attackerPlayer.field.filter(
            c=>c!==attacker
        );


        defenderPlayer.field =
        defenderPlayer.field.filter(
            c=>c!==defender
        );



        attackerPlayer.graveyard.push(
            attacker
        );


        defenderPlayer.graveyard.push(
            defender
        );


    }



    this.checkWin();


}







// ============================
// 破壊
// ============================


destroyCard(card,player){


    player.field =
    player.field.filter(
        c=>c!==card
    );



    player.graveyard.push(
        card
    );


}
