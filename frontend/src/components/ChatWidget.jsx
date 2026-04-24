import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import axios from "axios";
import { getSocket } from "../lib/socketClient";
import { BACKEND_URL } from "../config/env";

const ChatWidget = ({ layout = "fixed" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [userId, setUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef();
  const backendUrl = BACKEND_URL;

  // 1. Logic kiểm tra Login/Logout liên tục
  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const id = parsed._id || parsed.id || parsed.name; // Ưu tiên ID thực tế
          if (id && id !== userId) {
            setUserId(id);
          }
        } catch {
          setUserId(null);
        }
      } else {
        // NẾU KHÔNG THẤY TRONG STORAGE THÌ RESET NGAY
        if (userId !== null) {
          setUserId(null);
          setIsOpen(false);
          setChat([]);
        }
      }
    };

    checkUser();
    const interval = setInterval(checkUser, 1000); // Quét mỗi giây để dọn dẹp sau khi Logout
    return () => clearInterval(interval);
  }, [userId]);

  // 2. Lấy lại tin nhắn cũ khi mở khung chat
  useEffect(() => {
    if (isOpen && userId) {
      axios
        .get(`${backendUrl}/api/messages/${userId}`)
        .then(async (res) => {
          if (res.data.success) setChat(res.data.messages);
          await axios.post(`${backendUrl}/api/messages/user/mark-read/${userId}`);
          setUnreadCount(0);
        })
        .catch((err) => console.error("Lỗi fetch tin nhắn:", err));

      getSocket(backendUrl).emit("join_room", userId);
    }
  }, [isOpen, userId, backendUrl]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/messages/user/unread-count/${userId}`,
        );
        if (mounted && data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        if (mounted) setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [userId, backendUrl]);

  // 3. Lắng nghe tin nhắn mới từ Socket
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket(backendUrl);

    const handleReceiveMessage = (data) => {
      // Chỉ nhận tin nhắn nếu liên quan đến User hiện tại
      if (data.senderId === userId || data.receiverId === userId) {
        setChat((prev) => [...prev, data]);
        if (data.senderId === "ADMIN" && data.receiverId === userId) {
          if (isOpen) {
            axios
              .post(`${backendUrl}/api/messages/user/mark-read/${userId}`)
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

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // 4. Hàm gửi tin nhắn
  const sendMsg = () => {
    if (message.trim() && userId) {
      const data = {
        senderId: userId,
        receiverId: "ADMIN",
        message: message.trim(),
        createdAt: new Date(),
      };

      getSocket(backendUrl).emit("send_message", data);
      // setChat((prev) => [...prev, data]); // Hiển thị ngay phía User
      setMessage("");
    }
  };

  // Nếu chưa đăng nhập (không có userId) thì ẩn hoàn toàn
  if (!userId) return null;

  const containerClass =
    layout === "dock"
      ? "relative z-[99999]"
      : "fixed bottom-10 right-10 z-[99999]";

  return (
    <div className={containerClass}>
      {/* Nút bấm tròn */}
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

      {/* Khung chat */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 h-[450px] bg-white shadow-2xl rounded-2xl flex flex-col border border-gray-300 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-blue-600 p-4 text-white font-bold text-sm shadow-md flex justify-between items-center">
            <span>Hỗ trợ VN Travel</span>
            <div
              className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
              title="Online"
            ></div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50 flex flex-col">
            <div className="text-[10px] text-center text-gray-400 mb-2 uppercase tracking-widest">
              Đang chat: {userId}
            </div>

            {chat.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-2.5 rounded-2xl text-xs shadow-sm ${
                    msg.senderId === userId
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="p-3 border-t bg-white flex gap-2 items-center">
            <input
              className="flex-1 text-xs border border-gray-200 p-2.5 rounded-xl outline-none focus:border-blue-500 transition-all"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            />
            <button
              onClick={sendMsg}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
