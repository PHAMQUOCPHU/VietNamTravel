import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { User as UserIcon, Send, Search } from "lucide-react"; // Thêm icon Search
import { useContext } from "react";
import { AdminContext } from "../context/AdminContext";

const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5001", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

const Messages = () => {
  const { backendUrl } = useContext(AdminContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State cho ô tìm kiếm
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef();

  // 1. Lấy danh sách khách hàng
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/messages/admin/users`);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách khách:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/messages/admin/users`,
        );
        if (cancelled) return;
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách khách:", err);
      }
    })();
    socket.on("receive_message", fetchUsers);
    return () => {
      cancelled = true;
      socket.off("receive_message", fetchUsers);
    };
  }, [backendUrl]);

  // 2. Load lịch sử chat
  useEffect(() => {
    if (selectedUser) {
      const fetchChatHistory = async () => {
        try {
          const res = await axios.get(
            `${backendUrl}/api/messages/${selectedUser._id}`,
          );
          if (res.data.success) setMessages(res.data.messages);
          await axios.post(
            `${backendUrl}/api/messages/admin/mark-read/${selectedUser._id}`,
          );
          await fetchUsers();
        } catch (err) {
          console.error("Lỗi load lịch sử:", err);
        }
      };
      fetchChatHistory();
      socket.emit("join_room", selectedUser._id);
    }
  }, [selectedUser, backendUrl]);

  // 3. Nhận tin nhắn mới (FIX LỖI LẶP TIN)
  useEffect(() => {
    const handleNewMessage = (data) => {
      if (
        data.senderId === selectedUser?._id ||
        data.receiverId === selectedUser?._id
      ) {
        setMessages((prev) => {
          // Kiểm tra xem tin nhắn có ID này đã tồn tại chưa để tránh lặp
          const isExisted = prev.find(
            (m) => m._id === data._id && data._id !== undefined,
          );
          if (isExisted) return prev;
          return [...prev, data];
        });
      }
    };
    socket.on("receive_message", handleNewMessage);
    return () => socket.off("receive_message", handleNewMessage);
  }, [selectedUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Gửi tin nhắn (Bỏ setMessages thủ công để tránh lặp)
  const handleSend = () => {
    if (input.trim() && selectedUser) {
      const msgData = {
        senderId: "ADMIN",
        receiverId: selectedUser._id,
        message: input.trim(),
        createdAt: new Date(),
      };
      socket.emit("send_message", msgData);
      // setMessages((prev) => [...prev, msgData]); // DÒNG NÀY GÂY LẶP - ĐÃ XÓA
      setInput("");
    }
  };

  // 5. Logic lọc khách hàng theo tên hoặc email
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalUnread = users.reduce(
    (sum, user) => sum + (user.unreadCount || 0),
    0,
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex gap-4 font-sans text-sm">
      {/* Sidebar: Danh sách khách hàng */}
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
          {/* Ô tìm kiếm khách hàng mới thêm */}
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

      {/* Main: Nội dung chat */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border flex flex-col h-[85vh] overflow-hidden">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-white flex items-center gap-2 text-blue-600 font-bold shadow-sm z-10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              Đang hỗ trợ: {selectedUser.name}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.senderId === "ADMIN" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                      m.senderId === "ADMIN"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    <p className="text-[13.5px] leading-relaxed">{m.message}</p>
                    <span className="text-[9px] block mt-1 opacity-60 text-right uppercase">
                      {new Date(m.createdAt ?? 0).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white border-t flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhập nội dung phản hồi..."
                className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-400 transition-all text-sm"
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Send size={16} />
                <span>Gửi</span>
              </button>
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
