import React, { useEffect, useState, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, ArrowLeft, Loader2, User, Eye, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { BACKEND_URL } from "../config/env";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AppContext);
  const [blogData, setBlogData] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const backendUrl = BACKEND_URL;
  const resolveImageUrl = (imageValue) => {
    if (!imageValue) return "";
    if (String(imageValue).startsWith("http")) return imageValue;
    return "https://via.placeholder.com/1200x700?text=Blog";
  };

  const safeArticleHtml = useMemo(
    () =>
      DOMPurify.sanitize(blogData?.content || "", {
        USE_PROFILES: { html: true },
      }),
    [blogData?.content],
  );

  const getViewerId = () => {
    const storedId = localStorage.getItem("blog_viewer_id");
    if (storedId) return storedId;
    const newId = `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("blog_viewer_id", newId);
    return newId;
  };

  const fetchBlogDetail = useCallback(
    async ({ signal } = {}) => {
      try {
        setLoading(true);
        const viewerId = getViewerId();
        const { data } = await axios.get(`${backendUrl}/api/blog/${id}`, {
          params: { incrementView: true },
          headers: { "x-viewer-id": viewerId },
          signal,
        });
        if (data.success) setBlogData(data.blog);
      } catch (error) {
        if (
          error.code !== "ERR_CANCELED" &&
          error.name !== "CanceledError"
        ) {
          console.error("Lỗi fetch blog:", error);
          toast.error("Khong the tai bai viet");
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [id, backendUrl],
  );

  useEffect(() => {
    if (!id) return undefined;
    const ac = new AbortController();
    fetchBlogDetail({ signal: ac.signal });
    window.scrollTo(0, 0);
    return () => ac.abort();
  }, [id, fetchBlogDetail]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.info("Vui long dang nhap de binh luan");
      navigate("/login");
      return;
    }
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${backendUrl}/api/blog/${id}/comments`,
        { content: comment },
        { headers: { token } },
      );
      if (data.success) {
        setBlogData((prev) => ({ ...prev, comments: data.comments }));
        setComment("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Khong the gui binh luan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 animate-pulse">Đang chuẩn bị bài viết...</p>
      </div>
    );
  }

  if (!blogData) return null;

  return (
    <div className="min-h-screen bg-white pb-20 pt-24 md:pt-36 overflow-x-hidden">
      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-10 transition-all font-semibold text-sm"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Quay lại cẩm nang
        </button>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
              {blogData.category}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-8 break-words overflow-hidden w-full">
            {blogData.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <User size={20} className="text-gray-400" />
              </div>
              <span className="font-bold text-gray-900">
                {blogData.author || "Admin"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              {new Date(blogData.date).toLocaleDateString("vi-VN")}
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-emerald-500" />
              {blogData.views || 0} luot xem
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-indigo-500" />
              {blogData.comments?.length || 0} binh luan
            </div>
          </div>
        </header>

        <div className="w-full aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-blue-100 border border-gray-50">
          <img
            src={resolveImageUrl(blogData.image)}
            alt={blogData.title}
            className="w-full h-full object-cover"
          />
        </div>

        <article
          className="prose prose-blue max-w-none prose-h2:text-xl md:prose-h2:text-3xl prose-h2:font-black prose-h2:text-gray-900 prose-h2:mt-12 prose-h2:mb-6 prose-h2:break-words prose-h3:text-lg md:prose-h3:text-2xl prose-h3:font-bold prose-h3:text-gray-800 prose-h3:mt-8 prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg prose-p:break-words prose-img:rounded-2xl prose-img:w-full prose-img:mx-auto prose-strong:text-blue-600 prose-li:text-gray-600"
          dangerouslySetInnerHTML={{ __html: safeArticleHtml }}
        />

        <div className="mt-20 pt-10 border-t border-gray-100 space-y-8">
          <h3 className="text-2xl font-black text-gray-900">Binh luan</h3>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            <textarea
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                token
                  ? "Chia se cam nhan cua ban ve bai viet..."
                  : "Dang nhap de binh luan"
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!token || submitting}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold disabled:opacity-50"
              disabled={!token || submitting || !comment.trim()}
            >
              {submitting ? "Dang gui..." : "Gui binh luan"}
            </button>
          </form>

          <div className="space-y-4">
            {(blogData.comments || []).map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-800">
                    {item.userName || user?.name || "Nguoi dung"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <p className="text-slate-600">{item.content}</p>
              </div>
            ))}
            {!blogData.comments?.length && (
              <p className="text-slate-400 font-medium">Chua co binh luan nao.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
