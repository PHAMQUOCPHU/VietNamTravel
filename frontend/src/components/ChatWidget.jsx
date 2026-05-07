import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Image as ImageIcon,
  Loader2,
  Headphones,
  MoreVertical,
  Bot,
} from "lucide-react";
import { getSocket } from "../lib/socketClient";
import { BACKEND_URL } from "../config/env";
import {
  getUnreadCountForUser,
  getUserMessages,
  markMessagesReadForUser,
  uploadChatImageForUser,
} from "../services";

function formatMsgTime(createdAt) {
  if (!createdAt) return "";
  try {
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

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

    (async () => {
      try {
        if (!token) return;
        const res = await getUserMessages({ backendUrl, userId, token });
        if (res.success) setChat(res.messages);
        await markMessagesReadForUser({ backendUrl, userId, token });
        setUnreadCount(0);
      } catch (err) {
        console.error("Lỗi fetch tin nhắn:", err);
      }
    })();

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
        const data = await getUnreadCountForUser({ backendUrl, userId, token });
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
            if (token) {
              markMessagesReadForUser({ backendUrl, userId, token })
                .then(() => setUnreadCount(0))
                .catch(() => {});
            }
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
      const data = await uploadChatImageForUser({ backendUrl, token, file });
      if (data.success && data.imageUrl) {
        setPendingImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const sendMsg = useCallback(() => {
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
  }, [message, pendingImageUrl, userId, backendUrl]);

  if (!userId) return null;

  const containerClass =
    layout === "dock"
      ? "relative z-[99999]"
      : "fixed bottom-10 right-4 z-[99999] sm:right-10";

  return (
    <div className={containerClass}>
      <button
        type="button"
        id="chat-button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/25 ring-2 ring-white transition hover:scale-[1.05] hover:shadow-2xl motion-reduce:transition-none"
      >
        {isOpen ? (
          <X className="h-7 w-7" strokeWidth={2} />
        ) : (
          <MessageCircle className="h-7 w-7" strokeWidth={2} />
        )}
      </button>
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-bold text-white shadow-lg">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Hỗ trợ khách hàng"
          className="chat-widget-shell absolute bottom-[4.75rem] right-0 flex max-h-[min(700px,82vh)] w-[min(100vw-1.5rem,28rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl motion-reduce:animate-none animate-in fade-in zoom-in duration-200"
        >
          <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
            <div className="relative shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Headphones className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-indigo-600 bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-white">
                Hỗ trợ khách hàng
              </h1>
              <p className="text-xs text-indigo-200">Đang hoạt động</p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              title="Tuỳ chọn"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </header>

          <div className="chat-widget-scroll flex flex-1 flex-col space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {chat.map((msg) => {
              const isMine = msg.senderId === userId;
              const time = formatMsgTime(msg.createdAt);

              if (isMine) {
                return (
                  <div
                    key={msg._id || `${msg.createdAt}-${msg.senderId}`}
                    className="motion-reduce:animate-none flex items-end justify-end gap-2 animate-chat-msg-in"
                  >
                    <div className="max-w-[75%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 shadow-sm">
                      {msg.imageUrl ? (
                        <a
                          href={msg.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-xl rounded-br-md"
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Ảnh đính kèm"
                            className="max-h-56 w-full bg-black/10 object-contain"
                          />
                        </a>
                      ) : null}
                      {msg.message ? (
                        <p
                          className={`text-sm text-white ${msg.imageUrl ? "mt-2" : ""}`}
                        >
                          {msg.message}
                        </p>
                      ) : null}
                      <span className="mt-1 block text-right text-[10px] text-indigo-200">
                        {time}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg._id || `${msg.createdAt}-${msg.senderId}`}
                  className="motion-reduce:animate-none flex items-end gap-2 animate-chat-msg-in"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <Bot className="h-4 w-4 text-indigo-600" strokeWidth={2} />
                  </div>
                  <div className="max-w-[75%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                    {msg.imageUrl ? (
                      <a
                        href={msg.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl rounded-bl-md"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Ảnh từ hỗ trợ"
                          className="max-h-56 w-full bg-slate-100 object-contain"
                        />
                      </a>
                    ) : null}
                    {msg.message ? (
                      <p
                        className={`text-sm text-slate-700 ${msg.imageUrl ? "mt-2" : ""}`}
                      >
                        {msg.message}
                      </p>
                    ) : null}
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {time}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFile}
          />

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            {pendingImageUrl ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 p-2 pr-2">
                <img
                  src={pendingImageUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-xs text-indigo-950">
                  Ảnh sẵn sàng gửi
                </span>
                <button
                  type="button"
                  onClick={() => setPendingImageUrl("")}
                  className="shrink-0 rounded-lg p-1 text-indigo-700 hover:bg-indigo-100"
                  title="Bỏ ảnh"
                >
                  <X size={18} />
                </button>
              </div>
            ) : null}
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMsg();
              }}
            >
              <button
                type="button"
                onClick={handlePickImage}
                disabled={uploadingImage}
                className="shrink-0 p-1 text-slate-400 transition hover:text-indigo-600 disabled:opacity-50"
                title="Gửi ảnh"
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
              <input
                type="text"
                autoComplete="off"
                placeholder="Nhập tin nhắn..."
                className="min-w-0 flex-1 rounded-full border-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-800 outline-none ring-0 transition focus:ring-2 focus:ring-indigo-300"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={
                  (!message.trim() && !pendingImageUrl.trim()) || uploadingImage
                }
                className="flex shrink-0 items-center justify-center rounded-full bg-indigo-600 p-2.5 text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 motion-reduce:transition-none"
                title="Gửi"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
