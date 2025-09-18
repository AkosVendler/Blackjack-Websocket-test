// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
      const io = new Server(server, {
        cors: {
        origin: "*", // fejlesztéshez, később szigorítani
        methods: ["GET","POST"]
        }
      });


app.use(express.static(path.join(__dirname, "public")));

// egyszerű memória tároló lobbykra
const lobbies = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinLobby", (lobbyCode, username) => {
    socket.join(lobbyCode);

    if (!lobbies[lobbyCode]) {
      lobbies[lobbyCode] = {
        users: [],
        counter: 0
      };
    }

    lobbies[lobbyCode].users.push({ id: socket.id, name: username });

    io.to(lobbyCode).emit("lobbyUpdate", lobbies[lobbyCode]);
  });

  socket.on("incrementCounter", (lobbyCode) => {
    if (lobbies[lobbyCode]) {
      lobbies[lobbyCode].counter++;
      io.to(lobbyCode).emit("lobbyUpdate", lobbies[lobbyCode]);
    }
  });

  socket.on("disconnect", () => {
    for (const [code, lobby] of Object.entries(lobbies)) {
      lobby.users = lobby.users.filter(u => u.id !== socket.id);
      io.to(code).emit("lobbyUpdate", lobby);
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
