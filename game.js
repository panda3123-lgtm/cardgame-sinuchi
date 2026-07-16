class Game {


constructor(player1,player2){

    this.players=[
        player1,
        player2
    ];

    this.turnPlayer=0;

    this.turn=1;

}



start(){

    //初期手札

    for(let p of this.players){

        for(let i=0;i<5;i++){

            p.draw();

        }

    }


}



nextTurn(){

    let player=this.players[this.turnPlayer];


    player.startTurn();


    if(!player.draw()){

        console.log(
        player.name+"のデッキ切れ"
        );

        return "LOSE";

    }


    return true;

}



changeTurn(){

    this.turnPlayer++;

    if(this.turnPlayer>=2){

        this.turnPlayer=0;

    }


    this.turn++;

}



}
