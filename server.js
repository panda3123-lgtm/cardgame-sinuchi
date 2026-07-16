// ======================================
// エラッタオリジナリティ
// server.js
// ======================================


const express = require("express");

const app = express();


const http =
require("http")
.createServer(app);



const io =
require("socket.io")(http,{
    cors:{
        origin:"*"
    }
});



const PORT =
process.env.PORT || 3000;



// Game読み込み
const {Game}
=
require("./game/game");





// 待機プレイヤー

let waitingPlayers=[];


// 部屋

let rooms={};


// ゲーム

let games={};








// ============================
// 接続
// ============================


io.on(
"connection",
(socket)=>{


console.log(
"接続:",
socket.id
);





// ============================
// マッチング
// ============================


socket.on(
"join-lobby",
(data)=>{


let player={


id:
socket.id,


name:
data.name,


deck:
data.deck



};





if(waitingPlayers.length>0){



let opponent =
waitingPlayers.shift();



let roomId =
"room_"+
opponent.id+
"_"+
player.id;




socket.join(roomId);



io.sockets.sockets
.get(opponent.id)
.join(roomId);






rooms[socket.id]=roomId;

rooms[opponent.id]=roomId;







let game =
new Game(
opponent,
player
);



games[roomId]=game;



game.start();






io.to(roomId)
.emit(
"match-found",
{

roomId:roomId

}
);



sendState(roomId);



}
else{


waitingPlayers.push(
player
);


}



});








// ============================
// カード使用
// ============================


socket.on(
"use-card",
(data)=>{


let roomId =
rooms[socket.id];



if(!roomId)
return;



let game =
games[roomId];



game.useCard(
socket.id,
data.cardIndex
);



sendState(
roomId
);



});








// ============================
// 攻撃
// ============================


socket.on(
"attack",
(data)=>{


let roomId =
rooms[socket.id];


if(!roomId)
return;



let game =
games[roomId];



game.attack(
socket.id,
data.attackerIndex,
data.targetIndex
);



sendState(
roomId
);



});








// ============================
// ターン終了
// ============================


socket.on(
"end-turn",
()=>{


let roomId =
rooms[socket.id];


if(!roomId)
return;


let game =
games[roomId];


game.endTurn(
socket.id
);


sendState(
roomId
);



});








// ============================
// 切断
// ============================


socket.on(
"disconnect",
()=>{


let roomId =
rooms[socket.id];



if(roomId){


io.to(roomId)
.emit(
"opponent-disconnected"
);



delete games[roomId];


}



waitingPlayers =
waitingPlayers.filter(
p=>p.id!==socket.id
);



});





});









// ============================
// 状態送信
// ============================


function sendState(roomId){


let game =
games[roomId];


if(!game)
return;



io.to(roomId)
.emit(
"game-update",

game.createState()

);



}









http.listen(
PORT,
()=>{


console.log(
"Server started:",
PORT
);


});
