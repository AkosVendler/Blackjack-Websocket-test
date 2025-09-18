const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");


const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "public")));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// memória tároló lobbykra
const lobbies = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // csatlakozás egy lobbyhoz
  socket.on("joinLobby", ({ lobbyCode, username }) => {
    socket.join(lobbyCode);
    socket.lobbyCode = lobbyCode;
    socket.username = username;

    if (!lobbies[lobbyCode]) {
      lobbies[lobbyCode] = { users: [], counter: 0 };
    }

    // ha még nincs benne, adjuk hozzá
    if (!lobbies[lobbyCode].users.find(u => u.id === socket.id)) {
      lobbies[lobbyCode].users.push({ id: socket.id, name: username });
    }

    // mindenki frissítése a lobbyban
    io.to(lobbyCode).emit("lobbyUpdate", {
      users: lobbies[lobbyCode].users.map(u => u.name),
      counter: lobbies[lobbyCode].counter
    });
  });

  // számláló növelése
  socket.on("incrementCounter", () => {
    const lobbyCode = socket.lobbyCode;
    if (!lobbyCode || !lobbies[lobbyCode]) return;

    lobbies[lobbyCode].counter++;
    io.to(lobbyCode).emit("lobbyUpdate", {
      users: lobbies[lobbyCode].users.map(u => u.name),
      counter: lobbies[lobbyCode].counter
    });
  });

  // kilépés
  socket.on("disconnect", () => {
    const lobbyCode = socket.lobbyCode;
    if (lobbyCode && lobbies[lobbyCode]) {
      lobbies[lobbyCode].users = lobbies[lobbyCode].users.filter(u => u.id !== socket.id);
      io.to(lobbyCode).emit("lobbyUpdate", {
        users: lobbies[lobbyCode].users.map(u => u.name),
        counter: lobbies[lobbyCode].counter
      });
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => console.log("Server running on http://localhost:3001"));
