import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ImagePlus, Loader2 } from "lucide-react";
import axios from "axios";
import { getSocket } from "../lib/socketClient";
import { BACKEND_URL } from "../config/env";

const ChatWidget = ({ layout = "fixed" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [userId, setUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const backendUrl = BACKEND_URL;

  useEffect(() => {
    let intervalId;

    const checkUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const id = parsed._id || parsed.id || parsed.name;
          if (id && id !== userId) {
            setUserId(id);
          }
        } catch {
          setUserId(null);
        }
      } else if (userId !== null) {
        setUserId(null);
        setIsOpen(false);
        setChat([]);
      }
    };

    const schedule = () => {
      clearInterval(intervalId);
      if (document.visibilityState === "hidden") return;
      intervalId = setInterval(checkUser, 6000);
    };

    checkUser();
    schedule();

    const onVisibility = () => {
      checkUser();
      if (document.visibilityState === "visible") schedule();
      else clearInterval(intervalId);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(intervalId);
    };
  }, [userId]);

  useEffect(() => {
    if (!isOpen || !userId) return undefined;
    const token = localStorage.getItem("token");
    const authHeaders = token ? { token } : {};

    axios
      .get(`${backendUrl}/api/messages/${userId}`, { headers: authHeaders })
      .then(async (res) => {
        if (res.data.success) setChat(res.data.messages);
        await axios.post(
          `${backendUrl}/api/messages/user/mark-read/${userId}`,
          {},
          { headers: authHeaders },
        );
        setUnreadCount(0);
      })
      .catch((err) => console.error("Lỗi fetch tin nhắn:", err));

    getSocket(backendUrl).emit("join_room", userId);
    return undefined;
  }, [isOpen, userId, backendUrl]);

  useEffect(() => {
    if (!userId) return undefined;
    let mounted = true;
    let intervalId;

    const fetchUnreadCount = async () => {
      if (document.visibilityState === "hidden") return;
      const token = localStorage.getItem("token");
      if (!token) {
        if (mounted) setUnreadCount(0);
        return;
      }
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/messages/user/unread-count/${userId}`,
          { headers: { token } },
        );
        if (mounted && data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        if (mounted) setUnreadCount(0);
      }
    };

    const schedule = () => {
      clearInterval(intervalId);
      if (document.visibilityState === "hidden") return;
      intervalId = setInterval(fetchUnreadCount, 8000);
    };

    fetchUnreadCount();
    schedule();

    const onVisibility = () => {
      fetchUnreadCount();
      if (document.visibilityState === "visible") schedule();
      else clearInterval(intervalId);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(intervalId);
    };
  }, [userId, backendUrl]);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(backendUrl);

    const handleReceiveMessage = (data) => {
      if (data.senderId === userId || data.receiverId === userId) {
        setChat((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
        if (data.senderId === "ADMIN" && data.receiverId === userId) {
          if (isOpen) {
            const token = localStorage.getItem("token");
            axios
              .post(
                `${backendUrl}/api/messages/user/mark-read/${userId}`,
                {},
                { headers: token ? { token } : {} },
              )
              .then(() => setUnreadCount(0))
              .catch(() => {});
          } else {
            setUnreadCount((prev) => prev + 1);
          }
        }
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [userId, isOpen, backendUrl]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [chat]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await axios.post(
        `${backendUrl}/api/messages/chat-image/user`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            token,
          },
        },
      );
      if (data.success && data.imageUrl) {
        setPendingImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const sendMsg = () => {
    const text = message.trim();
    const img = pendingImageUrl.trim();
    if ((!text && !img) || !userId) return;
    const data = {
      senderId: userId,
      receiverId: "ADMIN",
      message: text,
      imageUrl: img,
      createdAt: new Date(),
    };

    getSocket(backendUrl).emit("send_message", data);
    setMessage("");
    setPendingImageUrl("");
  };

  if (!userId) return null;

  const containerClass =
    layout === "dock"
      ? "relative z-[99999]"
      : "fixed bottom-10 right-10 z-[99999]";

  return (
    <div className={containerClass}>
      <button
        id="chat-button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 p-4 rounded-full text-white shadow-2xl hover:scale-110 transition-all border-2 border-white flex items-center justify-center"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-lg border-2 border-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[85vw] sm:w-80 max-h-[70vh] sm:max-h-[450px] bg-white shadow-2xl rounded-2xl flex flex-col border border-gray-300 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-blue-600 p-3 sm:p-4 text-white font-bold text-xs sm:text-sm shadow-md flex justify-between items-center">
            <span>Hỗ trợ VN Travel</span>
            <div
              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              title="Online"
            ></div>
          </div>

          <div className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-2 sm:space-y-3 bg-gray-50 flex flex-col">
            <div className="text-[9px] sm:text-[10px] text-center text-gray-400 mb-2 uppercase tracking-widest line-clamp-1">
              Đang chat: {userId}
            </div>

            {chat.map((msg) => (
              <div
                key={msg._id || `${msg.createdAt}-${msg.senderId}`}
                className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-2 sm:p-2.5 rounded-2xl text-xs shadow-sm ${
                    msg.senderId === userId
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                  }`}
                >
                  {msg.imageUrl ? (
                    <a
                      href={msg.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        msg.senderId === userId ? "text-blue-100" : ""
                      }
                    >
                      <img
                        src={msg.imageUrl}
                        alt=""
                        className="max-h-40 w-full rounded-lg object-contain bg-black/10"
                      />
                    </a>
                  ) : null}
                  {msg.message ? (
                    <div className={msg.imageUrl ? "mt-1.5" : ""}>
                      {msg.message}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFile}
          />

          <div className="p-2 sm:p-3 border-t bg-white flex flex-col gap-2">
            {pendingImageUrl ? (
              <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-1.5 pr-2">
                <img
                  src={pendingImageUrl}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
                <span className="flex-1 text-[10px] text-blue-900 truncate">
                  Ảnh sẵn sàng gửi
                </span>
                <button
                  type="button"
                  onClick={() => setPendingImageUrl("")}
                  className="shrink-0 rounded p-1 text-blue-800 hover:bg-blue-100"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 text-xs border border-gray-200 p-2 sm:p-2.5 rounded-xl outline-none focus:border-blue-500 transition-all"
                placeholder="Nhập tin nhắn…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              />
              <button
                type="button"
                onClick={handlePickImage}
                disabled={uploadingImage}
                title="Đính ảnh"
                className="border border-gray-200 bg-gray-50 p-2 sm:p-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ImagePlus size={14} className="sm:w-4 sm:h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={sendMsg}
                disabled={
                  (!message.trim() && !pendingImageUrl.trim()) ||
                  uploadingImage
                }
                className="bg-blue-600 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md active:scale-95 flex-shrink-0"
              >
                <Send size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
