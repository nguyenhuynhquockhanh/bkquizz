import Modal from "./Modal";
import GameSettings from "./GameSettings";
import { notify, askConfirm } from "../services/dialogs";
import { downloadReport } from "../services/api";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { Users, ArrowRight, Download, Check, X, Volume2, VolumeX, Music, Monitor } from "lucide-react";
import { sounds } from "../services/sound";
import BKLogo from "./BKLogo";

export default function HostScreen({ roomData, socket, onLeave }) {
  const snapshot = roomData.snapshot;
  const [roomState, setRoomState] = useState(snapshot?.status === 'PAUSED' ? 'QUESTION_ACTIVE' : snapshot?.status || 'LOBBY');
  const [players, setPlayers] = useState(snapshot?.players || []);
  const [currentQuestion, setCurrentQuestion] = useState(snapshot?.question || null);
  const [questionNumber, setQuestionNumber] = useState(snapshot?.questionNumber || 1);
  const [totalQuestions, setTotalQuestions] = useState(snapshot?.totalQuestions || roomData.totalQuestions || 1);
  const [remainingTime, setRemainingTime] = useState(snapshot?.remainingTime ?? 15);
  const [answeredCount, setAnsweredCount] = useState(snapshot?.answeredCount || 0);
  const [questionStats, setQuestionStats] = useState(snapshot?.stats || [0, 0, 0, 0]);
  const [leaderboard, setLeaderboard] = useState(snapshot?.topPlayers || []);
  const [isLastQuestion, setIsLastQuestion] = useState(snapshot?.isLastQuestion || false);
  const [podium, setPodium] = useState(snapshot?.podium || { first: null, second: null, third: null });
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const [settings, setSettings] = useState(roomData?.settings || {});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [paused, setPaused] = useState(snapshot?.paused || false);
  const [endedEarly, setEndedEarly] = useState(snapshot?.endedEarly || false);
  const endEarly = async () => {
    if (await askConfirm('Kết thúc trò chơi ngay? Điểm đã ghi nhận sẽ được giữ lại và mọi người sẽ xem kết quả.')) socket.emit('end_game', { pin: roomData.pin });
  };
  const leaveLobby = async () => {
    if (await askConfirm('Đóng phòng? Những người đang chờ sẽ trở về trang tham gia.')) onLeave();
  };
  const joinUrl = `${window.location.origin}/?pin=${roomData?.pin}`;

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
    }, 600);
  };

  useEffect(() => {
    socket.on("room_settings", setSettings);
    socket.on("game_paused", ({ paused }) => { setPaused(paused); if (paused) sounds.stopQuestionBeat(); else sounds.startQuestionBeat(); });
    socket.on("player_joined", ({ players }) => {
      setPlayers(players);
      sounds.playPop();
    });

    socket.on("player_left", ({ players }) => setPlayers(players));

    socket.on("question_intro", ({ questionNumber, totalQuestions, questionTitle }) => {
      setRoomState("QUESTION_INTRO");
      setQuestionNumber(questionNumber);
      setTotalQuestions(totalQuestions);
      setCurrentQuestion({ question: questionTitle });
      setAnsweredCount(0);
      sounds.stopLobbyMusic();
      sounds.stopQuestionBeat();
      setIsMusicPlaying(false);
      sounds.playPop();
    });

    socket.on("question_start_host", ({ question, questionNumber, totalQuestions, timeLimit }) => {
      setRoomState("QUESTION_ACTIVE");
      setCurrentQuestion(question);
      setQuestionNumber(questionNumber);
      setTotalQuestions(totalQuestions);
      setRemainingTime(timeLimit);
      setAnsweredCount(0);

      sounds.startQuestionBeat();
    });

    socket.on("timer_tick", ({ remaining }) => {
      setRemainingTime(remaining);
      if (remaining <= 5 && remaining > 0) {
        sounds.playTick();
      }
    });

    socket.on("answer_submitted_update", ({ answeredCount }) => setAnsweredCount(answeredCount));

    socket.on("question_result_host", ({ question, stats }) => {
      setRoomState("QUESTION_RESULT");
      setCurrentQuestion(question);
      setQuestionStats(stats);
      sounds.stopQuestionBeat();
      sounds.playPop();
    });

    socket.on("leaderboard_update", ({ topPlayers, isLastQuestion }) => {
      setRoomState("LEADERBOARD");
      setLeaderboard(topPlayers);
      setIsLastQuestion(isLastQuestion);
      sounds.stopQuestionBeat();
      sounds.playPop();
    });

    socket.on("game_over", ({ podium, endedEarly }) => {
      setPaused(false);
      setEndedEarly(!!endedEarly);
      setRoomState("GAME_OVER");
      setPodium(podium);
      triggerConfetti();
      sounds.stopQuestionBeat();
      sounds.playVictory();
    });

    socket.on("floating_reaction", (reaction) => {
      setFloatingReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    });

    return () => {
      sounds.stopLobbyMusic();
      sounds.stopQuestionBeat();
      socket.off("room_settings");
      socket.off("game_paused");
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("question_intro");
      socket.off("question_start_host");
      socket.off("timer_tick");
      socket.off("answer_submitted_update");
      socket.off("question_result_host");
      socket.off("leaderboard_update");
      socket.off("game_over");
      socket.off("floating_reaction");
    };
  }, [socket, roomData?.pin]);

  const handleStartGame = () => {
    sounds.stopLobbyMusic();
    socket.emit("start_quiz", { pin: roomData?.pin });
  };

  const handleShowLeaderboard = () => socket.emit("show_leaderboard", { pin: roomData?.pin });
  const handleNextQuestion = () => socket.emit("next_question", { pin: roomData?.pin });
  const handleExportExcel = () => downloadReport(roomData?.pin).catch((err) => notify(err.message));

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      sounds.stopLobbyMusic();
      setIsMusicPlaying(false);
    } else {
      sounds.startLobbyMusic();
      setIsMusicPlaying(true);
    }
  };

  // 4 khối màu trắc nghiệm thông thường
  const kahootBlocks = [
    { bg: "kahoot-card-red", icon: "▲", name: "Đỏ" },
    { bg: "kahoot-card-blue", icon: "◆", name: "Lam" },
    { bg: "kahoot-card-yellow", icon: "●", name: "Vàng" },
    { bg: "kahoot-card-green", icon: "■", name: "Lục" }
  ];

  // 2 khối màu cho Đúng / Sai (True / False)
  const trueFalseBlocks = [
    { bg: "kahoot-card-blue", icon: "◆", name: "ĐÚNG" },
    { bg: "kahoot-card-red", icon: "▲", name: "SAI" }
  ];

  const isTrueFalse = currentQuestion?.type === "TRUE_FALSE";
  const activeOptionConfigs = isTrueFalse ? trueFalseBlocks : kahootBlocks;

  return (
    <div className="host-screen min-h-dvh bg-[#002855] flex flex-col justify-between select-none relative">
      {qrOpen && <Modal title="Quét mã để tham gia" onClose={() => setQrOpen(false)}>
        <div className="text-center space-y-4"><QRCodeSVG value={joinUrl} size={360} marginSize={4} className="qr-code h-auto mx-auto" />
          <p className="text-sm text-gray-500">Mã PIN</p><p className="text-4xl sm:text-5xl font-black tracking-widest text-[#002855]">{roomData.pin}</p>
          <p className="text-sm break-all">{window.location.host}</p></div>
      </Modal>}
      {settingsOpen && <GameSettings settings={settings} onClose={() => setSettingsOpen(false)} onSave={draft => { socket.emit('update_room_settings', { pin: roomData.pin, settings: draft }); setSettingsOpen(false); }} />}
      {roomState !== 'GAME_OVER' && <div role="toolbar" aria-label="Điều khiển trò chơi" className="game-controls shrink-0 flex flex-wrap justify-end items-center gap-2 p-3 bg-[#001736] text-white shadow-lg">
        <span className="mr-auto font-bold text-sm" role="status">{paused ? 'Đang tạm dừng' : roomState === 'LOBBY' ? 'Phòng chờ' : `Câu ${questionNumber}/${totalQuestions}`}</span>
        <button disabled={roomState !== 'QUESTION_ACTIVE'} title={roomState !== 'QUESTION_ACTIVE' ? 'Có thể tạm dừng khi người chơi đang trả lời' : undefined} onClick={() => socket.emit(paused ? 'resume_game' : 'pause_game', { pin: roomData.pin })} className="px-4 py-2 rounded-lg bg-white text-[#002855] font-bold disabled:opacity-50 disabled:cursor-not-allowed">{paused ? 'Tiếp tục' : 'Tạm dừng'}</button>
        <button onClick={roomState === 'LOBBY' ? leaveLobby : endEarly} className="px-4 py-2 rounded-lg bg-red-700 text-white font-bold">{roomState === 'LOBBY' ? 'Đóng phòng' : 'Kết thúc sớm'}</button>
      </div>}
      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 animate-float-up flex items-center gap-1.5 px-3 py-1 bg-white text-gray-900 rounded-full shadow-lg border border-gray-200"
            style={{ left: `${(parseInt(r.id, 36) % 70) + 15}%` }}
          >
            <span className="text-2xl">{r.emoji}</span>
            <span className="text-xs font-black">{r.nickname}</span>
          </div>
        ))}
      </div>

      {/* 1. MÀN HÌNH LOBBY PHÒNG CHỜ */}
      {roomState === "LOBBY" && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-white border-b-4 border-gray-300 py-4 px-4 sm:px-8 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-1.5 rounded-lg border border-gray-300 shadow-inner">
                <button onClick={() => setQrOpen(true)} aria-label="Phóng to mã QR" className="shrink-0 rounded-lg p-1 bg-white focus-visible:ring-4 ring-blue-500"><QRCodeSVG value={joinUrl} size={76} /></button>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <BKLogo className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#002855]">
                    BKQuiz • ĐH Bách Khoa TP.HCM
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-bold">
                  Quét mã QR hoặc truy cập trình duyệt:
                </div>
                <div className="text-base font-black text-[#0052cc]">
                  {window.location.host}
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500">
                MÃ PIN PHÒNG CHƠI:
              </div>
              <div className="text-5xl font-black text-[#002855] tracking-wider drop-shadow-sm">
                {roomData?.pin}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-3 rounded-lg bg-blue-50 text-[#002855] text-sm font-bold cursor-pointer">
                <input type="checkbox" checked={!!settings.powerUps} onChange={e => socket.emit('update_room_settings', { pin: roomData.pin, settings: { powerUps: e.target.checked } })} className="w-5 h-5 accent-[#0275b8]" />
                Trợ giúp 50:50 / x2
              </label>
              <button onClick={() => setSettingsOpen(true)} className="px-4 py-3 rounded-lg bg-blue-50 text-[#002855] font-bold">Cài đặt</button>
              <button
                onClick={toggleMusic}
                title="Bật/Tắt nhạc chờ Lobby"
                className={`p-3 rounded-lg font-black text-sm uppercase flex items-center gap-1.5 ${
                  isMusicPlaying
                    ? "bg-[#26890c] text-white shadow-[0_4px_0_#1b6308]"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <Music className="w-5 h-5" />
              </button>

              <button
                onClick={toggleSound}
                title="Bật/Tắt âm thanh"
                className="p-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-600" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={handleStartGame}
                disabled={players.length === 0}
                className="px-8 py-3 rounded-lg font-black text-lg uppercase tracking-wider btn-bk-gold disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                Bắt đầu
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-6xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-white font-black text-xl">
                <Users className="w-6 h-6 text-[#fdb913]" />
                <span>{players.length} người chơi</span>
              </div>

              <div className="text-blue-200 font-bold text-sm flex items-center gap-3">
                {settings.showQuestionsOnPlayerScreen !== false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-900/60 border border-blue-400/30 text-white text-xs font-bold">
                    <Monitor className="w-3.5 h-3.5 text-green-400" /> Câu hỏi trên máy người chơi
                  </span>
                )}
                <span>Bộ đề: <span className="text-white font-black">{roomData?.quizTitle}</span></span>
              </div>
            </div>

            {players.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-[#fdb913] animate-spin mb-4" />
                <h3 className="text-2xl font-black text-white">Đang chờ người chơi…</h3>
                <p className="text-blue-200 text-sm mt-1">
                  Nhập mã PIN <span className="font-black text-[#fdb913] text-lg">{roomData?.pin}</span> trên thiết bị cá nhân
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-wrap gap-3 items-start content-start">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white text-gray-900 px-5 py-2.5 rounded-lg font-black text-lg shadow-md border-b-4 border-gray-300 flex items-center gap-2 animate-in zoom-in-95 duration-200"
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <span>{p.nickname}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-start">
              <button
                onClick={leaveLobby}
                className="px-5 py-2 rounded-lg font-bold text-sm text-blue-200 hover:text-white bg-black/30 hover:bg-black/50"
              >
                Đóng phòng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MÀN HÌNH ĐẾM NGƯỢC GIỚI THIỆU CÂU HỎI */}
      {roomState === "QUESTION_INTRO" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="bg-black/40 px-6 py-2 rounded-full text-white font-black text-sm uppercase tracking-wider border border-white/20">
            Câu hỏi {questionNumber} / {totalQuestions}
          </div>
          <div className="w-full max-w-4xl bg-white rounded-xl p-8 sm:p-12 shadow-2xl border-b-8 border-gray-300">
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight">
              {currentQuestion?.question}
            </h1>
          </div>
          <div className="text-4xl sm:text-6xl font-black text-[#fdb913] animate-pulse">
            Sẵn sàng...
          </div>
        </div>
      )}

      {/* 3. MÀN HÌNH CÂU HỎI ĐANG DIỄN RA */}
      {roomState === "QUESTION_ACTIVE" && (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {/* Thanh trên: Tiêu đề câu hỏi, đồng hồ đếm ngược, số người trả lời */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mb-3">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#001736] border-4 border-[#fdb913] flex items-center justify-center text-3xl font-black text-white shadow-lg shrink-0">
              {remainingTime}
            </div>

            <div className="order-3 sm:order-none w-full sm:w-auto flex-auto sm:flex-1 bg-white rounded-xl p-4 sm:p-6 shadow-xl border-b-4 border-gray-300 text-center">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                Câu {questionNumber} / {totalQuestions} ({isTrueFalse ? "ĐÚNG / SAI" : "4 LỰA CHỌN"})
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                {currentQuestion?.question}
              </h2>
            </div>

            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#001736] border-4 border-white flex flex-col items-center justify-center text-white shadow-lg shrink-0">
              <span className="text-2xl font-black">{answeredCount}</span>
              <span className="text-[10px] font-black uppercase text-blue-200">Đã nộp</span>
            </div>
          </div>

          {/* Ảnh minh họa nếu có */}
          {currentQuestion?.imageUrl && (
            <div className="my-2 flex justify-center">
              <div className="max-h-56 max-w-lg rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-black">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Minh họa câu hỏi"
                  className="w-full h-full object-contain max-h-56"
                />
              </div>
            </div>
          )}

          {/* Các khối màu đáp án */}
          <div
            className={`grid gap-4 flex-1 items-stretch mt-2 ${
              isTrueFalse ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {currentQuestion?.options?.map((opt, index) => (
              <div
                key={opt.id}
                className={`rounded-xl p-6 sm:p-7 flex items-center gap-5 text-white font-black text-xl sm:text-2xl transition-all shadow-md ${
                  activeOptionConfigs[index]?.bg
                }`}
              >
                <span className="text-3xl sm:text-4xl">{activeOptionConfigs[index]?.icon}</span>
                <span className="text-left flex-1">{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MÀN HÌNH KẾT QUẢ CÂU HỎI */}
      {roomState === "QUESTION_RESULT" && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-xl p-5 text-center shadow-lg border-b-4 border-gray-300 mb-6">
            <span className="text-xs font-black uppercase text-gray-400 block mb-1">
              Thống kê kết quả câu hỏi {questionNumber}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              {currentQuestion?.question}
            </h2>
          </div>

          {/* Biểu đồ cột */}
          <div className="bg-[#001736] border-4 border-[#002f66] rounded-xl p-8 flex-1 flex flex-col justify-end">
            <div
              className={`grid gap-4 sm:gap-8 h-64 items-end ${
                isTrueFalse ? "grid-cols-2 max-w-md mx-auto w-full" : "grid-cols-4"
              }`}
            >
              {currentQuestion?.options?.map((opt, idx) => {
                const count = questionStats[idx] || 0;
                const max = Math.max(...questionStats, 1);
                const heightPercent = Math.max(15, (count / max) * 100);

                return (
                  <div key={opt.id} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-2xl sm:text-3xl font-black text-white">{count}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl flex flex-col items-center justify-between p-2 shadow-lg transition-all duration-500 ${
                        activeOptionConfigs[idx]?.bg
                      }`}
                    >
                      {opt.isCorrect ? (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#26890c] font-black">
                          <Check className="w-6 h-6 stroke-[4]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white font-black">
                          <X className="w-5 h-5 stroke-[3]" />
                        </div>
                      )}
                      <span className="text-2xl text-white font-black">{activeOptionConfigs[idx]?.icon}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleShowLeaderboard}
              className="px-8 py-3.5 rounded-lg font-black text-lg uppercase tracking-wider btn-kahoot-white flex items-center gap-2"
            >
              <span>Bảng xếp hạng</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* 5. MÀN HÌNH BẢNG XẾP HẠNG */}
      {roomState === "LEADERBOARD" && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">
              Bảng xếp hạng
            </h1>
            <p className="text-blue-200 text-sm font-bold mt-1">
              Top 5 dẫn đầu sau câu {questionNumber} / {totalQuestions}
            </p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {leaderboard.map((p, index) => (
              <div
                key={p.id}
                className="bg-white text-gray-900 rounded-xl p-4 flex items-center justify-between shadow-lg border-b-4 border-gray-300 animate-in slide-in-from-right duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center font-black text-lg text-gray-800">
                    {index + 1}
                  </div>
                  <span className="text-3xl">{p.avatar}</span>
                  <div>
                    <span className="font-black text-xl text-gray-900 block">{p.nickname}</span>
                    {p.streak >= 2 && (
                      <span className="text-xs font-black text-[#e21b3c]">
                        🔥 Chuỗi {p.streak} câu đúng liên tiếp
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-2xl font-black text-[#0052cc]">
                  {p.score} <span className="text-sm text-gray-500 font-bold">pts</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3.5 rounded-lg font-black text-lg uppercase tracking-wider btn-kahoot-green flex items-center gap-2"
            >
              <span>{isLastQuestion ? "Xem kết quả" : "Câu tiếp theo"}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* 6. MÀN HÌNH VINH DANH CHUNG CUỘC */}
      {roomState === "GAME_OVER" && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-5xl mx-auto w-full">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-1">
              <BKLogo className="w-12 h-12" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
              Kết quả
            </h1>
            <p className="text-blue-200 text-sm font-bold mt-1">
              {endedEarly ? "Đã kết thúc sớm. Điểm đã ghi nhận được giữ lại." : "Cảm ơn mọi người đã chơi!"}
            </p>
          </div>

          <div className="flex items-end justify-center gap-4 sm:gap-8 pt-8 flex-1">
            <div className="flex-1 max-w-[200px] flex flex-col items-center">
              {podium.second ? (
                <>
                  <span className="text-4xl mb-2">{podium.second.avatar}</span>
                  <div className="font-black text-white text-base mb-1 truncate w-full text-center">
                    {podium.second.nickname}
                  </div>
                  <div className="text-xs text-blue-200 font-black mb-2">
                    {podium.second.score} pts
                  </div>
                  <div className="w-full h-44 rounded-t-xl bg-gray-300 border-t-4 border-white flex flex-col items-center justify-center shadow-xl">
                    <span className="text-5xl font-black text-gray-800">2</span>
                    <span className="text-xs font-black text-gray-700 uppercase">Hạng 2</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-44 bg-white/10 rounded-t-xl" />
              )}
            </div>

            <div className="flex-1 max-w-[240px] flex flex-col items-center">
              {podium.first ? (
                <>
                  <div className="text-5xl mb-2 animate-bounce">👑</div>
                  <span className="text-5xl mb-2">{podium.first.avatar}</span>
                  <div className="font-black text-[#ffa602] text-xl mb-1 truncate w-full text-center">
                    {podium.first.nickname}
                  </div>
                  <div className="text-sm text-yellow-300 font-black mb-2">
                    {podium.first.score} pts
                  </div>
                  <div className="w-full h-64 rounded-t-xl bg-[#ffa602] border-t-4 border-yellow-200 flex flex-col items-center justify-center shadow-2xl">
                    <span className="text-6xl font-black text-gray-900">1</span>
                    <span className="text-sm font-black text-gray-900 uppercase">Quán Quân</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-64 bg-white/10 rounded-t-xl" />
              )}
            </div>

            <div className="flex-1 max-w-[200px] flex flex-col items-center">
              {podium.third ? (
                <>
                  <span className="text-4xl mb-2">{podium.third.avatar}</span>
                  <div className="font-black text-white text-base mb-1 truncate w-full text-center">
                    {podium.third.nickname}
                  </div>
                  <div className="text-xs text-blue-200 font-black mb-2">
                    {podium.third.score} pts
                  </div>
                  <div className="w-full h-32 rounded-t-xl bg-[#b06126] border-t-4 border-orange-200 flex flex-col items-center justify-center shadow-xl">
                    <span className="text-4xl font-black text-white">3</span>
                    <span className="text-xs font-black text-orange-200 uppercase">Hạng 3</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-32 bg-white/10 rounded-t-xl" />
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t-2 border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleExportExcel}
              className="px-6 py-3.5 rounded-lg font-black text-sm uppercase tracking-wider btn-kahoot-green flex items-center gap-2"
            >
              <Download className="w-5 h-5 stroke-[3]" />
              Tải bảng điểm
            </button>

            <button
              onClick={onLeave}
              className="px-6 py-3.5 rounded-lg font-black text-sm uppercase tracking-wider btn-kahoot-white"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
