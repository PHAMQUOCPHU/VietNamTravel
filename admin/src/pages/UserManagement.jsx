import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { AdminContext } from "../context/AdminContext";
import axios from "axios";
import {
  Search,
  Mail,
  Phone,
  Shield,
  Trash2,
  Loader2,
  Users,
  Crown,
  Gem,
  Sparkles,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const RANKS = ["Bạc", "Vàng", "Kim cương"];

const ROLE_OPTIONS = [
  { value: "user", label: "Thành viên" },
  { value: "admin", label: "Quản trị" },
];

/** Giải mã payload JWT (chỉ đọc id — nhận diện tài khoản đang đăng nhập) */
function decodeAdminPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function normalizeRank(rank) {
  if (RANKS.includes(rank)) return rank;
  return "Bạc";
}

/** Ngày tạo từ ObjectId Mongo (24 hex) khi không có createdAt */
function dateFromObjectId(id) {
  const s = id != null ? String(id) : "";
  if (s.length !== 24 || !/^[a-f0-9]{24}$/i.test(s)) return null;
  const sec = parseInt(s.slice(0, 8), 16);
  if (!Number.isFinite(sec)) return null;
  const d = new Date(sec * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Ngày tham gia: ưu tiên createdAt, fallback từ _id */
function formatJoinedAt(user) {
  const raw = user?.createdAt ?? user?.created_at;
  let d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) {
    d = dateFromObjectId(user?._id);
  }
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function toTelHref(phone) {
  const raw = phone == null ? "" : String(phone).trim();
  if (!raw) return "";
  const normalized = raw.replace(/[^\d+]/g, "");
  if (!normalized) return "";
  return `tel:${normalized}`;
}

function RankBadge({ rank }) {
  const r = normalizeRank(rank);
  const cfg =
    r === "Kim cương"
      ? {
          label: "Kim cương",
          className:
            "border-cyan-300/60 bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-900",
          icon: <Gem className="h-3.5 w-3.5 text-cyan-600" strokeWidth={2.2} />,
        }
      : r === "Vàng"
        ? {
            label: "Vàng",
            className:
              "border-amber-300/70 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-950",
            icon: (
              <Crown className="h-3.5 w-3.5 text-amber-600" strokeWidth={2.2} />
            ),
          }
        : {
            label: "Bạc",
            className:
              "border-slate-200 bg-gradient-to-r from-slate-50 to-zinc-50 text-slate-800",
            icon: (
              <Sparkles
                className="h-3.5 w-3.5 text-slate-500"
                strokeWidth={2.2}
              />
            ),
          };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold shadow-sm ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const UserManagement = () => {
  const { aToken, users, getAllUsers, deleteUser, updateUserAdmin } =
    useContext(AdminContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [patchingId, setPatchingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
  });

  const adminPayload = useMemo(() => decodeAdminPayload(aToken), [aToken]);
  const adminUserId = adminPayload?.id ? String(adminPayload.id) : null;

  useEffect(() => {
    if (aToken) getAllUsers();
  }, [aToken, getAllUsers]);

  const handleRefresh = useCallback(async () => {
    if (!aToken) return;
    setRefreshing(true);
    try {
      await getAllUsers();
    } finally {
      setRefreshing(false);
    }
  }, [aToken, getAllUsers]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin").length;
    const silver = users.filter((u) => normalizeRank(u.rank) === "Bạc").length;
    const gold = users.filter((u) => normalizeRank(u.rank) === "Vàng").length;
    const diamond = users.filter(
      (u) => normalizeRank(u.rank) === "Kim cương",
    ).length;
    return { total: users.length, admins, silver, gold, diamond };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const matchText =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        String(user._id).toLowerCase().includes(q);
      const r = normalizeRank(user.rank);
      const matchRank =
        rankFilter === "all" ||
        (rankFilter === "Bạc" && r === "Bạc") ||
        (rankFilter === "Vàng" && r === "Vàng") ||
        (rankFilter === "Kim cương" && r === "Kim cương");
      return matchText && matchRank;
    });
  }, [users, searchTerm, rankFilter]);

  const runPatch = async (userId, payload) => {
    setPatchingId(userId);
    try {
      await updateUserAdmin(userId, payload);
    } finally {
      setPatchingId(null);
    }
  };

  const onRoleChange = async (user, nextRole) => {
    if (nextRole === user.role) return;
    if (String(user._id) === adminUserId && nextRole === "user") {
      toast.warning("Không thể tự hạ quyền quản trị của chính bạn.");
      return;
    }
    if (
      nextRole === "admin" &&
      !window.confirm(
        "Cấp quyền Quản trị cho tài khoản này? Họ sẽ đăng nhập được vào khu vực admin.",
      )
    ) {
      return;
    }
    await runPatch(String(user._id), { role: nextRole });
  };

  const isSelf = (user) => adminUserId && String(user._id) === adminUserId;

  const canDelete = (user) => {
    if (isSelf(user)) return false;
    if (user.role === "admin") return false;
    return true;
  };

  const openUserDetail = async (userId) => {
    try {
      setDetailLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5001"}/api/user/admin/users/${userId}/detail`,
        { headers: { token: aToken } },
      );
      if (!data.success) {
        toast.error(data.message || "Không tải được chi tiết người dùng");
        return;
      }
      setDetailUser(data.user);
      setBookingStats(data.bookingStats || { totalBookings: 0, confirmedBookings: 0 });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không tải được chi tiết người dùng",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">
            Quản trị · Người dùng
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Quản lý người dùng
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
            Tìm kiếm, lọc theo hạng thành viên và gán vai trò (thành viên / quản
            trị). Hạng hiển thị theo dữ liệu tài khoản (cập nhật từ app khách theo
            chi tiêu).
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || !aToken}
          className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 lg:self-auto"
        >
          <RefreshCw
            className={`h-[18px] w-[18px] ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Tổng thành viên", value: stats.total },
          { label: "Quản trị", value: stats.admins },
          { label: "Hạng Bạc", value: stats.silver },
          { label: "Hạng Vàng", value: stats.gold },
          { label: "Kim cương", value: stats.diamond },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {card.value.toLocaleString("vi-VN")}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email hoặc ID…"
            className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-violet-100 transition focus:border-violet-400 focus:ring-4"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:shrink-0">
          {["all", ...RANKS].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRankFilter(key)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                rankFilter === key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {key === "all" ? "Tất cả hạng" : key}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <h2 className="text-sm font-bold text-slate-900">Danh sách</h2>
          <p className="text-xs text-slate-500">
            {filteredUsers.length} / {users.length} tài khoản sau lọc
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-6">Người dùng</th>
                <th className="px-4 py-3 sm:px-6">Hạng</th>
                <th className="px-4 py-3 sm:px-6">Vai trò</th>
                <th className="px-4 py-3 sm:px-6">Ngày tham gia</th>
                <th className="px-4 py-3 text-center sm:px-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((item) => {
                const self = isSelf(item);
                const busy = patchingId === String(item._id);
                const deletable = canDelete(item);
                const telHref = toTelHref(item.phone);
                return (
                  <tr
                    key={item._id}
                    className="transition-colors hover:bg-violet-50/25"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-200/50">
                          {(item.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {item.name}
                            </span>
                            {self ? (
                              <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                                Bạn
                              </span>
                            ) : null}
                            {item.role === "admin" ? (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                                <Shield className="h-3 w-3" />
                                Admin
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle sm:px-6">
                      <RankBadge rank={item.rank} />
                    </td>
                    <td className="px-4 py-4 align-top sm:px-6">
                      <select
                        value={item.role === "admin" ? "admin" : "user"}
                        disabled={busy || self}
                        title={
                          self
                            ? "Không thể đổi vai trò của chính bạn tại đây"
                            : undefined
                        }
                        onChange={(e) => onRoleChange(item, e.target.value)}
                        className="w-full max-w-[11rem] rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                      >
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {self ? (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Giữ quyền admin cho phiên hiện tại
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 sm:px-6">
                      <span className="whitespace-nowrap font-medium">
                        {formatJoinedAt(item)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center sm:px-6">
                      {busy ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-violet-500" />
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openUserDetail(item._id)}
                            title="Xem chi tiết"
                            className="inline-flex rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-[18px] w-[18px]" />
                          </button>
                          <a
                            href={telHref || undefined}
                            title={telHref ? "Gọi điện" : "Người dùng chưa có số điện thoại"}
                            className={`inline-flex rounded-xl p-2 transition ${
                              telHref
                                ? "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                                : "pointer-events-none text-slate-300"
                            }`}
                            aria-disabled={!telHref}
                          >
                            <Phone className="h-[18px] w-[18px]" />
                          </a>
                          <button
                            type="button"
                            onClick={() => deleteUser(item._id)}
                            disabled={!deletable}
                            title={
                              self
                                ? "Không xóa chính bạn"
                                : item.role === "admin"
                                  ? "Không xóa tài khoản admin"
                                  : "Xóa người dùng"
                            }
                            className="inline-flex rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-[18px] w-[18px]" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-200" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Không có người dùng phù hợp
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
              Thử đổi bộ lọc hạng hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : null}
      </div>

      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-100">
                    Hồ sơ tài khoản
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold">
                    Chi tiết người dùng
                  </h3>
                  <p className="mt-1 text-sm text-blue-100">
                    {detailUser.name || "Khách hàng"} ·{" "}
                    {detailUser.role === "admin" ? "Quản trị viên" : "Thành viên"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-slate-100 bg-slate-50/80">
              {[
                {
                  label: "Tổng chi tiêu",
                  value: `${(Number(detailUser.totalSpent) || 0).toLocaleString("vi-VN")} đ`,
                },
                {
                  label: "Tổng đơn",
                  value: bookingStats.totalBookings,
                },
                {
                  label: "Đơn đã xác nhận",
                  value: bookingStats.confirmedBookings,
                },
                {
                  label: "Tour yêu thích",
                  value: Array.isArray(detailUser.favorites)
                    ? detailUser.favorites.length
                    : 0,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5"
                >
                  <p className="text-[11px] text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Họ tên</p>
                <p className="font-semibold text-slate-900">{detailUser.name || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Email</p>
                <p className="font-semibold text-slate-900">{detailUser.email || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Số điện thoại</p>
                <p className="font-semibold text-slate-900">{detailUser.phone || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Ngày tham gia</p>
                <p className="font-semibold text-slate-900">{formatJoinedAt(detailUser)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Ngày sinh</p>
                <p className="font-semibold text-slate-900">
                  {detailUser.dob
                    ? new Date(detailUser.dob).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Giới tính</p>
                <p className="font-semibold text-slate-900">
                  {detailUser.gender === "female"
                    ? "Nữ"
                    : detailUser.gender === "other"
                      ? "Khác"
                      : "Nam"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Vai trò</p>
                <p className="font-semibold text-slate-900">
                  {detailUser.role === "admin" ? "Quản trị viên" : "Thành viên"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-slate-500">Hạng</p>
                <p className="font-semibold text-slate-900">{normalizeRank(detailUser.rank)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-xl border border-slate-200 inline-flex items-center gap-3 text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Đang tải chi tiết người dùng...
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
