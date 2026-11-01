import DialogHost from "./components/DialogHost";
import { notify } from "./services/dialogs";
import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import HostScreen from "./components/HostScreen";
import PlayerScreen from "./components/PlayerScreen";
import QuizEditor from "./components/QuizEditor";
import MyQuizzes from "./components/MyQuizzes";
import AdminDashboard from "./components/AdminDashboard";
import LoginModal from "./components/LoginModal";
import { apiFetch, getToken, setToken } from './services/api';
import { socket } from "./services/socket";

export default function App() {
  const [currentView, setCurrentView] = useState("home"); // home, host, player, editor, my-quizzes, admin
  const [roomData, setRoomData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    let active = true;
    const clearUser = () => { setCurrentUser(null); setCurrentView('home'); };
    const refresh = async () => {
      try {
        if (!getToken()) return;
        const response = await apiFetch((import.meta.env.VITE_BACKEND_URL || '') + '/api/auth/me');
        if (response.ok && active) setCurrentUser(await response.json());
      } catch { if (active) setCurrentUser(null); }
      finally { if (active) setAuthLoading(false); }
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('bkquiz:logged-out', clearUser);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('bkquiz:logged-out', clearUser);
    };
  }, []);

  useEffect(() => {
    // Kiểm tra nếu URL có path /admin
    if (window.location.pathname === "/admin") {
      setCurrentView("admin");
    }

    socket.on("room_created", (data) => {
      setRoomData(data);
      setCurrentView("host");
    });

    socket.on("join_success", (data) => {
      setPlayerData(data);
      setCurrentView("player");
    });

    socket.on('host_error', ({ message }) => notify(message));
    socket.on("join_error", ({ message }) => {
      notify(message || "Không thể tham gia phòng!");
    });

    return () => {
      socket.off("room_created");
      socket.off("join_success");
      socket.off("join_error");
      socket.off("host_error");
    };
  }, []);

  const handleJoinGame = ({ pin, nickname, avatar }) => {
    socket.emit("join_room", { pin, nickname, avatar });
  };

  const handleHostGame = (quizId) => {
    socket.emit("create_room", { quizId });
  };

  const handleLeaveToHome = () => {
    if (roomData) socket.emit("close_room", { pin: roomData.pin });
    if (playerData) socket.emit("leave_room");
    setRoomData(null);
    setPlayerData(null);
    setEditingQuiz(null);
    setCurrentView("home");
    window.history.replaceState({}, document.title, "/");
  };

  const handleLoginSuccess = (user) => {
    const { token, ...profile } = user;
    setToken(token);
    setCurrentUser(profile);
    socket.disconnect().connect();
    setCurrentView(profile.role === 'admin' ? 'admin' : 'my-quizzes');
  };

  const handleLogout = async () => {
    try { await apiFetch((import.meta.env.VITE_BACKEND_URL || '') + '/api/auth/logout', { method: 'POST' }); }
    catch { notify('Không thể kết nối máy chủ để thu hồi phiên đăng nhập.'); }
    setToken(null);
    socket.disconnect().connect();
    setCurrentUser(null);
    localStorage.removeItem("bkquiz_user");
    localStorage.removeItem("kahoot_user");
    setCurrentView("home");
  };

  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setCurrentView("editor");
  };

  const handleOpenCreateQuiz = () => {
    setEditingQuiz(null);
    setCurrentView("editor");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 flex flex-col font-sans select-none">
      {/* Navbar chỉ hiển thị ở màn hình thông thường (ẩn khi Host/Player toàn màn hình) */}
      {currentView !== "host" && currentView !== "player" && (
        <Navbar
          currentView={currentView}
          setView={view => { if (view === "editor") setEditingQuiz(null); setCurrentView(view); }}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <DialogHost />
      <main className="flex-1 flex flex-col">
        {currentView === 'admin' && currentUser?.role !== 'admin' && (
          <div className="p-8 text-center space-y-4">
            <p>{authLoading ? 'Đang kiểm tra đăng nhập…' : 'Khu vực này chỉ dành cho quản trị viên.'}</p>
            {!authLoading && !currentUser && <button onClick={() => setIsLoginModalOpen(true)} className="bg-[#0275b8] text-white rounded px-5 py-2">Đăng nhập</button>}
          </div>
        )}
        {currentView === "home" && (
          <Home
            onJoinGame={handleJoinGame}
            onOpenMyQuizzes={() => setCurrentView("my-quizzes")}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            currentUser={currentUser}
          />
        )}

        {/* Trang Quản lý câu hỏi của tôi */}
        {currentView === "my-quizzes" && (
          <MyQuizzes
            user={currentUser}
            onHostQuiz={handleHostGame}
            onEditQuiz={handleOpenEditQuiz}
            onCreateQuiz={handleOpenCreateQuiz}
          />
        )}

        {/* Cổng Quản Trị Hệ Thống Admin */}
        {currentView === "admin" && currentUser?.role === "admin" && (
          <AdminDashboard
            currentUser={currentUser}
            onBack={() => setCurrentView(currentUser ? "my-quizzes" : "home")}
          />
        )}

        {currentView === "host" && (
          <HostScreen
            roomData={roomData}
            socket={socket}
            onLeave={handleLeaveToHome}
          />
        )}

        {currentView === "player" && (
          <PlayerScreen
            playerData={playerData}
            socket={socket}
            onLeave={handleLeaveToHome}
          />
        )}

        {currentView === "editor" && (
          <QuizEditor
            currentUser={currentUser}
            editQuizData={editingQuiz}
            onBack={() => setCurrentView(currentUser ? "my-quizzes" : "home")}
            onSaved={() => setCurrentView(currentUser ? "my-quizzes" : "home")}
          />
        )}
      </main>

      {/* Modal Đăng nhập / Đăng ký */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
