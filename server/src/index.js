import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GameManager } from "./gameManager.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "quizzes.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

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
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi quizzes.json:", err);
  }
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
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi users.json:", err);
  }
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

// === AUTHENTICATION APIS (Đăng nhập/Đăng ký chuẩn thông thường) ===

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác!" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu!" });
  }

  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email này đã được đăng ký tài khoản!" });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password.trim(),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email
  });
});

// === QUIZ APIS (Lọc theo người dùng quản lý) ===

app.get("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  const { userId } = req.query;

  // Nếu có userId -> Trả về danh sách câu hỏi do người đó quản lý
  if (userId) {
    const userQuizzes = quizzes.filter((q) => q.userId === userId);
    return res.json(userQuizzes);
  }

  res.json(quizzes);
});

app.get("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Không tìm thấy bộ đề!" });
  res.json(quiz);
});

app.post("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  const newQuiz = {
    id: `quiz_${Date.now()}`,
    userId: req.body.userId || null,
    title: req.body.title || "Bộ câu hỏi mới",
    description: req.body.description || "",
    coverImage:
      req.body.coverImage ||
      "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80",
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

  quizzes[index] = {
    ...quizzes[index],
    title: req.body.title || quizzes[index].title,
    description: req.body.description || quizzes[index].description,
    coverImage: req.body.coverImage || quizzes[index].coverImage,
    questions: req.body.questions || quizzes[index].questions
  };
  saveQuizzes(quizzes);
  res.json(quizzes[index]);
});

app.delete("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  quizzes = quizzes.filter((q) => q.id !== req.params.id);
  saveQuizzes(quizzes);
  res.json({ message: "Đã xóa bộ đề thành công!" });
});

app.get("/api/reports/:pin/export", (req, res) => {
  const { pin } = req.params;
  const buffer = gameManager.exportExcelReport(pin);
  if (!buffer) {
    return res.status(404).json({ error: "Không tìm thấy dữ liệu trận đấu hoặc phòng chưa kết thúc!" });
  }

  res.setHeader("Content-Disposition", `attachment; filename=Bao_Cao_Kahoot_Room_${pin}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// Serve the built React app from the same HTTP server as API and Socket.IO.
// Unknown API routes must remain JSON 404s, never the SPA HTML.
app.use('/api', (req, res) => res.status(404).json({ error: 'API not found' }));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || path.extname(req.path)) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('Missing client/dist. Run npm run build before npm start.');
}

// === SOCKET.IO EVENTS ===
io.on("connection", (socket) => {
  socket.on("create_room", ({ quizId }) => {
    quizzes = readQuizzes();
    const quiz = quizzes.find((q) => q.id === quizId) || quizzes[0];
    const room = gameManager.createRoom(socket.id, quiz);
    socket.join(room.pin);

    socket.emit("room_created", {
      pin: room.pin,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      coverImage: quiz.coverImage
    });
  });

  socket.on("join_room", ({ pin, nickname, avatar }) => {
    const result = gameManager.addPlayer(pin, socket.id, nickname, avatar);
    if (result.error) {
      return socket.emit("join_error", { message: result.error });
    }

    socket.join(pin);
    socket.emit("join_success", {
      pin,
      player: result.player,
      quizTitle: result.room.quiz.title
    });

    io.to(result.room.hostSocketId).emit("player_joined", {
      player: result.player,
      players: Array.from(result.room.players.values())
    });
  });

  socket.on("start_quiz", ({ pin }) => {
    gameManager.startQuiz(pin);
  });

  socket.on("submit_answer", ({ optionId, usedDouble }) => {
    gameManager.submitAnswer(socket.id, optionId, usedDouble);
  });

  socket.on("use_fifty_fifty", () => {
    gameManager.useFiftyFifty(socket.id);
  });

  socket.on("send_reaction", ({ emoji }) => {
    gameManager.handleReaction(socket.id, emoji);
  });

  socket.on("show_leaderboard", ({ pin }) => {
    gameManager.showLeaderboard(pin);
  });

  socket.on("next_question", ({ pin }) => {
    gameManager.nextQuestion(pin);

    const room = gameManager.getRoom(pin);
    if (room && room.status === "GAME_OVER") {
      matchHistory.unshift({
        pin: room.pin,
        quizTitle: room.quiz.title,
        playerCount: room.players.size,
        endedAt: new Date().toISOString()
      });
    }
  });

  socket.on("disconnect", () => {
    gameManager.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Kahoot Clone Realtime Server running on http://localhost:${PORT}`);
});

