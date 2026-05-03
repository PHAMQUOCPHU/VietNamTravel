import React from "react";

/**
 * Bắt lỗi render (tránh màn hình trắng khi có exception).
 * Nếu thấy panel này trên prod: mở DevTools Console để có stack trace chi tiết hơn.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-800">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
          <h1 className="text-xl font-black text-red-700">Ứng dụng gặp lỗi</h1>
          <p className="mt-2 text-sm text-slate-600">
            Có một lỗi khiến trang không hiển thị. Vui lòng mở{" "}
            <strong>Công cụ nhà phát triển (F12)</strong> → tab{" "}
            <strong>Console</strong>, chụp màn hình báo lỗi và gửi nhóm dev.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-red-800">
            {error?.message || String(error)}
          </pre>
          <button
            type="button"
            className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
