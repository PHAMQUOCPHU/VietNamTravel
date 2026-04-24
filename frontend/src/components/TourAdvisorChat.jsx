import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { Sparkles, Send, Loader2, X, Bot } from "lucide-react";

/** Tránh VITE_BACKEND_URL dạng .../api khiến thành .../api/api/tour-advisor → 404 */
const getBackendBase = () => {
  const raw =
    import.meta.env.VITE_BACKEND_URL?.trim() || "http://localhost:5001";
  return raw.replace(/\/+$/, "").replace(/\/api\/?$/i, "");
};

const TourAdvisorChat = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        "Xin chào! Mình là trợ lý AI của VietNam Travel. Bạn muốn đi khoảng **bao nhiêu ngày**, **miền nào** hoặc **ngân sách** thế nào? Mình sẽ gợi ý tour phù hợp kèm **link đặt ngay**.",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  useEffect(() => {
    if (!cooldownUntil || Date.now() >= cooldownUntil) {
      setCooldownLeft(0);
      return undefined;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const isCoolingDown = cooldownLeft > 0;

  const send = async () => {
    const text = input.trim();
    if (!text || loading || isCoolingDown) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${getBackendBase()}/api/tour-advisor`,
        { message: text },
        { timeout: 25000 },
      );
      if (!data.success) {
        setError(data.message || "Không gửi được câu hỏi.");
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "" },
      ]);
    } catch (e) {
      const status = e.response?.status;
      const msg =
        e.response?.data?.message ||
        e.message ||
        "Lỗi mạng. Vui lòng thử lại.";
      const lowerMsg = String(msg).toLowerCase();
      const isBusyError =
        status === 429 ||
        status === 503 ||
        lowerMsg.includes("overload") ||
        lowerMsg.includes("quá tải") ||
        lowerMsg.includes("quota") ||
        lowerMsg.includes("resource_exhausted");
      if (isBusyError) {
        setCooldownUntil(Date.now() + 20 * 1000);
      }
      setError(
        status === 404
          ? `${msg} — Kiểm tra backend đã restart chưa (POST /api/tour-advisor).`
          : isBusyError
            ? `${msg} Vui lòng chờ vài giây rồi thử lại.`
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {open && (
        <div
          className="flex w-[min(calc(100vw-2rem),20rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-600 dark:bg-slate-900/95"
          role="dialog"
          aria-label="Tư vấn tour bằng AI"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-sky-600 to-indigo-700 px-3 py-2.5 text-white dark:border-slate-700">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Bot className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black uppercase tracking-wider text-sky-100">
                  Gemini · Tư vấn tour
                </p>
                <p className="truncate text-xs font-semibold">
                  Gợi ý có link đặt chỗ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(52vh,340px)] space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-blue-600 text-white"
                      : "rounded-tl-sm border border-slate-100 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-a:font-semibold prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-sky-400">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) =>
                            href?.startsWith("/") ? (
                              <Link
                                to={href}
                                className="font-semibold text-sky-600 underline decoration-sky-400/60 underline-offset-2 hover:text-indigo-600 dark:text-sky-400"
                              >
                                {children}
                              </Link>
                            ) : (
                              <a
                                href={href}
                                className="font-semibold text-sky-600 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang phân tích tour…
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-200">
                {error}
              </p>
            )}
            {isCoolingDown && (
              <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                Hệ thống AI đang hạ tải. Bạn có thể gửi lại sau {cooldownLeft}s.
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-slate-100 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
            <input
              className="min-h-[40px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] outline-none ring-sky-500/30 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="VD: Tour biển miền Trung 3 ngày?"
              value={input}
              disabled={loading || isCoolingDown}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim() || isCoolingDown}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Gửi"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 rounded-full border border-violet-200 bg-white/95 px-4 py-2.5 text-[13px] font-bold text-violet-800 shadow-lg ring-4 ring-violet-100/60 backdrop-blur-sm transition hover:bg-violet-600 hover:text-white dark:border-violet-700 dark:bg-slate-800 dark:text-violet-200 dark:ring-violet-900/40 dark:hover:bg-violet-600 dark:hover:text-white"
      >
        <Sparkles className="h-4 w-4 text-violet-500 transition group-hover:text-white dark:text-violet-400" />
        Tư vấn AI
      </button>
    </div>
  );
};

export default TourAdvisorChat;
