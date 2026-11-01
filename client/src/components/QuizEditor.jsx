import React, { useState } from "react";
import { Plus, Trash2, ArrowLeft, Clock, Award, Check, Image as ImageIcon, HelpCircle, Monitor, FileText } from "lucide-react";

export default function QuizEditor({ onBack, onSaved, editQuizData, currentUser }) {
  const [title, setTitle] = useState(editQuizData?.title || "");
  const [description, setDescription] = useState(editQuizData?.description || "");
  const [coverImage, setCoverImage] = useState(
    editQuizData?.coverImage ||
      "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80"
  );
  const [showQuestionsOnPlayerScreen, setShowQuestionsOnPlayerScreen] = useState(
    editQuizData?.showQuestionsOnPlayerScreen !== false
  );
  const [questions, setQuestions] = useState(
    editQuizData?.questions || [
      {
        id: `q_${Date.now()}`,
        type: "MULTIPLE_CHOICE",
        question: "Câu hỏi mẫu đầu tiên của bạn là gì?",
        imageUrl: "",
        timeLimit: 15,
        points: 1000,
        options: [
          { id: 0, text: "Lựa chọn Đỏ", isCorrect: true },
          { id: 1, text: "Lựa chọn Lam", isCorrect: false },
          { id: 2, text: "Lựa chọn Vàng", isCorrect: false },
          { id: 3, text: "Lựa chọn Lục", isCorrect: false }
        ]
      }
    ]
  );
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showMetaSettings, setShowMetaSettings] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  const handleAddQuestion = (type = "MULTIPLE_CHOICE") => {
    let options = [];
    if (type === "TRUE_FALSE") {
      options = [
        { id: 0, text: "ĐÚNG", isCorrect: true },
        { id: 1, text: "SAI", isCorrect: false }
      ];
    } else {
      options = [
        { id: 0, text: "", isCorrect: true },
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false }
      ];
    }

    const newQ = {
      id: `q_${Date.now()}_${questions.length}`,
      type,
      question: type === "TRUE_FALSE" ? "Mệnh đề này là Đúng hay Sai?" : "Nhập câu hỏi của bạn tại đây...",
      imageUrl: "",
      timeLimit: 15,
      points: 1000,
      options
    };
    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  const handleChangeQuestionType = (newType) => {
    const updated = [...questions];
    const q = updated[activeQIndex];
    q.type = newType;
    if (newType === "TRUE_FALSE") {
      q.options = [
        { id: 0, text: "ĐÚNG", isCorrect: true },
        { id: 1, text: "SAI", isCorrect: false }
      ];
    } else {
      q.options = [
        { id: 0, text: q.options[0]?.text || "Lựa chọn 1", isCorrect: true },
        { id: 1, text: q.options[1]?.text || "Lựa chọn 2", isCorrect: false },
        { id: 2, text: "Lựa chọn 3", isCorrect: false },
        { id: 3, text: "Lựa chọn 4", isCorrect: false }
      ];
    }
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index, e) => {
    e.stopPropagation();
    if (questions.length <= 1) {
      alert("Bộ đề thi cần có tối thiểu ít nhất 1 câu hỏi!");
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    setActiveQIndex(Math.max(0, index - 1));
  };

  const updateCurrentQuestion = (field, value) => {
    const updated = [...questions];
    updated[activeQIndex][field] = value;
    setQuestions(updated);
  };

  const updateOptionText = (optIdx, text) => {
    const updated = [...questions];
    updated[activeQIndex].options[optIdx].text = text;
    setQuestions(updated);
  };

  const setCorrectOption = (optIdx) => {
    const updated = [...questions];
    updated[activeQIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optIdx;
    });
    setQuestions(updated);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề cho bộ đề thi!");
      return;
    }

    setIsSaving(true);
    const isEdit = !!editQuizData?.id;
    const url = isEdit
      ? `${backendUrl}/api/quizzes/${editQuizData.id}`
      : `${backendUrl}/api/quizzes`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "user_demo_01",
          title: title.trim(),
          description: description.trim(),
          coverImage,
          showQuestionsOnPlayerScreen,
          questions
        })
      });

      if (res.ok) {
        alert(isEdit ? "Đã cập nhật bộ đề thành công!" : "Đã lưu bộ đề mới thành công!");
        onSaved();
      } else {
        alert("Có lỗi xảy ra khi lưu!");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến server backend!");
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = questions[activeQIndex] || questions[0];

  const optionColorConfigs = [
    { bg: "bg-[#e21b3c]", icon: "▲", name: "Đỏ" },
    { bg: "bg-[#1368ce]", icon: "◆", name: "Lam" },
    { bg: "bg-[#d89e00]", icon: "●", name: "Vàng" },
    { bg: "bg-[#26890c]", icon: "■", name: "Lục" }
  ];

  const trueFalseConfigs = [
    { bg: "bg-[#1368ce]", icon: "◆", name: "ĐÚNG" },
    { bg: "bg-[#e21b3c]", icon: "▲", name: "SAI" }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f0f4f9] text-gray-900 flex flex-col justify-between">
      {/* Top Header thanh công cụ BK Quiz Creator */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              placeholder="Nhập tiêu đề bộ đề thi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-black text-xl text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-[#0052cc] focus:outline-none px-1 py-0.5 w-64 sm:w-96"
            />
          </div>
        </div>

        {/* Nút cài đặt & hiển thị câu hỏi trên máy người chơi */}
        <div className="flex items-center gap-3">
          {/* Nút bật/tắt hiển thị câu hỏi cho người chơi */}
          <button
            type="button"
            onClick={() => setShowQuestionsOnPlayerScreen(!showQuestionsOnPlayerScreen)}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 transition-all border ${
              showQuestionsOnPlayerScreen
                ? "bg-green-50 border-green-300 text-green-700 shadow-sm"
                : "bg-gray-50 border-gray-300 text-gray-500"
            }`}
            title="Bật/Tắt hiển thị câu hỏi và chữ đáp án trực tiếp trên điện thoại/máy tính của người chơi"
          >
            <Monitor className="w-4 h-4" />
            <span>Hiển thị câu hỏi trên máy người chơi:</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-black ${
              showQuestionsOnPlayerScreen ? "bg-green-600 text-white" : "bg-gray-400 text-white"
            }`}>
              {showQuestionsOnPlayerScreen ? "BẬT" : "TẮT"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowMetaSettings(!showMetaSettings)}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Thông tin bộ đề</span>
          </button>

          <button
            onClick={handleSaveQuiz}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider btn-kahoot-green shadow"
          >
            {isSaving ? "Đang lưu..." : editQuizData?.id ? "Cập nhật đề" : "Lưu bộ đề"}
          </button>
        </div>
      </div>

      {/* Panel bổ sung: Mô tả & Ảnh bìa bộ đề */}
      {showMetaSettings && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center animate-in slide-in-from-top-2 duration-200">
          <div className="flex-1 w-full">
            <label className="block text-xs font-black uppercase text-gray-600 mb-1">
              Mô tả ngắn về bộ đề:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đề trắc nghiệm môn Mạng Máy Tính - Khoa KH&KT Máy Tính HCMUT"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#0052cc]"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-black uppercase text-gray-600 mb-1">
              Link ảnh bìa bộ đề (Cover Image):
            </label>
            <input
              type="text"
              placeholder="URL ảnh bìa Unsplash hoặc web..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#0052cc]"
            />
          </div>
        </div>
      )}

      {/* Vùng soạn thảo chính */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 sm:p-6 gap-6">
        {/* Cột trái: Slide các câu hỏi */}
        <div className="w-full md:w-64 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-black text-xs uppercase text-gray-500">
              Câu hỏi ({questions.length})
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handleAddQuestion("MULTIPLE_CHOICE")}
                title="Thêm trắc nghiệm 4 lựa chọn"
                className="px-2.5 py-1.5 rounded-lg font-black text-xs uppercase bg-[#0052cc] text-white flex items-center gap-1 shadow-sm hover:bg-[#00388b]"
              >
                <Plus className="w-3.5 h-3.5" />
                4 Lựa chọn
              </button>
              <button
                onClick={() => handleAddQuestion("TRUE_FALSE")}
                title="Thêm câu hỏi Đúng / Sai"
                className="px-2.5 py-1.5 rounded-lg font-black text-xs uppercase bg-[#d89e00] text-white flex items-center gap-1 shadow-sm hover:bg-[#b08000]"
              >
                Đúng/Sai
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => setActiveQIndex(idx)}
                className={`p-3 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-all ${
                  activeQIndex === idx
                    ? "bg-white border-[#0052cc] shadow-md scale-[1.02]"
                    : "bg-white/80 border-gray-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="font-black text-sm text-[#002855]">{idx + 1}</span>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-gray-800 truncate block max-w-[120px]">
                      {q.question || "Chưa có nội dung"}
                    </span>
                    <span className="text-[10px] font-black uppercase text-[#0052cc]">
                      {q.type === "TRUE_FALSE" ? "Đúng/Sai" : "4 Lựa chọn"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteQuestion(idx, e)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Khu vực giữa: Khung soạn thảo câu hỏi chi tiết */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Ô nhập câu hỏi lớn ở trên */}
          <div className="bg-white rounded-xl p-5 shadow-md border-b-4 border-gray-200 text-center">
            <textarea
              rows={2}
              value={currentQ.question}
              onChange={(e) => updateCurrentQuestion("question", e.target.value)}
              placeholder="Bắt đầu nhập nội dung câu hỏi tại đây..."
              className="w-full text-center text-xl sm:text-2xl font-black text-gray-900 placeholder-gray-400 border-0 focus:outline-none resize-none"
            />
          </div>

          {/* Ô nhập ảnh minh họa cho câu hỏi */}
          <div className="bg-white rounded-lg p-3.5 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 shrink-0">
              <ImageIcon className="w-4 h-4 text-[#0052cc]" />
              <span>Link ảnh minh họa:</span>
            </div>
            <input
              type="text"
              placeholder="Dán URL ảnh minh họa (tùy chọn, ví dụ: https://images.unsplash.com/...)"
              value={currentQ.imageUrl || ""}
              onChange={(e) => updateCurrentQuestion("imageUrl", e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#0052cc]"
            />
            {currentQ.imageUrl && (
              <img
                src={currentQ.imageUrl}
                alt="Preview"
                className="h-10 w-16 object-cover rounded border border-gray-300 shrink-0"
              />
            )}
          </div>

          {/* Thanh cài đặt loại câu hỏi, thời gian & điểm */}
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white py-2 px-4 rounded-lg shadow-sm border border-gray-200">
            {/* Loại câu hỏi */}
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#0052cc]" />
              <span className="text-xs font-black uppercase text-gray-500">Dạng câu:</span>
              <select
                value={currentQ.type || "MULTIPLE_CHOICE"}
                onChange={(e) => handleChangeQuestionType(e.target.value)}
                className="font-black text-sm text-[#0052cc] bg-blue-50 rounded px-2.5 py-1 focus:outline-none"
              >
                <option value="MULTIPLE_CHOICE">Trắc nghiệm 4 lựa chọn</option>
                <option value="TRUE_FALSE">Đúng / Sai (True / False)</option>
              </select>
            </div>

            {/* Thời gian */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-black uppercase text-gray-500">Thời gian:</span>
              <select
                value={currentQ.timeLimit}
                onChange={(e) => updateCurrentQuestion("timeLimit", Number(e.target.value))}
                className="font-black text-sm text-gray-900 bg-gray-100 rounded px-2 py-1 focus:outline-none"
              >
                <option value={10}>10 giây</option>
                <option value={15}>15 giây</option>
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>

            {/* Điểm số */}
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-black uppercase text-gray-500">Điểm số:</span>
              <select
                value={currentQ.points}
                onChange={(e) => updateCurrentQuestion("points", Number(e.target.value))}
                className="font-black text-sm text-gray-900 bg-gray-100 rounded px-2 py-1 focus:outline-none"
              >
                <option value={1000}>Tiêu chuẩn (1000)</option>
                <option value={2000}>Gấp đôi (2000)</option>
              </select>
            </div>
          </div>

          {/* KHU VỰC ĐÁP ÁN: 4 Lựa chọn HOẶC Đúng / Sai */}
          {currentQ.type === "TRUE_FALSE" ? (
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-[140px]">
              {currentQ.options.slice(0, 2).map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`${trueFalseConfigs[idx]?.bg} rounded-xl p-5 flex items-center justify-between shadow-md`}
                >
                  <div className="flex items-center gap-4 text-white">
                    <span className="text-4xl font-black select-none">
                      {trueFalseConfigs[idx]?.icon}
                    </span>
                    <span className="text-3xl font-black">{opt.text}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCorrectOption(idx)}
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${
                      opt.isCorrect
                        ? "bg-white border-white text-[#26890c]"
                        : "border-white/50 hover:border-white text-transparent"
                    }`}
                  >
                    <Check className="w-7 h-7 stroke-[4]" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {currentQ.options.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`${optionColorConfigs[idx]?.bg} rounded-xl p-4 flex items-center gap-3 shadow-md min-h-[90px]`}
                >
                  <span className="text-2xl text-white font-black select-none">
                    {optionColorConfigs[idx]?.icon}
                  </span>

                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                    placeholder={`Nhập đáp án ${idx + 1}`}
                    className="flex-1 bg-transparent text-white font-black text-lg placeholder-white/60 focus:outline-none border-b border-white/20 focus:border-white py-1"
                  />

                  <button
                    type="button"
                    onClick={() => setCorrectOption(idx)}
                    className={`w-9 h-9 rounded-full border-4 flex items-center justify-center transition-all ${
                      opt.isCorrect
                        ? "bg-white border-white text-[#26890c]"
                        : "border-white/50 hover:border-white text-transparent"
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[4]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
