// ======================================
// エラッタオリジナリティ
// ai.js
// CPU制御
// ======================================



class AI {



    constructor(player){


        this.player = player;


    }







    // ============================
    // CPUターン
    // ============================


    playTurn(game){



        let player =
        this.player;





        let usable =
        player.hand.filter(card=>{


            return (
            card.cost <= player.cost
            );


        });








        if(
        usable.length > 0
        ){



            usable.sort(
            (a,b)=>{


                return (
                this.cardValue(b)
                -
                this.cardValue(a)
                );


            });





            let card =
            usable[0];





            let index =
            player.hand.indexOf(
                card
            );





            game.useCard(
                player.id,
                index
            );



        }






        this.attack(
            game
        );



    }







    // ============================
    // カード評価
    // ============================


    cardValue(card){



        let value=0;




        if(
        card.type==="モンスター"
        ){


            value +=
            card.atk || 0;


        }






        if(
        card.type==="魔法"
        ){


            value += 1000;


        }






        if(
        card.type==="トラップ"
        ){


            value += 700;


        }





        return value;


    }








    // ============================
    // 攻撃
    // ============================


    attack(game){



        let player =
        this.player;



        let enemy =
        game.getEnemy(
            player.id
        );





        player.field.forEach(
        (card,index)=>{



            if(
            card.canAttack
            ){



                if(
                enemy.field.length>0
                ){



                    game.attack(
                        player.id,
                        index,
                        0
                    );


                }
                else{


                    game.attack(
                        player.id,
                        index
                    );


                }



            }



        });



    }




}
