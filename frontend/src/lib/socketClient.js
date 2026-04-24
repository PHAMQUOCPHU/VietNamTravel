import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/env";

let socket = null;
let currentBase = "";

/**
 * Một kết nối Socket.io dùng chung (chat + thông báo).
 */
export function getSocket(baseUrl) {
  const url = (baseUrl || BACKEND_URL).replace(/\/+$/, "");
  if (socket && currentBase !== url) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    currentBase = url;
    socket = io(url, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentBase = "";
  }
}
