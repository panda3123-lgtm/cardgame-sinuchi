// エラッタオリジナリティ 召喚処理


// 通常召喚

function summon(card, player){


    // コスト確認

    if(player.cost < card.cost){

        console.log(
            "コスト不足"
        );

        return false;

    }



    // コスト支払い

    player.cost -= card.cost;



    // 手札から削除

    let index = player.hand.indexOf(card);


    if(index !== -1){

        player.hand.splice(index,1);

    }



    // 場に出す

    player.field.push(card);



    // 召喚ターン記録

    card.summonedTurn = true;

    card.attacked = false;



    console.log(
        player.name +
        "は" +
        card.name +
        "を召喚"
    );



    // 召喚時効果

    if(card.type === "モンスター"){

        activateEffect(
            card,
            player,
            null
        );

    }



    return true;


}




// 特殊召喚

function specialSummon(card, player){


    player.field.push(card);



    card.summonedTurn = true;

    card.attacked = false;



    console.log(
        card.name +
        "を特殊召喚"
    );



    activateEffect(
        card,
        player,
        null
    );


}
