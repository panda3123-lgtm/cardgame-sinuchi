class Player {

    constructor(name, deck){

        this.name = name;

        this.lp = 8000;

        this.deck = deck;

        this.hand = [];

        this.field = [];

        this.graveyard = [];

        this.trapZone = [];

        this.cost = 1;

        this.maxCost = 1;

    }


    draw(){

        if(this.deck.length === 0){
            return false;
        }

        this.hand.push(this.deck.shift());

        return true;

    }


    startTurn(){

        this.maxCost += 2;

        if(this.maxCost > 10){
            this.maxCost = 10;
        }

        this.cost = this.maxCost;

    }


}
