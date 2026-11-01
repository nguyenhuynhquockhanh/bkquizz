import { notify, askConfirm } from "../services/dialogs";
import { apiFetch as fetch, downloadReport } from "../services/api";
import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, Play, Download, BookOpen, HelpCircle, Monitor } from "lucide-react";

export default function MyQuizzes({ user, onHostQuiz, onEditQuiz, onCreateQuiz, activeTab = 'quizzes', setActiveTab }) {
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  const fetchMyQuizzes = async () => {
    try {
      const url = user?.id
        ? `${backendUrl}/api/quizzes?userId=${user.id}`
        : `${backendUrl}/api/quizzes`;

      const [resQuizzes, resHistory] = await Promise.all([
        fetch(url).then((r) => r.json()).catch(() => []),
        fetch(`${backendUrl}/api/history`).then((r) => r.json()).catch(() => [])
      ]);
      setQuizzes(Array.isArray(resQuizzes) ? resQuizzes : []);
      setHistory(Array.isArray(resHistory) ? resHistory : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuizzes();
  }, [backendUrl, user?.id]);

  const handleDeleteQuiz = async (quizId, title) => {
    if (!await askConfirm(`Bạn có chắc chắn muốn xóa bộ đề: "${title}" không?`)) return;

    try {
      const res = await fetch(`${backendUrl}/api/quizzes/${quizId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        notify("Đã xóa quiz.");
        fetchMyQuizzes();
      }
    } catch (_err) {
      notify("Lỗi khi xóa bộ đề!");
    }
  };

  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f0f4f9] text-gray-900 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Quản lý */}
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border-b-4 border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded bg-blue-100 text-[#002855] font-black text-xs uppercase tracking-wider">
              Thư viện của bạn
            </span>
            <h1 className="text-3xl font-black text-gray-900 mt-1">
              Quiz của {user?.name || "bạn"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Tạo câu hỏi, mời bạn bè và bắt đầu chơi.
            </p>
          </div>

          <button
            onClick={onCreateQuiz}
            className="px-6 py-3 rounded-lg font-black text-sm uppercase tracking-wider btn-kahoot-green flex items-center gap-2 shadow"
          >
            <PlusCircle className="w-5 h-5 stroke-[3]" />
            Tạo quiz
          </button>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-gray-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0052cc] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-gray-400 block">Số bộ đề của bạn</span>
              <span className="text-3xl font-black text-gray-900">{quizzes.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-gray-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-50 text-[#d89e00] flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-gray-400 block">Tổng số câu hỏi</span>
              <span className="text-3xl font-black text-gray-900">{totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`pb-3 font-black text-sm uppercase tracking-wider border-b-4 transition-all ${
              activeTab === "quizzes"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Bộ đề của tôi ({quizzes.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 font-black text-sm uppercase tracking-wider border-b-4 transition-all ${
              activeTab === "history"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Lịch sử phòng chơi ({history.length})
          </button>
        </div>

        {/* TAB 1: DANH SÁCH BỘ ĐỀ CỦA TÔI */}
        {activeTab === "quizzes" && (
          <div className="bg-white rounded-xl shadow-sm border-b-4 border-gray-300 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 font-bold">Đang tải câu hỏi của bạn...</div>
            ) : quizzes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-bold space-y-3">
                <p>Bạn chưa tạo bộ câu hỏi nào.</p>
                <button
                  onClick={onCreateQuiz}
                  className="px-4 py-2 rounded bg-[#0052cc] text-white font-bold text-xs uppercase"
                >
                  Bấm vào đây để tạo bộ đề đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="responsive-table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
                      <th className="py-3 px-4">Ảnh bìa</th>
                      <th className="py-3 px-4">Tên quiz</th>
                      <th className="py-3 px-4">Số câu</th>
                      <th className="py-3 px-4">Đọc câu hỏi trên máy người chơi</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-sm">
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-gray-50/80 transition-colors">
                        <td data-label="Ảnh bìa" className="py-3 px-4 w-20">
                          <img
                            src={quiz.coverImage}
                            alt={quiz.title}
                            className="w-14 h-10 object-cover rounded shadow-sm border border-gray-200"
                          />
                        </td>
                        <td data-label="Tên quiz" className="py-3 px-4">
                          <div className="font-black text-gray-900 text-base">{quiz.title}</div>
                          <div className="text-xs text-gray-400 font-normal line-clamp-1">
                            {quiz.description || "Sẵn sàng cho lượt chơi tiếp theo."}
                          </div>
                        </td>
                        <td data-label="Số câu" className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded bg-blue-50 text-[#0052cc] font-black text-xs">
                            {quiz.questions?.length || 0} câu
                          </span>
                        </td>
                        <td data-label="Đọc câu hỏi trên máy người chơi" className="py-3 px-4">
                          {quiz.showQuestionsOnPlayerScreen !== false ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 text-green-700 text-xs font-bold">
                              <Monitor className="w-3.5 h-3.5" /> Bật hiển thị
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 text-gray-500 text-xs font-bold">
                              Chỉ hiện nút màu
                            </span>
                          )}
                        </td>
                        <td data-label="Thao tác" className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onHostQuiz(quiz.id)}
                              title="Mở phòng chơi"
                              className="px-3.5 py-1.5 rounded font-black text-xs uppercase bg-[#26890c] text-white hover:bg-[#1b6308] flex items-center gap-1 shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Chơi ngay
                            </button>

                            <button
                              onClick={() => onEditQuiz(quiz)}
                              title="Chỉnh sửa câu hỏi & cấu hình"
                              className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                              title="Xóa bộ đề"
                              className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LỊCH SỬ PHÒNG CHƠI */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl shadow-sm border-b-4 border-gray-300 overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-bold">
                Chưa có lượt chơi nào. Hãy mở một phòng!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="responsive-table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
                      <th className="py-3 px-4">Mã PIN</th>
                      <th className="py-3 px-4">Tên Trận Đấu</th>
                      <th className="py-3 px-4">Số Người Tham Gia</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4 text-right">Báo Cáo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-sm">
                    {history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td data-label="Mã PIN" className="py-3 px-4 font-black text-[#0052cc]">{h.pin}</td>
                        <td data-label="Tên Trận Đấu" className="py-3 px-4 font-black text-gray-900">{h.quizTitle}</td>
                        <td data-label="Số Người Tham Gia" className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0052cc] font-black text-xs">
                            {h.playerCount} người
                          </span>
                        </td>
                        <td data-label="Thời gian" className="py-3 px-4 text-xs text-gray-500">
                          {new Date(h.endedAt).toLocaleString("vi-VN")}
                        </td>
                        <td data-label="Báo Cáo" className="py-3 px-4 text-right">
                          <button
                            onClick={() => downloadReport(h.pin).catch((err) => notify(err.message))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-black text-xs uppercase bg-[#26890c] text-white hover:bg-[#1b6308] shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Tải Excel (.xlsx)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
