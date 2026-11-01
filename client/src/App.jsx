import DialogHost from "./components/DialogHost";
import { notify } from "./services/dialogs";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from './services/useRoute';
import { readPlaySession, savePlaySession } from './services/playSession';
import { rememberNickname } from './services/nickname';
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import HostScreen from "./components/HostScreen";
import PlayerScreen from "./components/PlayerScreen";
import EditorPage from "./components/EditorPage";
import MyQuizzes from "./components/MyQuizzes";
import AdminDashboard from "./components/AdminDashboard";
import LoginModal from "./components/LoginModal";
import { apiFetch, getToken, setToken } from './services/api';
import { socket } from "./services/socket";

export default function App() {
  const [route, navigate] = useRoute();
  const [initialSession] = useState(readPlaySession);
  const sessionRef = useRef(initialSession);
  const retryResume = useRef(null);
  const [liveView, setLiveView] = useState(initialSession?.role || null);
  const [restoring, setRestoring] = useState(!!initialSession);
  const [restoreError, setRestoreError] = useState('');
  const [connectionVersion, setConnectionVersion] = useState(0);
  const currentView = liveView || route.view;
  const setCurrentView = useCallback((view) => {
    if (view === 'host' || view === 'player') setLiveView(view);
    else { setLiveView(null); navigate({ view }); }
  }, [navigate]);
  const [roomData, setRoomData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const pendingNickname = useRef(null);

  useEffect(() => {
    let active = true;
    const clearUser = () => { setCurrentUser(null); };
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
    let active = true;
    const rememberSession = (role, data) => {
      const session = { role, pin: data.pin, resumeToken: data.resumeToken };
      sessionRef.current = session;
      savePlaySession(session);
    };
    const abandonSession = (message) => {
      sessionRef.current = null;
      savePlaySession(null);
      setRestoring(false);
      setRoomData(null); setPlayerData(null); setLiveView(null);
      navigate({ view: 'home' }, true);
      if (message) notify(message);
    };
    const restore = () => {
      const session = sessionRef.current;
      if (!session || !socket.connected) return;
      setRestoring(true); setRestoreError('');
      socket.timeout(10000).emit('resume_session', session, (err, result) => {
        if (!active || sessionRef.current !== session) return;
        if (err) { setRestoreError('Chưa kết nối được máy chủ. Thử lại để nối lại phòng.'); return; }
        if (result.error) { abandonSession(result.error); return; }
        if (result.role === 'host') setRoomData(result.data);
        else setPlayerData(result.data);
        setLiveView(result.role);
        setConnectionVersion(version => version + 1);
        setRestoring(false);
      });
    };
    retryResume.current = () => { if (socket.connected) restore(); else socket.connect(); };
    const disconnected = () => {
      if (sessionRef.current) { setRestoring(true); setRestoreError('Mất kết nối. Đang thử nối lại phòng…'); }
    };
    const closed = ({ message }) => abandonSession(message || 'Phòng đã đóng.');
    const replaced = () => abandonSession('Phiên chơi đã được mở ở một tab khác.');
    socket.on('connect', restore);
    socket.on('disconnect', disconnected);
    socket.on('room_closed', closed);
    socket.on('session_replaced', replaced);
    if (socket.connected) restore();
    socket.on("room_created", (data) => {
      rememberSession('host', data);
      setRoomData(data);
      setCurrentView("host");
    });

    socket.on("join_success", (data) => {
      rememberSession('player', data);
      if (pendingNickname.current) {
        const { nickname, rememberName } = pendingNickname.current;
        rememberNickname(nickname, rememberName);
        pendingNickname.current = null;
      }
      setPlayerData(data);
      setCurrentView("player");
    });

    socket.on('host_error', ({ message }) => notify(message));
    socket.on("join_error", ({ message }) => {
      pendingNickname.current = null;
      notify(message || "Không thể tham gia phòng!");
    });

    return () => {
      active = false;
      socket.off('connect', restore);
      socket.off('disconnect', disconnected);
      socket.off('room_closed', closed);
      socket.off('session_replaced', replaced);
      socket.off("room_created");
      socket.off("join_success");
      socket.off("join_error");
      socket.off("host_error");
    };
  }, [setCurrentView, navigate]);

  const handleJoinGame = ({ pin, nickname, avatar, rememberName }) => {
    pendingNickname.current = { nickname, rememberName };
    socket.connect();
    socket.emit("join_room", { pin, nickname, avatar });
  };

  const handleHostGame = (quizId) => {
    socket.connect();
    socket.emit("create_room", { quizId });
  };

  const handleLeaveToHome = () => {
    // A delayed reconnect must not re-open a session after an intentional exit.
    const session = sessionRef.current;
    sessionRef.current = null;
    savePlaySession(null);
    setRestoring(false);
    if (session?.role === 'host') socket.emit("close_room", { pin: session.pin });
    if (session?.role === 'player') socket.emit("leave_room");
    setRoomData(null);
    setPlayerData(null);
    setCurrentView("home");
  };

  const handleLoginSuccess = (user) => {
    const { token, ...profile } = user;
    setToken(token);
    setCurrentUser(profile);
    socket.disconnect().connect();
    // Keep a protected deep link after signing in, unless this was the public home page.
    if (route.view === 'home') setCurrentView(profile.role === 'admin' ? 'admin' : 'my-quizzes');
  };

  const handleLogout = async () => {
    sessionRef.current = null;
    savePlaySession(null);
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
    navigate({ view: 'editor', quizId: quiz.id });
  };

  const handleOpenCreateQuiz = () => {
    setCurrentView("editor");
  };

  const protectedPage = ['admin', 'my-quizzes', 'editor'].includes(currentView);
  const canView = !protectedPage || (!authLoading && currentUser && (currentView !== 'admin' || currentUser.role === 'admin'));

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 flex flex-col font-sans select-none">
      {/* Navbar chỉ hiển thị ở màn hình thông thường (ẩn khi Host/Player toàn màn hình) */}
      {currentView !== "host" && currentView !== "player" && (
        <Navbar
          currentView={currentView}
          setView={setCurrentView}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <DialogHost />
      <main className="flex-1 flex flex-col">
        {restoring && <div className="p-8 text-center space-y-4" role="status">
          <h1 className="text-2xl font-bold">Đang nối lại phòng {sessionRef.current?.pin}</h1>
          <p>{restoreError || 'Đang khôi phục câu hỏi và điểm của bạn…'}</p>
          <p className="text-sm text-gray-500">Phòng chờ kết nối lại tối đa 60 giây. Khi chủ phòng mất kết nối, câu đang chơi sẽ tạm dừng.</p>
          <button onClick={() => retryResume.current?.()} className="btn-bk-gold px-5 py-2 rounded-lg">Thử kết nối lại</button>
          <button onClick={handleLeaveToHome} className="ml-3 px-5 py-2 rounded-lg bg-gray-200">Về trang chủ</button>
        </div>}
        {!canView && (
          <div className="p-8 text-center space-y-4">
            <p>{authLoading ? 'Đang kiểm tra đăng nhập…' : !currentUser ? 'Đăng nhập để tiếp tục ở trang này.' : 'Khu vực này chỉ dành cho quản trị viên.'}</p>
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
        {currentView === "my-quizzes" && canView && (
          <MyQuizzes
            activeTab={route.tab}
            setActiveTab={tab => navigate({ view: 'my-quizzes', tab })}
            user={currentUser}
            onHostQuiz={handleHostGame}
            onEditQuiz={handleOpenEditQuiz}
            onCreateQuiz={handleOpenCreateQuiz}
          />
        )}

        {/* Cổng Quản Trị Hệ Thống Admin */}
        {currentView === "admin" && canView && (
          <AdminDashboard
            activeTab={route.tab}
            setActiveTab={tab => navigate({ view: 'admin', tab })}
            currentUser={currentUser}
            onBack={() => setCurrentView(currentUser ? "my-quizzes" : "home")}
          />
        )}

        {currentView === "host" && !restoring && roomData && (
          <HostScreen
            key={connectionVersion}
            roomData={roomData}
            socket={socket}
            onLeave={handleLeaveToHome}
          />
        )}

        {currentView === "player" && !restoring && playerData && (
          <PlayerScreen
            key={connectionVersion}
            playerData={playerData}
            socket={socket}
            onLeave={handleLeaveToHome}
          />
        )}

        {currentView === "editor" && canView && (
          <EditorPage
            key={`${currentUser.id}:${route.quizId || 'new'}`}
            quizId={route.quizId}
            currentUser={currentUser}
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
