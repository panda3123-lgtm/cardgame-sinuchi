const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// マッチング待ちのプレイヤーリスト
let waitingPlayers = [];
// 対戦中の部屋リスト
let activeRooms = {};

io.on('connection', (socket) => {
  console.log('プレイヤー接続:', socket.id);

  // プレイヤーがロビーに入ったとき
  socket.on('join-lobby', (playerData) => {
    console.log(`${playerData.name} がロビーに入りました`);
    
    // プレイヤー情報を保持
    const player = {
      id: socket.id,
      name: playerData.name,
      deckCount: playerData.deckCount,
      socket: socket
    };

    // すでに待っている人がいればマッチングさせる
    if (waitingPlayers.length > 0) {
      const opponent = waitingPlayers.shift();
      const roomId = `room_${opponent.id}_${player.id}`;

      // 2人を同じ部屋（Room）に入れる
      opponent.socket.join(roomId);
      socket.join(roomId);

      // 対戦部屋を記憶
      activeRooms[opponent.id] = { roomId: roomId, opponentId: player.id };
      activeRooms[player.id] = { roomId: roomId, opponentId: opponent.id };

      // お互いにマッチング成功を知らせる
      opponent.socket.emit('match-found', {
        roomId: roomId,
        opponent: { name: player.name, deckCount: player.deckCount }
      });

      socket.emit('match-found', {
        roomId: roomId,
        opponent: { name: opponent.name, deckCount: opponent.deckCount }
      });

      console.log(`マッチング成立: ${opponent.name} vs ${player.name} (Room: ${roomId})`);
    } else {
      // 誰もいなければ待機リストに追加
      waitingPlayers.push(player);
    }
  });

  // 対戦中のアクションのやり取りを中継する
  socket.on('game-action', (action) => {
    const roomInfo = activeRooms[socket.id];
    if (roomInfo) {
      // 部屋の「自分以外」の人にアクションを送信する
      socket.to(roomInfo.roomId).emit('game-action', action);
    }
  });

  // 接続が切れたとき
  socket.on('disconnect', () => {
    console.log('接続終了:', socket.id);
    
    // 待機リストから削除
    waitingPlayers = waitingPlayers.filter(p => p.id !== socket.id);

    // 対戦中だった場合、相手に切断を伝える
    const roomInfo = activeRooms[socket.id];
    if (roomInfo) {
      socket.to(roomInfo.roomId).emit('opponent-disconnected');
      delete activeRooms[roomInfo.opponentId];
      delete activeRooms[socket.id];
    }
  });
});

http.listen(PORT, () => {
  console.log(`対戦サーバー起動完了。ポート: ${PORT}`);
});
