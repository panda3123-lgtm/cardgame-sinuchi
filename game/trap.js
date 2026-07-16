// エラッタオリジナリティ トラップ処理


// トラップセット

function setTrap(card, player){


    if(card.type !== "トラップ"){

        console.log(
            "トラップカードではありません"
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



    // トラップゾーンへ

    player.trapZone.push(card);



    console.log(
        card.name +
        "をセット"
    );



    return true;

}




// トラップ発動

function activateTrap(card, player, enemy, trigger){


    let index = player.trapZone.indexOf(card);



    if(index === -1){

        return false;

    }



    // トラップゾーンから削除

    player.trapZone.splice(index,1);



    console.log(
        card.name +
        "を発動"
    );



    // 効果処理

    activateEffect(
        card,
        player,
        enemy
    );



    // 墓地へ

    player.graveyard.push(card);



    return true;

}
