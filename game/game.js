// エラッタオリジナリティ ゲーム管理


class Game {


    constructor(player1, player2){


        this.players = [
            player1,
            player2
        ];


        // 先攻

        this.turnPlayer = player1;


        // ターン数

        this.turn = 1;


    }



    // ゲーム開始

    start(){


        console.log("ゲーム開始");


        // デッキシャッフル

        shuffle(this.players[0].deck);

        shuffle(this.players[1].deck);



        // 初期手札5枚

        drawStartHand(this.players[0]);

        drawStartHand(this.players[1]);



        console.log(
            this.players[0].name +
            "の先攻"
        );


        this.startTurn();


    }



    // ターン開始

    startTurn(){


        let player = this.turnPlayer;



        console.log(
            player.name +
            "のターン"
        );



        // コスト処理

        player.startTurn();



        // ドロー

        drawCard(player);



    }



    // ターン終了

    endTurn(){


        // 次のプレイヤーへ

        if(this.turnPlayer === this.players[0]){

            this.turnPlayer = this.players[1];

        }

        else{

            this.turnPlayer = this.players[0];

            this.turn++;

        }



        this.startTurn();


    }


}
