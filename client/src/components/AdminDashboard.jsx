import { notify, askConfirm } from "../services/dialogs";
import { apiFetch as fetch, downloadReport } from "../services/api";
import React, { useState, useEffect } from "react";
import { Users, BookOpen, HelpCircle, Activity, ShieldCheck, Download, Trash2, Plus, Search, RefreshCw, Server, CheckCircle2 } from "lucide-react";
import BKLogo from "./BKLogo";

export default function AdminDashboard({ onBack, currentUser }) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, quizzes, users, live, history
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [liveRooms, setLiveRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form tạo user mới trong Admin
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  const [newUserRole, setNewUserRole] = useState("user");

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resOverview, resQuizzes, resUsers, resLive, resHistory] = await Promise.all([
        fetch(`${backendUrl}/api/admin/overview`).then((r) => r.json()).catch(() => null),
        fetch(`${backendUrl}/api/quizzes`).then((r) => r.json()).catch(() => []),
        fetch(`${backendUrl}/api/admin/users`).then((r) => r.json()).catch(() => []),
        fetch(`${backendUrl}/api/admin/live-rooms`).then((r) => r.json()).catch(() => []),
        fetch(`${backendUrl}/api/admin/history`).then((r) => r.json()).catch(() => [])
      ]);

      setStats(resOverview);
      setQuizzes(Array.isArray(resQuizzes) ? resQuizzes : []);
      setUsers(Array.isArray(resUsers) ? resUsers : []);
      setLiveRooms(Array.isArray(resLive) ? resLive : []);
      setHistory(Array.isArray(resHistory) ? resHistory : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [backendUrl]);

  const handleDeleteQuiz = async (quizId, title) => {
    if (!await askConfirm(`Bạn có chắc muốn xóa vĩnh viễn bộ đề: "${title}"?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/quizzes/${quizId}`, { method: "DELETE" });
      if (res.ok) {
        notify("Đã xóa quiz.");
        fetchAdminData();
      }
    } catch (_err) {
      notify("Lỗi khi xóa!");
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!await askConfirm(`Bạn có chắc muốn xóa tài khoản: "${name}"?`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        notify("Đã xóa tài khoản thành công!");
        fetchAdminData();
      }
    } catch (_err) {
      notify("Lỗi khi xóa tài khoản!");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      notify("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole
        })
      });

      if (res.ok) {
        notify("Đã thêm tài khoản mới thành công!");
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
        setIsAddingUser(false);
        fetchAdminData();
      } else {
        const data = await res.json();
        notify(data.error || "Không thể tạo tài khoản!");
      }
    } catch (_err) {
      notify("Lỗi kết nối máy chủ!");
    }
  };

  const changeRole = async (id, role) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users/${id}/role`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role })
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      await fetchAdminData();
    } catch (err) { notify(err.message || 'Không thể đổi quyền.'); }
  };

  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f6f9] text-gray-900 py-6 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner Admin Header Chuẩn BK */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BKLogo className="w-12 h-12" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#002855]">
                  Quản trị BKQuiz
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-100 text-[#0052cc]">
                  HCMUT
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">
                Quản lý tài khoản, quiz và kết quả chơi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              title="Làm mới dữ liệu"
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0052cc]" : ""}`} />
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#002855] text-white hover:bg-[#003d80] transition-colors shadow-sm"
            >
              Về thư viện
            </button>
          </div>
        </div>

        {/* 4 Thẻ Thống kê nhanh Hệ thống */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-gray-400 block">Tổng số bộ đề thi</span>
              <span className="text-3xl font-black text-[#002855]">{stats?.totalQuizzes || quizzes.length}</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#0052cc] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-gray-400 block">Tổng số câu hỏi</span>
              <span className="text-3xl font-black text-[#002855]">{stats?.totalQuestions || 0}</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-[#d89e00] flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-gray-400 block">Người dùng</span>
              <span className="text-3xl font-black text-[#002855]">{stats?.totalUsers || users.length}</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-green-50 text-[#26890c] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase text-gray-400 block">Phòng đang chơi</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-[#002855]">{liveRooms.length}</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Thanh Menu Tabs Admin */}
        <div className="flex border-b border-gray-300 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === "overview"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Tổng quan
          </button>

          <button
            onClick={() => setActiveTab("quizzes")}
            className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === "quizzes"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Quản lý Đề thi ({quizzes.length})
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === "users"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Quản lý Người dùng ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === "live"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Phòng đang chơi ({liveRooms.length})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              activeTab === "history"
                ? "border-[#0052cc] text-[#0052cc]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Lịch sử Báo Cáo ({history.length})
          </button>
        </div>

        {/* TAB 1: THÔNG TIN HỆ THỐNG & ĐÁP ỨNG ĐỀ TÀI HTTPS (443) */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <h3 className="font-black text-base text-gray-900">
                  Thông tin hệ thống
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold">Giao thức an toàn:</span>
                  <span className="font-black text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    {window.location.protocol === 'https:' ? 'HTTPS' : 'HTTP'} · Cổng {window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold">Kiến trúc triển khai:</span>
                  <span className="font-black text-[#002855]">
                    Single Deployment (React 19 + Express + Socket.IO)
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold">Nền tảng Cloud:</span>
                  <span className="font-black text-[#0052cc]">
                    Azure App Service (Linux Web App)
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-bold">Thời gian máy chủ hoạt động (Uptime):</span>
                  <span className="font-bold text-gray-800">{stats?.uptime || 0} giây</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-bold">Trạng thái Cơ sở dữ liệu:</span>
                  <span className="font-black text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tệp JSON
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Server className="w-5 h-5 text-[#0052cc]" />
                <h3 className="font-black text-base text-gray-900">
                  Quản lý trò chơi
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-600">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-black text-[#002855] block mb-1">
                    Phòng đang chơi
                  </span>
                  Xem các phòng và người tham gia tại mục Phòng đang chơi. Nhấn Làm mới để cập nhật.
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="font-black text-amber-900 block mb-1">
                    Câu hỏi trên máy người chơi
                  </span>
                  Chủ phòng có thể bật hoặc tắt tùy chọn này trong Cài đặt trước khi bắt đầu.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ TẤT CẢ BỘ ĐỀ */}
        {activeTab === "quizzes" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề bộ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0052cc]"
                />
              </div>

              <span className="text-xs font-bold text-gray-500">
                Hiển thị {filteredQuizzes.length} / {quizzes.length} bộ đề thi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="responsive-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
                    <th className="py-3 px-4">Ảnh bìa</th>
                    <th className="py-3 px-4">Tên quiz</th>
                    <th className="py-3 px-4">Số câu</th>
                    <th className="py-3 px-4">Đọc trên máy người chơi</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-bold">
                  {filteredQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                      <td data-label="Ảnh bìa" className="py-3 px-4 w-16">
                        <img
                          src={quiz.coverImage}
                          alt={quiz.title}
                          className="w-12 h-9 object-cover rounded border border-gray-200"
                        />
                      </td>
                      <td data-label="Tên quiz" className="py-3 px-4">
                        <div className="font-black text-[#002855] text-sm">{quiz.title}</div>
                        <div className="text-xs text-gray-400 font-normal line-clamp-1">
                          {quiz.description || "Chưa có mô tả"}
                        </div>
                      </td>
                      <td data-label="Số câu" className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0052cc] text-xs font-black">
                          {quiz.questions?.length || 0} câu
                        </span>
                      </td>
                      <td data-label="Đọc trên máy người chơi" className="py-3 px-4">
                        {quiz.showQuestionsOnPlayerScreen !== false ? (
                          <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
                            Bật
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                            Tắt
                          </span>
                        )}
                      </td>
                      <td data-label="Thao tác" className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                          title="Xóa vĩnh viễn bộ đề này"
                          className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ NGƯỜI DÙNG */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-[#002855]">Danh sách người dùng</h3>
                <p className="text-gray-500 text-xs">Quản lý phân quyền và cấp tài khoản sử dụng hệ thống BKQuiz.</p>
              </div>

              <button
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-[#0052cc] text-white hover:bg-[#003d80] flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm tài khoản mới</span>
              </button>
            </div>

            {/* Form thêm user */}
            {isAddingUser && (
              <form onSubmit={handleCreateUser} className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3 animate-in slide-in-from-top-2">
                <span className="text-xs font-black uppercase text-[#002855] block">
                  Tạo Tài Khoản Mới
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên..."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-3 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Tên đăng nhập hoặc email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-3 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu (ít nhất 6 ký tự)"
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="bg-white border border-gray-300 rounded px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <label className="block text-sm font-bold">Vai trò
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="ml-3 border rounded p-2 bg-white">
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingUser(false)}
                    className="px-3 py-1 rounded text-xs font-bold text-gray-600 bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 rounded text-xs font-black text-white bg-[#0052cc] hover:bg-[#00388b]"
                  >
                    Lưu Tài Khoản
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="responsive-table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Vai trò</th>
                    <th className="py-3 px-4">Ngày tạo</th>
                    <th className="py-3 px-4 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-bold">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td data-label="Họ và Tên" className="py-3 px-4 font-black text-[#002855]">{u.name}</td>
                      <td data-label="Email" className="py-3 px-4 text-gray-700">{u.email}</td>
                      <td data-label="Vai trò" className="py-3 px-4">
                        <select aria-label={`Vai trò của ${u.name}`} value={u.role} disabled={u.id === currentUser.id}
                          onChange={(e) => changeRole(u.id, e.target.value)} className="border rounded px-2 py-1 bg-white disabled:bg-gray-100">
                          <option value="user">Người dùng</option><option value="admin">Quản trị viên</option>
                        </select>
                      </td>
                      <td data-label="Ngày tạo" className="py-3 px-4 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td data-label="Xóa" className="py-3 px-4 text-right">
                        <button
                          disabled={u.id === currentUser.id}
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PHÒNG ĐANG LIVE THỜI GIAN THỰC */}
        {activeTab === "live" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-black text-base text-[#002855]">Giám Sát Phòng Thi Đang Chạy (Live Socket.IO Rooms)</h3>
              <p className="text-gray-500 text-xs">Theo dõi thời gian thực các phòng chơi đang mở, mã PIN và số lượng người chơi.</p>
            </div>

            {liveRooms.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-bold bg-gray-50 rounded-lg">
                Hiện tại không có phòng chơi nào đang hoạt động.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveRooms.map((r) => (
                  <div key={r.pin} className="p-4 rounded-xl border border-gray-200 bg-blue-50/50 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#002855] text-white text-xs font-black">
                        PIN: {r.pin}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        {r.status}
                      </span>
                    </div>

                    <div className="font-black text-sm text-gray-900 line-clamp-1">{r.quizTitle}</div>
                    <div className="text-xs text-gray-600 flex justify-between">
                      <span>Người chơi: <strong>{r.playerCount} người</strong></span>
                      <span>Tiến độ: <strong>{r.currentQuestion} / {r.totalQuestions}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LỊCH SỬ BÁO CÁO THI */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
            <div>
              <h3 className="font-black text-base text-[#002855]">Báo Cáo Trận Đấu & Tải File Excel (.xlsx)</h3>
              <p className="text-gray-500 text-xs">Tải bảng điểm xếp hạng và bảng phân tích tỉ lệ trả lời câu hỏi của từng phòng chơi.</p>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-bold bg-gray-50 rounded-lg">
                Chưa có phòng chơi nào hoàn thành trận đấu.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="responsive-table w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black uppercase text-gray-500">
                      <th className="py-3 px-4">Mã PIN</th>
                      <th className="py-3 px-4">Tên Trận Đấu</th>
                      <th className="py-3 px-4">Số Thí Sinh</th>
                      <th className="py-3 px-4">Thời gian kết thúc</th>
                      <th className="py-3 px-4 text-right">Tải Báo Cáo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-bold">
                    {history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td data-label="Mã PIN" className="py-3 px-4 font-black text-[#0052cc]">{h.pin}</td>
                        <td data-label="Tên Trận Đấu" className="py-3 px-4 text-[#002855]">{h.quizTitle}</td>
                        <td data-label="Số Thí Sinh" className="py-3 px-4 text-gray-700">{h.playerCount} người</td>
                        <td data-label="Thời gian kết thúc" className="py-3 px-4 text-xs text-gray-500">
                          {new Date(h.endedAt).toLocaleString("vi-VN")}
                        </td>
                        <td data-label="Tải Báo Cáo" className="py-3 px-4 text-right">
                          <button
                            onClick={() => downloadReport(h.pin).catch((err) => notify(err.message))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-black uppercase bg-[#26890c] text-white hover:bg-[#1b6308] shadow-sm"
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
