const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true }));

const rooms = new Map();
const MAX_PLAYERS = 10;
const ROUND_SECONDS = 90;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}
function cleanName(value) {
  return String(value || "Pemain").trim().replace(/[<>]/g, "").slice(0, 16) || "Pemain";
}
function publicRoom(room) {
  return {
    code: room.code,
    status: room.status,
    secondsLeft: room.secondsLeft,
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, x: p.x, z: p.z, score: p.score, color: p.color
    }))
  };
}
function emitRoom(room) {
  io.to(room.code).emit("roomState", publicRoom(room));
}
function startRound(room) {
  if (room.status === "playing" || room.players.size < 2) return;
  room.status = "playing";
  room.secondsLeft = ROUND_SECONDS;
  room.startedAt = Date.now();
  for (const p of room.players.values()) {
    p.score = 0;
    p.x = (Math.random() - 0.5) * 10;
    p.z = (Math.random() - 0.5) * 10;
  }
  room.coins = Array.from({ length: 12 }, () => ({
    x: (Math.random() - 0.5) * 24,
    z: (Math.random() - 0.5) * 24
  }));
  emitRoom(room);
  io.to(room.code).emit("roundStarted", { seconds: ROUND_SECONDS, coins: room.coins });
}

function endRound(room) {
  room.status = "finished";
  const ranking = [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));
  io.to(room.code).emit("roundEnded", { ranking });
  emitRoom(room);
}

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.status !== "playing") continue;
    room.secondsLeft = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - room.startedAt) / 1000));
    if (room.secondsLeft <= 0) endRound(room);
    else emitRoom(room);
  }
}, 1000);

io.on("connection", socket => {
  socket.on("createRoom", ({ name } = {}, reply = () => {}) => {
    let code = makeCode();
    while (rooms.has(code)) code = makeCode();
    const room = {
      code, status: "waiting", secondsLeft: ROUND_SECONDS,
      players: new Map(), coins: [], startedAt: null
    };
    rooms.set(code, room);
    addPlayer(socket, room, name, reply);
  });

  socket.on("joinRoom", ({ code, name } = {}, reply = () => {}) => {
    const room = rooms.get(String(code || "").toUpperCase().trim());
    if (!room) return reply({ ok: false, error: "Room tidak ditemukan." });
    if (room.players.size >= MAX_PLAYERS) return reply({ ok: false, error: "Room sudah penuh (maksimal 10 pemain)." });
    if (room.status === "playing") return reply({ ok: false, error: "Ronde sedang berlangsung. Tunggu ronde selesai." });
    addPlayer(socket, room, name, reply);
  });

  function addPlayer(sock, room, name, reply) {
    if (room.players.size >= MAX_PLAYERS) return reply({ ok: false, error: "Room sudah penuh." });
    const palette = ["#36d6ff", "#ffcf4a", "#ff6b8a", "#8b7bff", "#62e6a5", "#ff985c", "#e879f9", "#a3e635", "#fb7185", "#67e8f9"];
    const p = {
      id: sock.id, name: cleanName(name),
      x: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 10,
      score: 0, color: palette[room.players.size % palette.length],
      lastMove: 0
    };
    room.players.set(sock.id, p);
    sock.join(room.code);
    sock.data.roomCode = room.code;
    reply({ ok: true, code: room.code, playerId: sock.id });
    emitRoom(room);
  }

  socket.on("startRound", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    if (room.players.size < 2) return socket.emit("notice", "Butuh minimal 2 pemain untuk mulai.");
    if (room.status !== "playing") startRound(room);
  });

  socket.on("move", ({ x, z } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing") return;
    const p = room.players.get(socket.id);
    if (!p || Date.now() - p.lastMove < 45) return;
    p.lastMove = Date.now();
    const nx = Number(x), nz = Number(z);
    if (!Number.isFinite(nx) || !Number.isFinite(nz)) return;
    p.x = Math.max(-14, Math.min(14, nx));
    p.z = Math.max(-14, Math.min(14, nz));

    for (let i = room.coins.length - 1; i >= 0; i--) {
      const c = room.coins[i];
      if (Math.hypot(p.x - c.x, p.z - c.z) < 1.25) {
        p.score += 1;
        room.coins.splice(i, 1);
        socket.emit("coinCollected", { score: p.score });
        io.to(room.code).emit("coinsUpdate", room.coins);
      }
    }
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.players.delete(socket.id);
    if (room.players.size === 0) rooms.delete(code);
    else emitRoom(room);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Ultimate Party Battle running on port ${PORT}`);
});
