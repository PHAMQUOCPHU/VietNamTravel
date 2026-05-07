import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import {
  Phone,
  Info,
  Send,
  Search,
  Image as ImageIcon,
  Loader2,
  X,
  Star,
  Pencil,
  Headphones,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { getSocket } from "../lib/socketClient";
import { adminHeaders } from "../lib/adminHeaders";

const REFRESH_USERS_MS = 450;

const STARRED_KEY = "vn_admin_starred_threads_v1";
const NOTE_KEY = (userId) => `vn_admin_thread_note_v1:${userId}`;

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function gradientFromId(id) {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const gradients = [
    "from-teal-500 to-emerald-400",
    "from-blue-500 to-indigo-400",
    "from-pink-500 to-rose-400",
    "from-orange-500 to-amber-400",
    "from-purple-500 to-violet-400",
    "from-cyan-500 to-sky-400",
  ];
  return gradients[h % gradients.length];
}

const Messages = () => {
  const { backendUrl, aToken, refreshAdminChatUnread } = useContext(AdminContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | unread | starred
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

  const [starredIds, setStarredIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STARRED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STARRED_KEY, JSON.stringify([...starredIds]));
    } catch {
      // ignore
    }
  }, [starredIds]);

  const toggleStar = useCallback((userId) => {
    const id = String(userId);
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const q = searchTerm.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    let arr = users;
    if (q) {
      arr = arr.filter((user) => {
        const name = String(user.name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    if (activeTab === "unread") {
      arr = arr.filter((u) => (u.unreadCount || 0) > 0);
    } else if (activeTab === "starred") {
      arr = arr.filter((u) => starredIds.has(String(u._id)));
    }
    return arr;
  }, [users, q, activeTab, starredIds]);

  const totalUnread = users.reduce(
    (sum, user) => sum + (user.unreadCount || 0),
    0,
  );

  const selectedGradient = selectedUser ? gradientFromId(selectedUser._id) : "";
  const selectedInitials = selectedUser
    ? initialsFromName(selectedUser.name)
    : "";

  const [note, setNote] = useState("");

  useEffect(() => {
    if (!selectedUser?._id) {
      setNote("");
      return;
    }
    try {
      setNote(localStorage.getItem(NOTE_KEY(selectedUser._id)) || "");
    } catch {
      setNote("");
    }
  }, [selectedUser?._id]);

  const saveNote = useCallback(() => {
    if (!selectedUser?._id) return;
    try {
      localStorage.setItem(NOTE_KEY(selectedUser._id), note);
      toast.success("Đã lưu ghi chú");
    } catch {
      toast.error("Không lưu được ghi chú");
    }
  }, [note, selectedUser?._id]);

  return (
    <div className="min-h-[calc(100vh-32px)] w-full bg-[#faf8f5] text-sm">
      <div className="flex min-h-[calc(100vh-32px)] w-full flex-col overflow-hidden lg:flex-row">
        {/* Sidebar */}
        <aside
          className={`h-full w-full border-b border-[#e8e2d9] bg-white flex flex-col lg:w-[340px] lg:border-b-0 lg:border-r ${
            selectedUser ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-[#f3efe9] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-800">Tin nhắn</h1>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3efe9] transition hover:bg-[#e8e2d9]"
                title="Soạn tin"
              >
                <Pencil className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm tin nhắn..."
                className="w-full rounded-xl border border-[#e8e2d9] bg-[#faf8f5] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0ea58e]"
              />
            </div>
          </div>

          <div className="flex border-b border-[#f3efe9] px-5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "all"
                  ? "border-b-2 border-[#0ea58e] text-[#0ea58e]"
                  : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "unread"
                  ? "border-b-2 border-[#0ea58e] text-[#0ea58e]"
                  : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Chưa đọc
              {totalUnread > 0 ? (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {totalUnread}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("starred")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "starred"
                  ? "border-b-2 border-[#0ea58e] text-[#0ea58e]"
                  : "border-b-2 border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Đánh dấu
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length ? (
              filteredUsers.map((u) => {
                const isActive = selectedUser?._id === u._id;
                const unread = Number(u.unreadCount) || 0;
                const initials = initialsFromName(u.name);
                const gradient = gradientFromId(u._id);
                const starred = starredIds.has(String(u._id));
                const lastTime = u.lastMessageAt
                  ? new Date(u.lastMessageAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <button
                    type="button"
                    key={String(u._id)}
                    onClick={() => setSelectedUser(u)}
                    className={`contact-item flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${
                      isActive
                        ? "bg-[rgba(14,165,142,0.12)] border-r-[3px] border-r-[#0ea58e]"
                        : "hover:bg-[rgba(14,165,142,0.08)]"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-semibold text-white`}
                      >
                        {initials}
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-gray-800">
                          {u.name}
                        </span>
                        <span className="whitespace-nowrap text-xs text-gray-400">
                          {lastTime}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-gray-400">
                          {u.lastMessage || u.email || "—"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(u._id);
                            }}
                            className={`rounded-full p-1 transition ${
                              starred
                                ? "text-yellow-500 hover:bg-yellow-50"
                                : "text-gray-300 hover:bg-sand-100"
                            }`}
                            title={starred ? "Bỏ đánh dấu" : "Đánh dấu"}
                          >
                            <Star className="h-4 w-4" fill={starred ? "currentColor" : "none"} />
                          </button>
                          {unread ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0ea58e] text-xs font-medium text-white">
                              {unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center text-xs text-gray-400">
                Không có hội thoại phù hợp.
              </div>
            )}
          </div>
        </aside>

        {/* Chat area — bubble style giống widget khách (indigo / trắng) */}
        <main className="flex min-h-[50vh] min-w-0 flex-1 flex-col bg-slate-50 lg:min-h-0">
          <div className="flex h-[64px] shrink-0 items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-4 sm:h-[72px] sm:px-5">
            {selectedUser ? (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/90 transition hover:bg-white/15 lg:hidden"
                    title="Quay lại danh sách"
                    aria-label="Quay lại danh sách"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white`}
                    >
                      {selectedInitials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-indigo-600 bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-white">
                      {selectedUser.name}
                    </h2>
                    <p className="text-xs text-indigo-200">Khách hàng · Đang hoạt động</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
                    title="Gọi"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
                    title="Thông tin"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold">Chọn hội thoại</span>
              </div>
            )}
          </div>

          <div className="chat-admin-scroll flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {selectedUser ? (
              loadingThread ? (
                <div className="flex justify-center py-16 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, i) => {
                    const fromAdmin = m.senderId === "ADMIN";
                    const time = new Date(m.createdAt ?? 0).toLocaleTimeString(
                      "vi-VN",
                      { hour: "2-digit", minute: "2-digit", hour12: false },
                    );
                    return (
                      <div
                        key={m._id || `${m.createdAt}-${m.senderId}-${i}`}
                        className={`flex items-end gap-2 fade-in ${
                          fromAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!fromAdmin ? (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                            {selectedInitials.slice(0, 2)}
                          </div>
                        ) : null}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            fromAdmin
                              ? "rounded-br-md bg-indigo-600 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {m.imageUrl ? (
                            <a
                              href={m.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block overflow-hidden rounded-xl ${
                                fromAdmin ? "rounded-br-md" : "rounded-bl-md"
                              }`}
                            >
                              <img
                                src={m.imageUrl}
                                alt="Đính kèm"
                                className="max-h-60 w-full max-w-sm bg-black/5 object-contain"
                              />
                            </a>
                          ) : null}
                          {m.message ? (
                            <p className={m.imageUrl ? "mt-2 leading-relaxed" : "leading-relaxed"}>
                              {m.message}
                            </p>
                          ) : null}
                          <span
                            className={`mt-1 block text-[10px] ${
                              fromAdmin ? "text-right text-indigo-200" : "text-slate-400"
                            }`}
                          >
                            {time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Chọn hội thoại ở bên trái để xem tin nhắn.
              </div>
            )}
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
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 p-2">
                <img
                  src={pendingImageUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1 text-xs text-indigo-950">
                  Ảnh sẵn sàng gửi — có thể thêm chữ rồi Gửi.
                </span>
                <button
                  type="button"
                  onClick={() => setPendingImageUrl("")}
                  className="shrink-0 rounded-lg p-1 text-indigo-700 hover:bg-indigo-100"
                  title="Bỏ ảnh"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <button
                type="button"
                onClick={handlePickImage}
                disabled={uploadingImage || !selectedUser}
                className="shrink-0 p-1 text-slate-400 transition hover:text-indigo-600 disabled:opacity-50"
                title="Gửi ảnh"
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={!selectedUser}
                className="min-w-0 flex-1 rounded-full border-0 bg-slate-100 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  !selectedUser ||
                  uploadingImage ||
                  (!input.trim() && !pendingImageUrl.trim())
                }
                className="flex shrink-0 items-center justify-center rounded-full bg-indigo-600 p-2.5 text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50"
                title="Gửi"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </main>

        {/* Info panel */}
        <aside className="hidden h-full w-[280px] border-l border-[#e8e2d9] bg-white px-5 py-8 overflow-y-auto xl:block">
          {selectedUser ? (
            <>
              <div
                className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${selectedGradient} text-2xl font-bold text-white`}
              >
                {selectedInitials}
              </div>
              <h3 className="mb-1 text-center font-semibold text-gray-800">
                {selectedUser.name}
              </h3>
              <p className="mb-6 text-center text-xs text-gray-400">Khách hàng</p>

              <div className="mt-6 w-full">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Ghi chú nhanh
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Khách yêu cầu phòng view biển..."
                  className="w-full min-h-28 resize-none rounded-xl border border-[#e8e2d9] bg-[#faf8f5] p-3 text-sm text-gray-700 outline-none focus:border-[#0ea58e]"
                />
                <button
                  type="button"
                  onClick={saveNote}
                  className="mt-3 w-full rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                >
                  Lưu ghi chú
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-gray-400">
              Chọn một hội thoại để xem thông tin.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Messages;
