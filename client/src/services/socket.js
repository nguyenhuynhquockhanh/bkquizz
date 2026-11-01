import { getToken } from "./api";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  auth: (callback) => callback({ token: getToken() }),
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

