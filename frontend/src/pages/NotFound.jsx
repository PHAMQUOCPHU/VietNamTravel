import { Link } from "react-router-dom";
import { Home, Map } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-sky-400">
        Lỗi 404
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
        Không tìm thấy trang
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
        Đường dẫn có thể đã đổi hoặc nhập sai. Bạn có thể về trang chủ hoặc duyệt tour.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          <Home className="h-4 w-4" aria-hidden />
          Trang chủ
        </Link>
        <Link
          to="/tours"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
        >
          <Map className="h-4 w-4" aria-hidden />
          Danh sách tour
        </Link>
      </div>
    </div>
  );
}
