// エラッタオリジナリティ 効果処理


function activateEffect(card, owner, enemy){


    console.log(
        card.name + "の効果発動"
    );


    switch(card.name){


        // 例：マネネ

        case "マネネ":

            enemy.lp -= 800;

            console.log(
                "相手LP800減少"
            );

            break;



        // 例：参拝

        case "参拝":

            owner.lp += 500;

            console.log(
                "LP500回復"
            );

            break;



        // 例：次回策

        case "次回策":

            drawCard(owner);
            drawCard(owner);

            break;



        default:

            console.log(
                "未実装効果"
            );

            break;

    }

}
