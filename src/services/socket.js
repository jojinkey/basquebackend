import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 3,
  reconnectionDelay: 5000,
  timeout: 3000,
});

socket.on("connect_error", () => {});
socket.on("disconnect", () => {});