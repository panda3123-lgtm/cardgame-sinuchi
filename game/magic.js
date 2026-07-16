// エラッタオリジナリティ 魔法発動処理


function activateMagic(card, player, enemy){


    // 魔法カード確認

    if(card.type !== "魔法"){

        console.log(
            "魔法カードではありません"
        );

        return false;

    }



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



    console.log(
        player.name +
        "は" +
        card.name +
        "を発動"
    );



    // 効果処理

    activateEffect(
        card,
        player,
        enemy
    );



    // 永続魔法以外は墓地へ

    if(card.name !== "ルルイエ" &&
       card.name !== "氷結の地" &&
       card.name !== "夢見の狭間"){

        player.graveyard.push(card);

    }



    return true;


}
