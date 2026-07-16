// エラッタオリジナリティ プレイヤー管理


class Player {


    constructor(name){


        this.name = name;


        // ライフ

        this.lp = 8000;


        // デッキ関連

        this.deck = [];

        this.hand = [];

        this.graveyard = [];



        // フィールド

        this.field = [];

        this.trapZone = [];



        // コスト

        this.cost = 1;

        this.maxCost = 1;



        // 勝敗

        this.lose = false;


    }



    // ターン開始処理

    startTurn(){


        // コスト回復

        this.cost = this.maxCost;



        // 最大コスト増加

        this.maxCost += 2;



        // 最大10制限

        if(this.maxCost > 10){

            this.maxCost = 10;

        }


        // 現在コストも調整

        this.cost = this.maxCost;


    }


}
