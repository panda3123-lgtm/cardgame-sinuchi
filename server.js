const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // どこからでも接続できるようにする設定
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// 接続してきた人（クライアント）を検知する
io.on('connection', (socket) => {
  console.log('プレイヤーが接続しました！ ID:', socket.id);

  // 対戦相手にデータをそのまま転送する設定（簡易オンライン対戦用）
  socket.on('game-action', (data) => {
    // 接続している他のプレイヤー全員に、送られてきたアクション（カードを出すなど）を転送する
    socket.broadcast.emit('game-action', data);
  });

  // 接続が切れたとき
  socket.on('disconnect', () => {
    console.log('プレイヤーの接続が切れました。 ID:', socket.id);
  });
});

// サーバーを起動する
http.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました！`);
});
