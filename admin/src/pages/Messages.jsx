import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import axios from "axios";
import {
  User as UserIcon,
  Send,
  Search,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { getSocket } from "../lib/socketClient";
import { adminHeaders } from "../lib/adminHeaders";

const REFRESH_USERS_MS = 450;

const Messages = () => {
  const { backendUrl, aToken, refreshAdminChatUnread } = useContext(AdminContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const apiBase = backendUrl?.replace(/\/+$/, "") || "";

  const fetchUsers = useCallback(async () => {
    if (!apiBase || !aToken) return;
    try {
      const res = await axios.get(`${apiBase}/api/messages/admin/users`, {
        headers: adminHeaders(aToken),
      });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Phiên admin hết hạn — đăng nhập lại.");
      } else {
        console.error("Lỗi lấy danh sách khách:", err);
      }
    }
  }, [apiBase, aToken]);

  const scheduleRefreshUsers = useCallback(() => {
    if (!aToken) return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      fetchUsers();
    }, REFRESH_USERS_MS);
  }, [aToken, fetchUsers]);

  useEffect(() => {
    if (!apiBase || !aToken) return undefined;
    const socket = getSocket(apiBase);
    fetchUsers();

    const onSocketMessage = () => scheduleRefreshUsers();
    socket.on("receive_message", onSocketMessage);

    return () => {
      socket.off("receive_message", onSocketMessage);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [apiBase, aToken, fetchUsers, scheduleRefreshUsers]);

  useEffect(() => {
    if (!selectedUser || !apiBase || !aToken) {
      setMessages([]);
      setLoadingThread(false);
      return undefined;
    }

    const socket = getSocket(apiBase);
    const uid = selectedUser._id;
    const ac = new AbortController();

    setMessages([]);
    setLoadingThread(true);

    socket.emit("join_room", uid);

    (async () => {
      try {
        const res = await axios.get(`${apiBase}/api/messages/${uid}`, {
          headers: adminHeaders(aToken),
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        if (res.data.success) setMessages(res.data.messages);
        await axios.post(
          `${apiBase}/api/messages/admin/mark-read/${uid}`,
          {},
          { headers: adminHeaders(aToken) },
        );
        if (ac.signal.aborted) return;
        setUsers((prev) =>
          prev.map((u) =>
            u._id === uid ? { ...u, unreadCount: 0 } : u,
          ),
        );
        refreshAdminChatUnread();
      } catch (err) {
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
        console.error("Lỗi load lịch sử:", err);
        toast.error("Không tải được lịch sử chat");
      } finally {
        if (!ac.signal.aborted) setLoadingThread(false);
      }
    })();

    return () => {
      ac.abort();
      socket.emit("leave_room", uid);
    };
  }, [selectedUser, apiBase, aToken, refreshAdminChatUnread]);

  useEffect(() => {
    if (!apiBase) return undefined;
    const socket = getSocket(apiBase);
    const handleNewMessage = (data) => {
      if (
        data.senderId === selectedUser?._id ||
        data.receiverId === selectedUser?._id
      ) {
        setMessages((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    };
    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [selectedUser, apiBase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedUser) return;
    if (!aToken) {
      toast.error("Phiên admin hết hạn, đăng nhập lại.");
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axios.post(
        `${apiBase}/api/messages/chat-image/admin`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            atoken: aToken,
          },
        },
      );
      if (data.success && data.imageUrl) {
        setPendingImageUrl(data.imageUrl);
        toast.success("Đã tải ảnh lên — bấm Gửi để gửi tin nhắn");
      } else {
        toast.error(data.message || "Upload thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không upload được ảnh");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    const img = pendingImageUrl.trim();
    if ((!text && !img) || !selectedUser || !apiBase) return;
    const msgData = {
      senderId: "ADMIN",
      receiverId: selectedUser._id,
      message: text,
      imageUrl: img,
      createdAt: new Date(),
    };
    getSocket(apiBase).emit("send_message", msgData);
    setInput("");
    setPendingImageUrl("");
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const name = String(user.name || "").toLowerCase();
    const email = String(user.email || "").toLowerCase();
    return !q || name.includes(q) || email.includes(q);
  });

  const totalUnread = users.reduce(
    (sum, user) => sum + (user.unreadCount || 0),
    0,
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex gap-4 font-sans text-sm">
      <div className="w-1/4 bg-white rounded-2xl shadow-sm border flex flex-col h-[85vh] overflow-hidden">
        <div className="p-4 border-b bg-gray-50/10">
          <div className="font-bold text-gray-700 mb-3 flex justify-between">
            <span>Khách hàng</span>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 px-2 rounded-full text-[10px] flex items-center">
                {filteredUsers.length}
              </span>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white px-2 rounded-full text-[10px] flex items-center">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Tìm tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border-none pl-9 pr-3 py-2 rounded-lg outline-none text-[12px] focus:ring-1 focus:ring-blue-400 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 cursor-pointer hover:bg-blue-50 border-b flex items-center gap-3 transition-all ${
                  selectedUser?._id === user._id
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 flex-shrink-0">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${user.unreadCount > 0 ? "font-extrabold text-gray-900" : "font-semibold text-gray-600"}`}
                  >
                    {user.name}
                  </p>
                  <p
                    className={`text-[11px] truncate ${user.unreadCount > 0 ? "font-semibold text-gray-700" : "text-gray-400"}`}
                  >
                    {user.lastMessage || user.email || "Chưa có nội dung"}
                  </p>
                </div>
                {user.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {user.unreadCount}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-xs">
              Không tìm thấy khách này.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border flex flex-col h-[85vh] overflow-hidden">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-white flex items-center gap-2 text-blue-600 font-bold shadow-sm z-10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              Đang hỗ trợ: {selectedUser.name}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {loadingThread ? (
                <div className="flex justify-center py-16 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m._id || `${m.createdAt}-${m.senderId}`}
                    className={`flex ${m.senderId === "ADMIN" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                        m.senderId === "ADMIN"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                      }`}
                    >
                      {m.imageUrl ? (
                        <a
                          href={m.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block ${m.senderId === "ADMIN" ? "text-blue-100" : ""}`}
                        >
                          <img
                            src={m.imageUrl}
                            alt="Đính kèm"
                            className="max-h-52 w-full max-w-sm rounded-lg object-contain bg-black/5"
                          />
                        </a>
                      ) : null}
                      {m.message ? (
                        <p
                          className={`text-[13.5px] leading-relaxed ${m.imageUrl ? "mt-2" : ""}`}
                        >
                          {m.message}
                        </p>
                      ) : null}
                      <span className="text-[9px] block mt-1 opacity-60 text-right uppercase">
                        {new Date(m.createdAt ?? 0).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />

            <div className="p-4 bg-white border-t flex flex-col gap-2">
              {pendingImageUrl ? (
                <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-2">
                  <img
                    src={pendingImageUrl}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover border border-blue-100"
                  />
                  <div className="flex-1 min-w-0 text-xs text-blue-900">
                    Ảnh đã sẵn sàng gửi kèm tin nhắn (có thể thêm chữ ở ô dưới).
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingImageUrl("")}
                    className="shrink-0 rounded-lg p-1 text-blue-700 hover:bg-blue-100"
                    title="Bỏ ảnh"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : null}
              <div className="flex gap-2 items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Nhập nội dung phản hồi…"
                  className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={handlePickImage}
                  disabled={uploadingImage || !aToken}
                  title="Gửi ảnh (Cloudinary)"
                  className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    (!input.trim() && !pendingImageUrl.trim()) || uploadingImage
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Send size={16} />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-300">
              <UserIcon size={32} />
            </div>
            <p className="text-sm">Chọn một khách hàng để bắt đầu tư vấn</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
