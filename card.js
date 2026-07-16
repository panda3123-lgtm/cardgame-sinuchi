class Card{


constructor(data){

this.name=data.name;

this.type=data.type;

this.cost=data.cost;

this.atk=data.atk||0;

this.effect=data.effect;

this.sa=data.sa||false;

this.blocker=data.blocker||false;


}



use(player,enemy){


if(player.cost < this.cost){

return false;

}


player.cost-=this.cost;



if(this.type==="monster"){

player.field.push(this);


}



if(this.effect){

this.effect(player,enemy,this);

}



return true;


}



}
