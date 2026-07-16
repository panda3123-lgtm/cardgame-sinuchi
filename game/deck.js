// エラッタオリジナリティ デッキ処理


// カードを引く

function drawCard(player){

    // デッキ切れ

    if(player.deck.length === 0){

        player.lose = true;

        console.log(
            player.name + "はデッキ切れ"
        );

        return;

    }


    let card = player.deck.shift();


    player.hand.push(card);


    console.log(
        player.name +
        "は" +
        card.name +
        "をドロー"
    );

}



// 初期手札5枚

function drawStartHand(player){

    for(let i = 0; i < 5; i++){

        drawCard(player);

    }

}



// デッキシャッフル

function shuffle(deck){

    for(let i = deck.length - 1; i > 0; i--){

        let j = Math.floor(Math.random() * (i + 1));


        [deck[i], deck[j]] =
        [deck[j], deck[i]];

    }


}
