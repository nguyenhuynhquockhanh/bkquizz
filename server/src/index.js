import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GameManager } from "./gameManager.js";

import { createAuth, publicUser, verifyPassword } from './auth.js';
import { httpPolicy, staticCacheHeaders } from './httpPolicy.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(dataDir, 'quizzes.json');
const USERS_FILE = path.join(dataDir, 'users.json');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(httpPolicy({ production: process.env.NODE_ENV === 'production' || !!process.env.WEBSITE_HOSTNAME }));
app.use(cors());
app.use(express.json());

function readQuizzes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Lỗi đọc quizzes.json:", err);
  }
  return [];
}

function saveQuizzes(quizzes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), "utf-8");
}

function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Lỗi đọc users.json:", err);
  }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

let quizzes = readQuizzes();
let matchHistory = [];

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const gameManager = new GameManager(io);

const auth = createAuth(readUsers, saveUsers);
const { requireUser, requireAdmin } = auth;
const canManage = (user, quiz) => user.role === 'admin' || quiz.userId === user.id;

// === AUTHENTICATION APIS ===
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const account = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const user = readUsers().find((u) => u.email.toLowerCase() === account);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
  }
  res.json(auth.issue(user));
});
app.post('/api/auth/register', (req, res) => {
  const result = auth.createUser(req.body, 'user');
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(auth.issue(result.user));
});
app.get('/api/auth/me', requireUser, (req, res) => res.json(publicUser(req.user)));
app.post('/api/auth/logout', requireUser, (req, res) => {
  auth.revoke(req.token);
  res.json({ message: 'Đã đăng xuất.' });
});
app.use('/api/admin', requireUser, requireAdmin);
app.use('/api/quizzes', requireUser);

// === QUIZ APIS ===

app.get("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  const { userId } = req.query;

  if (userId) {
    const ownerId = req.user.role === 'admin' ? userId : req.user.id;
    const userQuizzes = quizzes.filter((q) => q.userId === ownerId);
    return res.json(userQuizzes);
  }

  res.json(req.user.role === 'admin' ? quizzes : quizzes.filter((q) => q.userId === req.user.id));
});

app.get("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Không tìm thấy bộ đề!" });
  if (!canManage(req.user, quiz)) return res.status(403).json({ error: 'Bạn không có quyền xem bộ đề này.' });
  res.json(quiz);
});

app.post("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  const newQuiz = {
    id: `quiz_${Date.now()}`,
    userId: req.user.id,
    title: req.body.title || "Bộ câu hỏi mới",
    description: req.body.description || "",
    coverImage:
      req.body.coverImage ||
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    showQuestionsOnPlayerScreen: req.body.showQuestionsOnPlayerScreen !== false,
    questions: req.body.questions || []
  };
  quizzes.unshift(newQuiz);
  saveQuizzes(quizzes);
  res.status(201).json(newQuiz);
});

app.put("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const index = quizzes.findIndex((q) => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Không tìm thấy bộ đề để cập nhật!" });

  if (!canManage(req.user, quizzes[index])) return res.status(403).json({ error: 'Bạn không có quyền sửa bộ đề này.' });
  quizzes[index] = {
    ...quizzes[index],
    title: req.body.title || quizzes[index].title,
    description: req.body.description !== undefined ? req.body.description : quizzes[index].description,
    coverImage: req.body.coverImage || quizzes[index].coverImage,
    showQuestionsOnPlayerScreen: req.body.showQuestionsOnPlayerScreen !== undefined
      ? req.body.showQuestionsOnPlayerScreen
      : (quizzes[index].showQuestionsOnPlayerScreen !== false),
    questions: req.body.questions || quizzes[index].questions
  };
  saveQuizzes(quizzes);
  res.json(quizzes[index]);
});

app.delete("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Không tìm thấy bộ đề.' });
  if (!canManage(req.user, quiz)) return res.status(403).json({ error: 'Bạn không có quyền xóa bộ đề này.' });
  quizzes = quizzes.filter((q) => q.id !== req.params.id);
  saveQuizzes(quizzes);
  res.json({ message: "Đã xóa bộ đề thành công!" });
});

// === ADMIN MANAGEMENT APIS ===

app.get("/api/admin/overview", (req, res) => {
  quizzes = readQuizzes();
  const users = readUsers();
  const liveRooms = gameManager.getActiveRooms();
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);
  res.json({
    totalQuizzes: quizzes.length,
    totalQuestions,
    totalUsers: users.length,
    liveRoomsCount: liveRooms.length,
    historyCount: matchHistory.length,
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "production"
  });
});

app.get('/api/admin/users', (req, res) => res.json(readUsers().map(publicUser)));
app.post('/api/admin/users', (req, res) => {
  if (!['admin', 'user'].includes(req.body.role || 'user')) return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
  const result = auth.createUser(req.body, req.body.role || 'user');
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(publicUser(result.user));
});
app.patch('/api/admin/users/:id/role', (req, res) => {
  if (!['admin', 'user'].includes(req.body.role)) return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
  const users = readUsers();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Không thể tự đổi quyền của mình.' });
  user.role = req.body.role;
  saveUsers(users);
  res.json(publicUser(user));
});
app.delete('/api/admin/users/:id', (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' });
  const users = readUsers();
  if (!users.some((u) => u.id === req.params.id)) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  saveUsers(users.filter((u) => u.id !== req.params.id));
  res.json({ message: 'Đã xóa tài khoản.' });
});

app.get("/api/admin/live-rooms", (req, res) => {
  res.json(gameManager.getActiveRooms());
});

app.get("/api/admin/history", (req, res) => {
  res.json(matchHistory);
});

app.get('/api/history', requireUser, (req, res) => {
  res.json(req.user.role === 'admin' ? matchHistory : matchHistory.filter((h) => h.userId === req.user.id));
});

app.get("/api/reports/:pin/export", requireUser, (req, res) => {
  const { pin } = req.params;
  const room = gameManager.getRoom(pin);
  if (!room || (req.user.role !== 'admin' && room.ownerId !== req.user.id)) {
    return res.status(403).json({ error: 'Bạn không có quyền tải báo cáo này.' });
  }
  const buffer = gameManager.exportExcelReport(pin);
  if (!buffer) {
    return res.status(404).json({ error: "Không tìm thấy dữ liệu trận đấu hoặc phòng chưa kết thúc!" });
  }

  res.setHeader("Content-Disposition", `attachment; filename=Bao_Cao_BKQuiz_Room_${pin}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// Serve the built React app from the same HTTP server as API and Socket.IO.
// Unknown API routes must remain JSON 404s, never the SPA HTML.
app.use('/api', (req, res) => res.status(404).json({ error: 'API not found' }));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist, { setHeaders: staticCacheHeaders }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('Missing client/dist. Run npm run build before npm start.');
}

// === SOCKET.IO EVENTS ===
io.on("connection", (socket) => {
  function hostAllowed(pin) {
    const user = auth.resolve(socket.handshake.auth?.token);
    const room = gameManager.getRoom(pin);
    if (!user || !room || room.hostSocketId !== socket.id || room.ownerId !== user.id) {
      socket.emit('host_error', { message: 'Bạn không có quyền điều khiển phòng này.' });
      return false;
    }
    return true;
  }
  socket.on("create_room", ({ quizId } = {}) => {
    const user = auth.resolve(socket.handshake.auth?.token);
    if (!user) return socket.emit('host_error', { message: 'Vui lòng đăng nhập để mở phòng.' });
    quizzes = readQuizzes();
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz || !canManage(user, quiz) || !quiz.questions?.length) {
      return socket.emit('host_error', { message: 'Không thể mở bộ đề này.' });
    }
    const room = gameManager.createRoom(socket.id, quiz);
    room.ownerId = user.id;
    socket.join(room.pin);

    socket.emit("room_created", {
      pin: room.pin,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      coverImage: quiz.coverImage,
      settings: room.settings,
      showQuestionsOnPlayerScreen: room.showQuestionsOnPlayerScreen
    });
  });

  socket.on("join_room", ({ pin, nickname, avatar } = {}) => {
    const result = gameManager.addPlayer(pin, socket.id, nickname, avatar);
    if (result.error) {
      return socket.emit("join_error", { message: result.error });
    }

    socket.join(pin);
    socket.emit("join_success", {
      pin,
      player: result.player,
      quizTitle: result.room.quiz.title,
      settings: result.room.settings,
      showQuestionsOnPlayerScreen: result.room.showQuestionsOnPlayerScreen
    });

    io.to(result.room.hostSocketId).emit("player_joined", {
      player: result.player,
      players: Array.from(result.room.players.values())
    });
  });

  function recordFinished(room) {
    if (!room || room.status !== "GAME_OVER" || room.historyRecorded) return;
    room.historyRecorded = true;
    matchHistory.unshift({ userId: room.ownerId, pin: room.pin, quizTitle: room.quiz.title,
      playerCount: room.players.size, endedAt: new Date().toISOString(), endedEarly: !!room.endedEarly });
  }
  socket.on("update_room_settings", ({ pin, settings } = {}) => {
    if (hostAllowed(pin)) gameManager.updateSettings(pin, settings && typeof settings === 'object' ? settings : {});
  });
  for (const [event, method] of [["pause_game", "pauseGame"], ["resume_game", "resumeGame"], ["end_game", "stopGame"]]) {
    socket.on(event, ({ pin } = {}) => {
      if (!hostAllowed(pin)) return;
      gameManager[method](pin);
      recordFinished(gameManager.getRoom(pin));
    });
  }
  socket.on("close_room", ({ pin } = {}) => {
    if (!hostAllowed(pin)) return;
    const room = gameManager.getRoom(pin);
    if (room.status !== "GAME_OVER") gameManager.closeRoom(pin);
    else socket.leave(pin);
  });
  socket.on("leave_room", () => {
    const mapping = gameManager.playerSocketMap.get(socket.id);
    if (mapping) socket.leave(mapping.pin);
    gameManager.removePlayer(socket.id);
  });
  socket.on("start_quiz", ({ pin } = {}) => {
    if (!hostAllowed(pin)) return;
    gameManager.startQuiz(pin);
  });

  socket.on("submit_answer", ({ optionId, usedDouble } = {}) => {
    gameManager.submitAnswer(socket.id, optionId, usedDouble);
  });

  socket.on("use_fifty_fifty", () => {
    gameManager.useFiftyFifty(socket.id);
  });

  socket.on("send_reaction", ({ emoji }) => {
    gameManager.handleReaction(socket.id, emoji);
  });

  socket.on("show_leaderboard", ({ pin } = {}) => {
    if (!hostAllowed(pin)) return;
    gameManager.showLeaderboard(pin);
  });

  socket.on("next_question", ({ pin } = {}) => {
    if (!hostAllowed(pin)) return;
    gameManager.nextQuestion(pin);

    recordFinished(gameManager.getRoom(pin));
  });

  socket.on("disconnect", () => {
    gameManager.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`BKQuiz Realtime Server running on http://localhost:${httpServer.address().port}`);
});
