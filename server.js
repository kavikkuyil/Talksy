const express = require("express");
const { ExpressPeerServer } = require("peer");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");

const io = require("socket.io")(server, {
  cors: { origin: '*' }
});

// PeerJS server
const peerServer = ExpressPeerServer(server, {
  path: "/peerjs",
  debug: true,
  proxied: true
});
app.use("/peerjs", peerServer);

app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Socket.io logic
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.userName = userName;
    socket.join(roomId);

    // Notify others in the room
    socket.to(roomId).emit("user-connected", userId, userName);

    // Send updated participants list
    const clients = io.sockets.adapter.rooms.get(roomId) || new Set();
    const users = Array.from(clients).map(id => io.sockets.sockets.get(id).userName);
    io.to(roomId).emit("update-user-list", users);

    // Chat messages
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, socket.userName);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const updatedClients = io.sockets.adapter.rooms.get(roomId) || new Set();
      const updatedUsers = Array.from(updatedClients).map(id => io.sockets.sockets.get(id).userName);
      io.to(roomId).emit("update-user-list", updatedUsers);
    });
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
