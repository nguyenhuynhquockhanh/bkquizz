import { normalizeSettings, shuffle } from "./gameSettings.js";
import xlsx from "xlsx";
import { randomBytes } from 'node:crypto';
import { gameSnapshot } from './gameSnapshot.js';

export const RECONNECT_GRACE_MS = 60000;

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.playerSocketMap = new Map();
  }

  generatePin() {
    let pin;
    do {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(pin));
    return pin;
  }

  createRoom(hostSocketId, quiz) {
    const pin = this.generatePin();
    const room = {
      pin,
      hostSocketId,
      hostResumeToken: randomBytes(32).toString('hex'),
      hostDisconnectTimer: null,
      hostDisconnected: false,
      playerResumeTokens: new Map(),
      playerDisconnectTimers: new Map(),
      playerRoundState: new Map(),
      quiz: structuredClone(quiz),
      settings: normalizeSettings({ showQuestionsOnPlayerScreen: quiz?.showQuestionsOnPlayerScreen !== false }),
      introTimer: null,
      pausedAt: null,
      pausedDuration: 0,
      showQuestionsOnPlayerScreen: quiz?.showQuestionsOnPlayerScreen !== false,
      status: "LOBBY",
      currentQuestionIndex: -1,
      players: new Map(),
      questionTimer: null,
      questionRemainingTime: 0,
      questionStartTime: 0,
      currentAnswers: new Map(),
      historyLogs: []
    };

    this.rooms.set(pin, room);
    return room;
  }

  getRoom(pin) {
    return this.rooms.get(pin);
  }

  getActiveRooms() {
    const list = [];
    for (const room of this.rooms.values()) {
      if (room.status === "GAME_OVER") continue;
      list.push({
        pin: room.pin,
        quizTitle: room.quiz?.title || "Chưa đặt tên",
        status: room.status,
        playerCount: room.players.size,
        currentQuestion: room.currentQuestionIndex + 1,
        totalQuestions: room.quiz?.questions?.length || 0
      });
    }
    return list;
  }

  addPlayer(pin, socketId, nickname, avatar) {
    if (typeof nickname !== "string" || !nickname.trim() || nickname.length > 25) return { error: "Biệt danh cần từ 1 đến 25 ký tự." };
    if (this.playerSocketMap.has(socketId)) return { error: "Bạn đã ở trong một phòng." };
    const room = this.rooms.get(pin);
    if (!room) return { error: "Không tìm thấy phòng với mã PIN này!" };
    if (room.status !== "LOBBY") return { error: "Trò chơi đã bắt đầu hoặc đã kết thúc!" };

    for (const player of room.players.values()) {
      if (player.nickname.trim().toLowerCase() === nickname.trim().toLowerCase()) {
        return { error: "Tên biệt danh này đã có người sử dụng trong phòng!" };
      }
    }

    const playerId = `p_${socketId}`;
    const player = {
      id: playerId,
      socketId,
      nickname,
      avatar: avatar || "🐱",
      score: 0,
      streak: 0,
      powerUps: {
        fiftyFifty: room.settings.powerUps ? 1 : 0,
        doublePoints: room.settings.powerUps ? 1 : 0
      }
    };

    room.players.set(playerId, player);
    room.playerResumeTokens.set(playerId, randomBytes(32).toString('hex'));
    this.playerSocketMap.set(socketId, { pin, playerId });

    return { room, player };
  }

  closeRoom(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;
    clearInterval(room.questionTimer);
    clearTimeout(room.introTimer);
    clearTimeout(room.hostDisconnectTimer);
    for (const timer of room.playerDisconnectTimers.values()) clearTimeout(timer);
    this.io.to(pin).emit("room_closed", { message: "Chủ phòng đã đóng trò chơi." });
    for (const player of room.players.values()) this.playerSocketMap.delete(player.socketId);
    this.io.in?.(pin).socketsLeave?.(pin);
    this.rooms.delete(pin);
  }

  removePlayer(socketId) {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId === socketId) {
        // Completed reports remain available after the host leaves.
        if (room.status !== "GAME_OVER") this.closeRoom(room.pin);
      }
    }
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;
    const room = this.rooms.get(mapping.pin);
    this.playerSocketMap.delete(socketId);
    if (!room) return;
    clearTimeout(room.playerDisconnectTimers.get(mapping.playerId));
    room.playerDisconnectTimers.delete(mapping.playerId);
    room.playerResumeTokens.delete(mapping.playerId);
    if (room.status === "LOBBY") room.players.delete(mapping.playerId);
    else if (room.players.has(mapping.playerId)) room.players.get(mapping.playerId).disconnected = true;
    this.io.to(room.hostSocketId).emit("player_left", { players: [...room.players.values()] });
  }

  disconnect(socketId) {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId !== socketId) continue;
      room.hostDisconnected = true;
      if (room.status === 'QUESTION_ACTIVE') this.pauseGame(room.pin);
      if (room.status === 'QUESTION_INTRO') clearTimeout(room.introTimer);
      clearTimeout(room.hostDisconnectTimer);
      if (room.status !== 'GAME_OVER') room.hostDisconnectTimer = setTimeout(() => this.closeRoom(room.pin), RECONNECT_GRACE_MS);
      this.io.to(room.pin).emit('host_connection', { disconnected: true });
    }
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;
    const room = this.rooms.get(mapping.pin);
    if (!room) return;
    room.players.get(mapping.playerId).disconnected = true;
    clearTimeout(room.playerDisconnectTimers.get(mapping.playerId));
    room.playerDisconnectTimers.set(mapping.playerId, setTimeout(() => this.removePlayer(socketId), RECONNECT_GRACE_MS));
    this.io.to(room.hostSocketId).emit('player_left', { players: [...room.players.values()] });
  }

  resumeSession({ pin, role, resumeToken }, socketId, userId) {
    const room = this.rooms.get(pin);
    if (!room || typeof resumeToken !== 'string') return null;
    if (role === 'host') {
      if (!userId || room.ownerId !== userId || room.hostResumeToken !== resumeToken) return null;
      const oldSocketId = room.hostSocketId;
      clearTimeout(room.hostDisconnectTimer);
      room.hostSocketId = socketId;
      room.hostDisconnected = false;
      if (room.status === 'QUESTION_INTRO') {
        clearTimeout(room.introTimer);
        room.introTimer = setTimeout(() => {
          if (room.status === 'QUESTION_INTRO' && !room.hostDisconnected) this.activateQuestion(room);
        }, 3000);
      }
      return { room, oldSocketId, data: {
        pin, quizTitle: room.quiz.title, settings: room.settings, resumeToken,
        showQuestionsOnPlayerScreen: room.showQuestionsOnPlayerScreen,
        snapshot: gameSnapshot(room)
      } };
    }
    if (role !== 'player') return null;
    const entry = [...room.playerResumeTokens].find(([, token]) => token === resumeToken);
    if (!entry) return null;
    const [playerId] = entry;
    const player = room.players.get(playerId);
    const oldSocketId = player.socketId;
    clearTimeout(room.playerDisconnectTimers.get(playerId));
    room.playerDisconnectTimers.delete(playerId);
    this.playerSocketMap.delete(oldSocketId);
    player.socketId = socketId;
    player.disconnected = false;
    this.playerSocketMap.set(socketId, { pin, playerId });
    return { room, oldSocketId, data: {
      pin, player, quizTitle: room.quiz.title, settings: room.settings, resumeToken,
      showQuestionsOnPlayerScreen: room.showQuestionsOnPlayerScreen,
      snapshot: gameSnapshot(room, playerId)
    } };
  }

  selectDoublePoints(socketId, enabled) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;
    const room = this.rooms.get(mapping.pin);
    const player = room?.players.get(mapping.playerId);
    if (!room || room.status !== 'QUESTION_ACTIVE' || !room.settings.powerUps ||
      room.currentAnswers.has(mapping.playerId) || !player?.powerUps.doublePoints || typeof enabled !== 'boolean') return;
    const state = room.playerRoundState.get(player.id) || {};
    room.playerRoundState.set(player.id, { ...state, useDouble: enabled });
  }

  updateSettings(pin, settings) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "LOBBY") return;
    room.settings = normalizeSettings(settings, room.settings);
    room.showQuestionsOnPlayerScreen = room.settings.showQuestionsOnPlayerScreen;
    for (const player of room.players.values()) {
      player.powerUps = { fiftyFifty: room.settings.powerUps ? 1 : 0, doublePoints: room.settings.powerUps ? 1 : 0 };
    }
    this.io.to(pin).emit("room_settings", room.settings);
  }

  pauseGame(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "QUESTION_ACTIVE") return;
    room.status = "PAUSED";
    room.pausedAt = Date.now();
    this.io.to(pin).emit("game_paused", { paused: true });
  }

  resumeGame(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "PAUSED") return;
    room.pausedDuration += Date.now() - room.pausedAt;
    room.pausedAt = null;
    room.status = "QUESTION_ACTIVE";
    this.io.to(pin).emit("game_paused", { paused: false });
  }

  stopGame(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status === "GAME_OVER" || room.status === "LOBBY") return;
    if (["QUESTION_ACTIVE", "PAUSED"].includes(room.status)) this.endCurrentQuestion(room);
    this.endGame(room, true);
  }

  startQuiz(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "LOBBY" || !room.players.size || !room.quiz.questions.length) return;
    if (room.settings.randomizeQuestions) room.quiz.questions = shuffle(room.quiz.questions);
    room.quiz.questions = room.quiz.questions.map(q => ({
      ...q,
      timeLimit: room.settings.timeLimit || q.timeLimit,
      options: (room.settings.randomizeAnswers && q.type !== 'TRUE_FALSE' ? shuffle(q.options) : q.options).map((o, id) => ({ ...o, id }))
    }));
    room.currentQuestionIndex = 0;
    this.showQuestionIntro(room);
  }

  showQuestionIntro(room) {
    room.status = "QUESTION_INTRO";
    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    room.currentAnswers.clear();
    room.playerRoundState.clear();

    this.io.to(room.pin).emit("question_intro", {
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.quiz.questions.length,
      questionTitle: currentQ.question,
      questionType: currentQ.type || "MULTIPLE_CHOICE",
      imageUrl: currentQ.imageUrl || "",
      timeLimit: currentQ.timeLimit,
      showQuestionsOnPlayer: room.showQuestionsOnPlayerScreen !== false
    });

    room.introTimer = setTimeout(() => {
      if (this.rooms.has(room.pin) && room.status === "QUESTION_INTRO") {
        this.activateQuestion(room);
      }
    }, 3000);
  }

  activateQuestion(room) {
    room.status = "QUESTION_ACTIVE";
    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    room.questionRemainingTime = currentQ.timeLimit;
    room.questionStartTime = Date.now();
    room.pausedDuration = 0;

    this.io.to(room.hostSocketId).emit("question_start_host", {
      question: currentQ,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.quiz.questions.length,
      timeLimit: currentQ.timeLimit
    });

    const showQuestionsOnPlayer = room.showQuestionsOnPlayerScreen !== false;

    for (const player of room.players.values()) {
      this.io.to(player.socketId).emit("question_start_player", {
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.quiz.questions.length,
        timeLimit: currentQ.timeLimit,
        questionType: currentQ.type || "MULTIPLE_CHOICE",
        optionsCount: currentQ.options.length,
        powerUps: player.powerUps,
        powerUpsEnabled: room.settings.powerUps,
        showQuestionsOnPlayer,
        questionTitle: showQuestionsOnPlayer ? currentQ.question : null,
        imageUrl: showQuestionsOnPlayer ? (currentQ.imageUrl || "") : null,
        options: showQuestionsOnPlayer
          ? currentQ.options.map((opt) => ({ id: opt.id, text: opt.text }))
          : null
      });
    }

    if (room.questionTimer) clearInterval(room.questionTimer);
    room.questionTimer = setInterval(() => {
      if (room.status !== "QUESTION_ACTIVE") return;
      room.questionRemainingTime -= 1;
      this.io.to(room.pin).emit("timer_tick", { remaining: room.questionRemainingTime });

      if (room.questionRemainingTime <= 0) {
        clearInterval(room.questionTimer);
        this.endCurrentQuestion(room);
      }
    }, 1000);
  }

  submitAnswer(socketId, optionId, usedDouble = false) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    if (!room || room.status !== "QUESTION_ACTIVE") return;
    if (room.currentAnswers.has(playerId)) return;

    const player = room.players.get(playerId);
    if (!player) return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    const timeSpent = (Date.now() - room.questionStartTime - room.pausedDuration) / 1000;
    const selectedOption = currentQ.options.find((opt) => opt.id === optionId);
    if (!selectedOption) return;
    const isCorrect = selectedOption.isCorrect;
    const doubleActive = room.settings.powerUps && usedDouble && player.powerUps.doublePoints > 0;
    if (doubleActive) player.powerUps.doublePoints -= 1;

    let pointsEarned = 0;
    const previousStreak = player.streak;
    if (isCorrect) {
      const speedFactor = room.settings.speedScoring ? Math.max(0.5, 1 - timeSpent / (currentQ.timeLimit * 2)) : 1;
      let basePoints = Math.round(currentQ.points * speedFactor);

      player.streak += 1;
      let streakBonus = 0;
      if (player.streak >= 2) streakBonus = 100;
      if (player.streak >= 3) streakBonus = 250;
      if (player.streak >= 5) streakBonus = 500;

      pointsEarned = basePoints + (room.settings.streakBonus ? streakBonus : 0);

      if (doubleActive) {
        pointsEarned *= 2;
      }

      player.score += pointsEarned;
    } else {
      player.streak = 0;
    }

    room.currentAnswers.set(playerId, {
      optionId,
      previousStreak,
      timeSpent: Number(timeSpent.toFixed(2)),
      pointsEarned,
      isCorrect,
      usedDouble
    });

    this.io.to(room.hostSocketId).emit("answer_submitted_update", {
      answeredCount: room.currentAnswers.size,
      totalPlayers: room.players.size
    });

    if (room.currentAnswers.size >= room.players.size && room.players.size > 0) {
      if (room.questionTimer) clearInterval(room.questionTimer);
      this.endCurrentQuestion(room);
    }
  }

  useFiftyFifty(socketId) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    if (!room || room.status !== "QUESTION_ACTIVE") return;

    const player = room.players.get(playerId);
    if (!room.settings.powerUps || room.currentAnswers.has(playerId) || !player || player.powerUps.fiftyFifty <= 0) return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    if (currentQ.type === "TRUE_FALSE") return;

    player.powerUps.fiftyFifty -= 1;

    const wrongOptions = currentQ.options.filter((opt) => !opt.isCorrect).map((opt) => opt.id);
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    const eliminated = shuffled.slice(0, 2);
    room.playerRoundState.set(playerId, { ...room.playerRoundState.get(playerId), eliminatedOptions: eliminated });

    this.io.to(socketId).emit("fifty_fifty_result", { eliminatedOptions: eliminated });
  }

  endCurrentQuestion(room) {
    if (!["QUESTION_ACTIVE", "PAUSED"].includes(room.status)) return;
    clearInterval(room.questionTimer);
    room.status = "QUESTION_RESULT";
    const currentQ = room.quiz.questions[room.currentQuestionIndex];

    const stats = new Array(currentQ.options.length).fill(0);
    for (const ans of room.currentAnswers.values()) {
      if (ans.optionId >= 0 && ans.optionId < currentQ.options.length) {
        stats[ans.optionId]++;
      }
    }

    room.historyLogs.push({
      questionNumber: room.currentQuestionIndex + 1,
      questionTitle: currentQ.question,
      questionType: currentQ.type || "MULTIPLE_CHOICE",
      correctOption: currentQ.options.find((o) => o.isCorrect)?.text || "",
      stats,
      playerAnswers: Array.from(room.players.values()).map((p) => {
        const ans = room.currentAnswers.get(p.id);
        return {
          nickname: p.nickname,
          answered: !!ans,
          isCorrect: ans ? ans.isCorrect : false,
          timeSpent: ans ? ans.timeSpent : 0,
          pointsEarned: ans ? ans.pointsEarned : 0,
          totalScore: p.score
        };
      })
    });

    this.io.to(room.hostSocketId).emit("question_result_host", {
      question: currentQ,
      stats,
      totalAnswers: room.currentAnswers.size
    });

    for (const player of room.players.values()) {
      const ans = room.currentAnswers.get(player.id);
      if (!ans) player.streak = 0;
      this.io.to(player.socketId).emit("question_result_player", {
        isCorrect: ans ? ans.isCorrect : false,
        pointsEarned: ans ? ans.pointsEarned : 0,
        totalScore: player.score,
        streak: player.streak
      });
    }
  }

  showLeaderboard(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "QUESTION_RESULT") return;

    room.status = "LEADERBOARD";
    const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score);

    this.io.to(room.pin).emit("leaderboard_update", {
      topPlayers: sortedPlayers.slice(0, 5),
      isLastQuestion: room.currentQuestionIndex >= room.quiz.questions.length - 1
    });
  }

  nextQuestion(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "LEADERBOARD") return;

    room.currentQuestionIndex += 1;
    if (room.currentQuestionIndex < room.quiz.questions.length) {
      this.showQuestionIntro(room);
    } else {
      this.endGame(room);
    }
  }

  endGame(room, endedEarly = false) {
    if (room.status === "GAME_OVER") return;
    clearInterval(room.questionTimer);
    clearTimeout(room.introTimer);
    room.endedEarly = endedEarly;
    room.status = "GAME_OVER";
    const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score);

    this.io.to(room.pin).emit("game_over", {
      endedEarly,
      podium: {
        first: sortedPlayers[0] || null,
        second: sortedPlayers[1] || null,
        third: sortedPlayers[2] || null
      },
      allPlayers: sortedPlayers
    });
  }

  handleReaction(socketId, emoji) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    if (!room) return;

    const player = room.players.get(playerId);
    const reaction = {
      id: Math.random().toString(36).substring(7),
      emoji,
      nickname: player ? player.nickname : "",
      createdAt: Date.now()
    };

    this.io.to(room.hostSocketId).emit("floating_reaction", reaction);
  }

  exportExcelReport(pin) {
    const room = this.rooms.get(pin);
    if (!room) return null;

    const workbook = xlsx.utils.book_new();

    const leaderboardData = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({
        Hạng: idx + 1,
        "Biệt danh / Người chơi": p.nickname,
        "Tổng điểm": p.score,
        "Chuỗi đúng kỷ lục": p.streak
      }));
    const wsLeaderboard = xlsx.utils.json_to_sheet(leaderboardData);
    xlsx.utils.book_append_sheet(workbook, wsLeaderboard, "Bảng Điểm Xếp Hạng");

    const questionSummary = room.historyLogs.map((log) => ({
      "Câu số": log.questionNumber,
      "Loại câu hỏi": log.questionType === "TRUE_FALSE" ? "Đúng / Sai" : "Trắc nghiệm 4 lựa chọn",
      "Nội dung câu hỏi": log.questionTitle,
      "Đáp án đúng": log.correctOption,
      "Số người chọn Lựa chọn 1": log.stats[0] || 0,
      "Số người chọn Lựa chọn 2": log.stats[1] || 0,
      "Số người chọn Lựa chọn 3": log.stats[2] || 0,
      "Số người chọn Lựa chọn 4": log.stats[3] || 0
    }));
    const wsQuestions = xlsx.utils.json_to_sheet(questionSummary);
    xlsx.utils.book_append_sheet(workbook, wsQuestions, "Thống Kê Câu Hỏi");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }
}
