import React, { useState, useEffect } from "react";
import { Check, X, Flame, Zap } from "lucide-react";
import { sounds } from "../services/sound";
import BKLogo from "./BKLogo";

export default function PlayerScreen({ playerData, socket, onLeave }) {
  const snapshot = playerData.snapshot;
  const [playerState, setPlayerState] = useState(snapshot?.playerState || 'LOBBY');
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(snapshot?.questionNumber || 1);
  const [currentQuestionType, setCurrentQuestionType] = useState(snapshot?.questionType || 'MULTIPLE_CHOICE');
  const [questionTitle, setQuestionTitle] = useState(snapshot?.questionTitle || '');
  const [questionImageUrl, setQuestionImageUrl] = useState(snapshot?.imageUrl || '');
  const [questionOptions, setQuestionOptions] = useState(snapshot?.options || []);
  const [showQuestionsOnPlayer, setShowQuestionsOnPlayer] = useState(
    playerData?.showQuestionsOnPlayerScreen !== false
  );
  const [remainingTime, setRemainingTime] = useState(snapshot?.remainingTime ?? 15);
  const [powerUps, setPowerUps] = useState(playerData?.player?.powerUps || { fiftyFifty: 1, doublePoints: 1 });
  const [eliminatedOptions, setEliminatedOptions] = useState(snapshot?.eliminatedOptions || []);
  const [useDoublePointsThisRound, setUseDoublePointsThisRound] = useState(snapshot?.useDouble || false);
  const [lastResult, setLastResult] = useState(snapshot?.lastResult || null);
  const [totalScore, setTotalScore] = useState(snapshot?.totalScore ?? playerData.player.score ?? 0);
  const [currentStreak, setCurrentStreak] = useState(snapshot?.streak ?? playerData.player.streak ?? 0);

  const [paused, setPaused] = useState(snapshot?.paused || false);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState(!!playerData?.settings?.powerUps);
  const EMOJIS = ["❤️", "😂", "🔥", "👏", "⚡", "🎓"];

  useEffect(() => {
    socket.on("game_paused", ({ paused }) => setPaused(paused));
    socket.on("room_settings", settings => { setPowerUpsEnabled(settings.powerUps); setShowQuestionsOnPlayer(settings.showQuestionsOnPlayerScreen); });
    socket.on("question_intro", ({ questionNumber, questionType, questionTitle: qTitle, showQuestionsOnPlayer: sQ }) => {
      setPlayerState("INTRO");
      setCurrentQuestionNumber(questionNumber);
      setCurrentQuestionType(questionType || "MULTIPLE_CHOICE");
      if (sQ !== undefined) setShowQuestionsOnPlayer(sQ);
      if (qTitle) setQuestionTitle(qTitle);
      setEliminatedOptions([]);
      setUseDoublePointsThisRound(false);
      sounds.playPop();
    });

    socket.on(
      "question_start_player",
      ({
        questionNumber,
        questionType,
        timeLimit,
        powerUps: pUps,
        powerUpsEnabled: assistsEnabled,
        showQuestionsOnPlayer: sQ,
        questionTitle: qTitle,
        imageUrl: imgUrl,
        options: qOpts
      }) => {
        setPlayerState("PLAYING");
        setCurrentQuestionNumber(questionNumber);
        setCurrentQuestionType(questionType || "MULTIPLE_CHOICE");
        setRemainingTime(timeLimit);
        if (pUps) setPowerUps(pUps);
        if (assistsEnabled !== undefined) setPowerUpsEnabled(assistsEnabled);
        if (sQ !== undefined) setShowQuestionsOnPlayer(sQ);
        if (qTitle) setQuestionTitle(qTitle);
        setQuestionImageUrl(imgUrl || "");
        if (qOpts) setQuestionOptions(qOpts);
      }
    );

    socket.on("timer_tick", ({ remaining }) => {
      setRemainingTime(remaining);
      if (remaining <= 5 && remaining > 0 && playerState === "PLAYING") {
        sounds.playTick();
      }
    });

    socket.on("fifty_fifty_result", ({ eliminatedOptions }) => setEliminatedOptions(eliminatedOptions));

    socket.on("question_result_player", ({ isCorrect, pointsEarned, totalScore, streak }) => {
      setPlayerState("RESULT");
      setLastResult({ isCorrect, pointsEarned });
      setTotalScore(totalScore);
      setCurrentStreak(streak);

      if (isCorrect) {
        sounds.playCorrect();
      } else {
        sounds.playWrong();
      }
    });

    socket.on("leaderboard_update", () => setPlayerState("WAITING_NEXT"));
    socket.on("game_over", ({ allPlayers }) => { setPaused(false); setPlayerState("GAME_OVER"); const me = allPlayers?.find(p => p.id === playerData?.player?.id); if (me) setTotalScore(me.score); });

    return () => {
      socket.off("game_paused");
      socket.off("room_settings");
      socket.off("question_intro");
      socket.off("question_start_player");
      socket.off("timer_tick");
      socket.off("fifty_fifty_result");
      socket.off("question_result_player");
      socket.off("leaderboard_update");
      socket.off("game_over");
    };
  }, [socket, onLeave, playerState, playerData?.player?.id]);

  const handleSelectAnswer = (optionId) => {
    if (playerState !== "PLAYING" || paused) return;
    sounds.playPop();
    setPlayerState("SUBMITTED");
    socket.emit("submit_answer", { optionId, usedDouble: useDoublePointsThisRound });
  };

  const handleUseFiftyFifty = () => {
    if (!paused && powerUps.fiftyFifty > 0 && playerState === "PLAYING" && currentQuestionType !== "TRUE_FALSE") {
      sounds.playPop();
      setPowerUps((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
      socket.emit("use_fifty_fifty");
    }
  };

  const handleToggleDouble = () => {
    if (!paused && powerUps.doublePoints > 0 && playerState === "PLAYING") {
      sounds.playPop();
      setUseDoublePointsThisRound((prev) => !prev);
      socket.emit('select_double_points', { enabled: !useDoublePointsThisRound });
    }
  };

  const handleSendEmoji = (emoji) => {
    sounds.playPop();
    socket.emit("send_reaction", { emoji });
  };

  const kahootOptions = [
    { id: 0, theme: "kahoot-card-red", icon: "▲", fallbackText: "Lựa chọn 1" },
    { id: 1, theme: "kahoot-card-blue", icon: "◆", fallbackText: "Lựa chọn 2" },
    { id: 2, theme: "kahoot-card-yellow", icon: "●", fallbackText: "Lựa chọn 3" },
    { id: 3, theme: "kahoot-card-green", icon: "■", fallbackText: "Lựa chọn 4" }
  ];

  const trueFalseOptions = [
    { id: 0, theme: "kahoot-card-blue", icon: "◆", text: "ĐÚNG" },
    { id: 1, theme: "kahoot-card-red", icon: "▲", text: "SAI" }
  ];

  const isTrueFalse = currentQuestionType === "TRUE_FALSE";

  return (
    <div className="player-screen min-h-dvh w-full flex flex-col justify-between select-none bg-[#002855]">
      {paused && <div className="fixed inset-0 z-40 bg-[#001736]/95 text-white flex items-center justify-center p-6 text-center" role="status"><div><h2 className="text-3xl font-black">Đang tạm dừng</h2><p className="mt-3">Chờ chủ phòng tiếp tục nhé.</p></div></div>}
      {/* Top Header mỏng chuẩn BK */}
      <div className="bg-[#001c3d] border-b-2 border-[#00132b] px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{playerData?.player?.avatar}</span>
          <div className="flex flex-col text-left leading-tight">
            <span className="font-black text-white text-sm sm:text-base">{playerData?.player?.nickname}</span>
            <span className="text-[10px] text-blue-200 font-bold uppercase">Người chơi</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentStreak >= 2 && (
            <div className="flex items-center gap-1 text-xs font-black text-[#ffa602] bg-black/40 px-2 py-1 rounded-md border border-[#ffa602]/30">
              <Flame className="w-3.5 h-3.5 fill-[#ffa602]" />
              <span>{currentStreak}</span>
            </div>
          )}
          <div className="bg-black/40 px-3 py-1 rounded-md text-white font-black text-sm border border-white/10">
            {totalScore} <span className="text-xs text-blue-200 font-bold">pts</span>
          </div>
        </div>
      </div>

      {/* 1. MÀN HÌNH LOBBY */}
      {playerState === "LOBBY" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BKLogo className="w-8 h-8" />
            <span className="text-xs font-black uppercase text-blue-200 tracking-wider">
              BKQuiz • ĐH Bách Khoa TP.HCM
            </span>
          </div>

          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-2xl ring-4 ring-[#fdb913]">
            {playerData?.player?.avatar}
          </div>

          <h2 className="text-3xl font-black text-white leading-tight">
            Bạn đã sẵn sàng!
          </h2>
          <p className="text-blue-200 text-sm max-w-xs font-bold">
            Bạn đã vào phòng. Chờ chủ phòng bắt đầu nhé!
          </p>

          <div className="bg-black/30 px-5 py-2.5 rounded-lg font-black text-white text-xs border border-white/10">
            MÃ PIN: <span className="text-[#fdb913] font-black text-sm">{playerData?.pin}</span>
          </div>
        </div>
      )}

      {/* 2. MÀN HÌNH CHUẨN BỊ (INTRO) */}
      {playerState === "INTRO" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#001d40]">
          <span className="text-xs font-black uppercase text-blue-300 tracking-wider">
            CÂU HỎI {currentQuestionNumber} ({isTrueFalse ? "ĐÚNG / SAI" : "4 LỰA CHỌN"})
          </span>
          {showQuestionsOnPlayer && questionTitle && (
            <div className="max-w-md bg-white text-[#002855] p-5 rounded-xl font-black text-lg sm:text-xl shadow-lg border-b-4 border-gray-300">
              {questionTitle}
            </div>
          )}
          <h2 className="text-4xl font-black text-[#fdb913] animate-pulse">Sẵn sàng!</h2>
        </div>
      )}

      {/* 3. MÀN HÌNH CHỌN ĐÁP ÁN (HỖ TRỢ HIỂN THỊ CÂU HỎI TRỰC TIẾP TRÊN MÁY NGƯỜI CHƠI) */}
      {playerState === "PLAYING" && (
        <div className="flex-1 flex flex-col justify-between p-3 gap-2 sm:gap-3 overflow-y-auto">
          {/* Thanh trạng thái thời gian & trợ giúp */}
          <div className="flex flex-wrap gap-2 items-center justify-between px-1 shrink-0">
            <span className="text-xs font-black text-white/90">
              Thời gian: <span className="text-[#fdb913] font-black text-sm">{remainingTime}s</span>
            </span>

            <div className={powerUpsEnabled ? "flex items-center gap-2" : "hidden"}>
              {!isTrueFalse && (
                <button
                  type="button"
                  onClick={handleUseFiftyFifty}
                  disabled={paused || powerUps.fiftyFifty <= 0 || eliminatedOptions.length > 0}
                  className={`px-3 py-1 rounded-md font-black text-xs uppercase flex items-center gap-1 ${
                    powerUps.fiftyFifty > 0 && eliminatedOptions.length === 0
                      ? "bg-white text-gray-900 shadow"
                      : "bg-white/20 text-white/40 cursor-not-allowed"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  50:50 ({powerUps.fiftyFifty})
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleDouble}
                disabled={paused || powerUps.doublePoints <= 0}
                aria-pressed={useDoublePointsThisRound}
                className={`px-3 py-1 rounded-md font-black text-xs uppercase flex items-center gap-1 ${
                  useDoublePointsThisRound
                    ? "bg-[#fdb913] text-gray-900 shadow scale-105 ring-2 ring-white"
                    : powerUps.doublePoints > 0
                    ? "bg-white text-gray-900 shadow"
                    : "bg-white/20 text-white/40 cursor-not-allowed"
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                x2 Điểm
              </button>
            </div>
          </div>

          {/* KHỐI NỘI DUNG CÂU HỎI HIỂN THỊ TRÊN MÀN HÌNH NGƯỜI CHƠI NẾU BẬT */}
          {showQuestionsOnPlayer && (
            <div className="bg-white rounded-xl p-3.5 shadow-md border-b-4 border-gray-300 text-center shrink-0">
              <span className="text-[10px] font-black uppercase text-blue-700 block mb-0.5">
                Câu {currentQuestionNumber} ({isTrueFalse ? "ĐÚNG / SAI" : "TRẮC NGHIỆM"})
              </span>
              <h3 className="text-base sm:text-lg font-black text-gray-900 leading-snug">
                {questionTitle || "Nội dung câu hỏi đang được trình chiếu..."}
              </h3>
              {questionImageUrl && (
                <div className="mt-2 flex justify-center max-h-64">
                  <img
                    src={questionImageUrl}
                    alt="Minh họa"
                    className="max-h-64 rounded-lg object-contain border border-gray-200"
                  />
                </div>
              )}
            </div>
          )}

          {/* CÁC NÚT ĐÁP ÁN */}
          {isTrueFalse ? (
            <div className="grid grid-cols-1 gap-3 flex-1 min-h-[160px]">
              {trueFalseOptions.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleSelectAnswer(btn.id)}
                  className={`w-full min-h-24 rounded-xl flex items-center justify-center gap-4 transition-all ${btn.theme} active:scale-95 cursor-pointer shadow-lg`}
                >
                  <span className="text-4xl text-white drop-shadow-md">{btn.icon}</span>
                  <span className="text-3xl text-white font-black tracking-wider">{btn.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 flex-1 min-h-[280px]">
              {kahootOptions.map((btn) => {
                const isEliminated = eliminatedOptions.includes(btn.id);
                const optText = questionOptions.find((o) => o.id === btn.id)?.text;

                return (
                  <button
                    key={btn.id}
                    disabled={isEliminated || paused}
                    onClick={() => handleSelectAnswer(btn.id)}
                    className={`w-full min-h-24 rounded-xl flex flex-col items-center justify-center p-3 gap-1.5 transition-all ${
                      btn.theme
                    } ${
                      isEliminated
                        ? "opacity-15 cursor-not-allowed"
                        : "active:scale-95 cursor-pointer shadow-md"
                    }`}
                  >
                    <span className="text-4xl sm:text-5xl text-white drop-shadow-md select-none">{btn.icon}</span>
                    {/* Hiển thị chữ đáp án nếu bật chế độ đọc câu hỏi trên máy người chơi */}
                    {showQuestionsOnPlayer && optText && (
                      <span className="text-xs sm:text-sm font-black text-white text-center break-words px-1">
                        {optText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. MÀN HÌNH ĐÃ GỬI LỰA CHỌN */}
      {playerState === "SUBMITTED" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#001d40]">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-[#fdb913] animate-spin mb-2" />
          <h2 className="text-3xl font-black text-white">Đã gửi!</h2>
          <p className="text-blue-200 text-sm font-bold">
            Chờ những người chơi còn lại nhé.
          </p>
        </div>
      )}

      {/* 5. MÀN HÌNH KẾT QUẢ ĐÚNG / SAI */}
      {playerState === "RESULT" && (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 ${
            lastResult?.isCorrect ? "bg-[#26890c]" : "bg-[#e21b3c]"
          }`}
        >
          {lastResult?.isCorrect ? (
            <>
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl ring-4 ring-green-300">
                <Check className="w-14 h-14 text-[#26890c] stroke-[4]" />
              </div>
              <h2 className="text-4xl font-black text-white">Chính xác!</h2>
              <div className="text-2xl font-black text-white">+{lastResult.pointsEarned} điểm</div>
              {currentStreak >= 2 && (
                <div className="bg-black/25 px-4 py-1.5 rounded-full text-white font-black text-sm">
                  🔥 Chuỗi đúng {currentStreak} câu liên tiếp!
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl ring-4 ring-red-300">
                <X className="w-14 h-14 text-[#e21b3c] stroke-[4]" />
              </div>
              <h2 className="text-4xl font-black text-white">Chưa đúng!</h2>
              <p className="text-white/90 font-bold text-sm">Cố gắng ở câu hỏi tiếp theo nhé!</p>
            </>
          )}

          <div className="mt-4 bg-black/25 px-6 py-2.5 rounded-lg text-white font-black text-lg border border-white/10">
            Tổng điểm: {totalScore} pts
          </div>
        </div>
      )}

      {/* 6. MÀN HÌNH BẢNG XẾP HẠNG / KẾT THÚC */}
      {(playerState === "WAITING_NEXT" || playerState === "GAME_OVER") && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#001d40]">
          <div className="text-5xl">{playerState === "GAME_OVER" ? "🏆" : "👀"}</div>
          <h2 className="text-3xl font-black text-white">
            {playerState === "GAME_OVER" ? "Đã kết thúc!" : "Bảng Xếp Hạng"}
          </h2>
          <p className="text-blue-200 text-sm font-bold max-w-xs">
            {playerState === "GAME_OVER"
              ? "Chơi hay lắm! Hẹn gặp lại ở lượt tiếp theo."
              : "Xem thứ hạng trên màn hình của chủ phòng."}
          </p>

          <div className="bg-white text-[#002855] px-6 py-3 rounded-xl font-black text-xl shadow-lg border-b-4 border-gray-300">
            Điểm chung cuộc: <span className="text-[#0052cc]">{totalScore} pts</span>
          </div>

          {playerState === "GAME_OVER" && (
            <button
              onClick={onLeave}
              className="mt-4 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-wider btn-kahoot-white"
            >
              Thoát về Trang chủ
            </button>
          )}
        </div>
      )}

      {/* Khay Emoji Reaction */}
      <div className="bg-[#001736] border-t-2 border-[#001026] px-3 py-2 flex items-center justify-around">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleSendEmoji(emoji)}
            className="text-2xl p-1 hover:scale-125 active:scale-150 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
