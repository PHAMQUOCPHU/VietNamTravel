import { io } from "socket.io-client";

let socket = null;
let currentBase = "";

export function getSocket(baseUrl) {
  const url = (baseUrl || "http://localhost:5001").replace(/\/+$/, "");
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
