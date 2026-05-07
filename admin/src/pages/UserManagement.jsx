import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { AdminContext } from "../context/AdminContext";
import axios from "axios";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Loader2,
  Plus,
  Check,
  X,
  Trash2,
  Pencil,
  Eye,
  Ban,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminHeaders } from "../lib/adminHeaders";

/** Giải mã JWT admin — nhận diện tài khoản đang đăng nhập */
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

function dateFromObjectId(id) {
  const s = id != null ? String(id) : "";
  if (s.length !== 24 || !/^[a-f0-9]{24}$/i.test(s)) return null;
  const sec = parseInt(s.slice(0, 8), 16);
  if (!Number.isFinite(sec)) return null;
  const d = new Date(sec * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Chỉ ngày — khớp cột "Ngày tham gia" */
function formatJoinedDate(user) {
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
  }).format(d);
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

const AVATAR_HEX = [
  "#105551",
  "#0d7377",
  "#14919b",
  "#0b6e4f",
  "#6b4c9a",
  "#c44536",
  "#2d6a4f",
  "#1d3557",
  "#e76f51",
  "#264653",
];

function avatarHexForId(id) {
  const s = String(id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1)
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_HEX[h % AVATAR_HEX.length];
}

/** User cũ không có field → coi như đang hoạt động */
function isUserActive(u) {
  return u.isActive !== false;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "user",
  rank: "Bạc",
  accountStatus: "active",
  password: "",
  birthYear: "",
  occupation: "",
  gender: "male",
  maritalStatus: "other",
};

const UserManagement = () => {
  const {
    aToken,
    backendUrl,
    users,
    getAllUsers,
    deleteUser,
    updateUserAdmin,
    createUserAdminApi,
  } = useContext(AdminContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
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

  const isSelf = useCallback(
    (user) => adminUserId && user && String(user._id) === adminUserId,
    [adminUserId],
  );

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => isUserActive(u)).length;
    const inactive = users.filter((u) => u.isActive === false).length;
    return { total, active, inactive };
  }, [users]);

  const q = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    let list = users;
    if (statusFilter === "active") {
      list = list.filter((u) => isUserActive(u));
    } else if (statusFilter === "inactive") {
      list = list.filter((u) => u.isActive === false);
    }
    if (rankFilter !== "all") {
      list = list.filter((u) => (u?.rank || "Bạc") === rankFilter);
    }
    if (!q) return list;
    return list.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, q, statusFilter, rankFilter]);

  const openAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setForm({ ...emptyForm });
    setUserModalOpen(true);
  };

  const openEdit = (user) => {
    setModalMode("edit");
    setEditingId(String(user._id));
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role === "admin" ? "admin" : "user",
      rank: user.rank || "Bạc",
      accountStatus: isUserActive(user) ? "active" : "inactive",
      password: "",
      birthYear:
        user.birthYear != null && String(user.birthYear).trim() !== ""
          ? String(user.birthYear)
          : user.dob
            ? String(new Date(user.dob).getFullYear())
            : "",
      occupation: user.occupation || "",
      gender: user.gender || "male",
      maritalStatus: user.maritalStatus || "other",
    });
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setSaving(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const onSubmitUser = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nhập đủ họ tên và email.");
      return;
    }

    if (modalMode === "add") {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        rank: form.rank,
        isActive: form.accountStatus === "active",
        birthYear: form.birthYear,
        occupation: form.occupation,
        gender: form.gender,
        maritalStatus: form.maritalStatus,
      };
      if (form.password.trim()) payload.password = form.password.trim();
      const res = await createUserAdminApi(payload);
      setSaving(false);
      if (res) closeUserModal();
      return;
    }

    if (!editingId) return;

    const targetRow = users.find((u) => String(u._id) === editingId);
    const isEditingSelf = isSelf(targetRow);

    if (isEditingSelf && form.role === "user") {
      toast.warning("Không thể tự hạ quyền quản trị của chính bạn.");
      return;
    }
    if (
      !isEditingSelf &&
      targetRow?.role === "user" &&
      form.role === "admin" &&
      !window.confirm(
        "Cấp quyền Quản trị? Người này có thể đăng nhập khu vực admin.",
      )
    ) {
      return;
    }
    if (isEditingSelf && form.accountStatus === "inactive") {
      toast.warning("Không thể tự chuyển tài khoản sang ngừng hoạt động.");
      return;
    }

    setSaving(true);
    const ok = await updateUserAdmin(editingId, {
      role: form.role,
      rank: form.rank,
      birthYear: form.birthYear,
      occupation: form.occupation,
      gender: form.gender,
      maritalStatus: form.maritalStatus,
    });
    setSaving(false);
    if (ok) closeUserModal();
  };

  const openUserDetail = useCallback(
    async (userId) => {
      const id = userId != null ? String(userId).trim() : "";
      if (!id || !aToken || !backendUrl) {
        toast.error("Thiếu phiên đăng nhập hoặc không xác định được người dùng.");
        return;
      }
      try {
        setDetailLoading(true);
        const base = backendUrl.replace(/\/+$/, "");
        const { data } = await axios.get(
          `${base}/api/user/admin/users/${encodeURIComponent(id)}/detail`,
          { headers: adminHeaders(aToken), timeout: 30000 },
        );
        if (!data.success) {
          toast.error(data.message || "Không tải được chi tiết người dùng");
          return;
        }
        setDetailUser(data.user);
        setBookingStats(
          data.bookingStats || { totalBookings: 0, confirmedBookings: 0 },
        );
      } catch (error) {
        const status = error.response?.status;
        const serverMsg = error.response?.data?.message;
        if (status === 401 || status === 403) {
          toast.error(serverMsg || "Phiên admin hết hạn — đăng nhập lại.");
        } else {
          toast.error(serverMsg || "Không tải được chi tiết người dùng");
        }
        console.error(
          "openUserDetail:",
          error.response?.status,
          error.response?.data || error.message,
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [aToken, backendUrl],
  );

  const canDelete = useCallback(
    (user) => {
      if (isSelf(user)) return false;
      if (user.role === "admin") return false;
      return true;
    },
    [isSelf],
  );

  const canBlock = useCallback(
    (user) => {
      if (isSelf(user)) return false;
      if (user.role === "admin") return false;
      return true;
    },
    [isSelf],
  );

  const toggleActive = useCallback(
    async (user) => {
      if (!user?._id) return;
      if (!canBlock(user)) {
        toast.warning("Không thể chặn tài khoản admin hoặc chính bạn.");
        return;
      }
      const next = user.isActive === false ? true : false;
      const ok = next
        ? window.confirm(`Bỏ chặn tài khoản "${user.name}"?`)
        : window.confirm(`Chặn tài khoản "${user.name}"?`);
      if (!ok) return;

      setTogglingId(String(user._id));
      try {
        await updateUserAdmin(String(user._id), { isActive: next });
      } finally {
        setTogglingId(null);
      }
    },
    [canBlock, updateUserAdmin],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteUser(deleteTarget._id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  return (
    <div
      className="font-sans min-h-[calc(100vh-6rem)] w-full overflow-auto rounded-2xl text-gray-800"
      style={{
        background:
          "linear-gradient(135deg, #f0f9f8 0%, #e8f4f2 50%, #f5f0eb 100%)",
      }}
    >
      <div className="p-6 md:p-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">
              Quản lý Người dùng
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý người dùng trên nền tảng du lịch của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Thêm người dùng
          </button>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="stat-card rounded-2xl border border-white/30 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                <Users className="h-5 w-5 text-teal-800" />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gray-900">
              {stats.total.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-xs text-gray-400">Tổng người dùng</p>
          </div>
          <div className="stat-card rounded-2xl border border-white/30 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <UserCheck className="h-5 w-5 text-emerald-800" />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gray-900">
              {stats.active.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-xs text-gray-400">Đang hoạt động</p>
          </div>
          <div className="stat-card rounded-2xl border border-white/30 bg-white/70 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                <UserX className="h-5 w-5 text-rose-800" />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gray-900">
              {stats.inactive.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-xs text-gray-400">Ngừng hoạt động</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/30 bg-white/70 p-5 shadow-sm backdrop-blur-md">
          <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm người dùng..."
                className="search-input w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Tất cả" },
                { id: "active", label: "Hoạt động" },
                { id: "inactive", label: "Ngừng HĐ" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setStatusFilter(b.id)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                    statusFilter === b.id
                      ? "bg-teal-800 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {b.label}
                </button>
              ))}
              <div className="h-7 w-px bg-gray-200" aria-hidden />
              <label className="sr-only" htmlFor="um-rank-filter">
                Lọc theo hạng
              </label>
              <select
                id="um-rank-filter"
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:border-brand"
                title="Lọc theo hạng"
              >
                <option value="all">Tất cả hạng</option>
                <option value="Bạc">Bạc</option>
                <option value="Vàng">Vàng</option>
                <option value="Kim cương">Kim cương</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/70 shadow-sm backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Người dùng
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Vai trò
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Ngày tham gia
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                          <Users className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="font-medium">
                          {users.length === 0
                            ? "Chưa có người dùng nào"
                            : "Không có người dùng phù hợp"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {users.length === 0
                            ? 'Nhấn "Thêm người dùng" để bắt đầu'
                            : "Thử đổi bộ lọc hoặc từ khóa"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => {
                    const active = isUserActive(item);
                    const self = isSelf(item);
                    const deletable = canDelete(item);
                    const blockable = canBlock(item);
                    const busy = togglingId === String(item._id);
                    return (
                      <tr
                        key={String(item._id)}
                        className="user-row border-b border-gray-50 transition-colors hover:bg-[rgba(16,85,81,0.04)]"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{
                                background: avatarHexForId(item._id),
                              }}
                            >
                              {initialsFromName(item.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {item.name}
                                {self ? (
                                  <span className="ml-2 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">
                                    Bạn
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-xs text-gray-400">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {item.role === "admin" ? "Admin" : "Khách hàng"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                              active
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {active ? "Hoạt động" : "Ngừng HĐ"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">
                          {formatJoinedDate(item)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="Xem chi tiết"
                              onClick={() => openUserDetail(item._id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Chỉnh sửa"
                              onClick={() => openEdit(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-teal-50 hover:text-teal-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title={
                                blockable
                                  ? active
                                    ? "Chặn (ngừng hoạt động)"
                                    : "Bỏ chặn (kích hoạt lại)"
                                  : "Không thể chặn tài khoản này"
                              }
                              disabled={!blockable || busy}
                              onClick={() => toggleActive(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : active ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              title={
                                deletable
                                  ? "Xóa"
                                  : "Không thể xóa tài khoản này"
                              }
                              disabled={!deletable}
                              onClick={() => deletable && setDeleteTarget(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {userModalOpen ? (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="fade-in max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-gray-900">
                {modalMode === "add"
                  ? "Thêm người dùng"
                  : "Chỉnh sửa người dùng"}
              </h2>
              <button
                type="button"
                onClick={closeUserModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={onSubmitUser} className="space-y-4">
              <div>
                <label
                  htmlFor="um-name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Họ tên
                </label>
                <input
                  id="um-name"
                  type="text"
                  required={modalMode === "add"}
                  readOnly={modalMode === "edit"}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand read-only:bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="um-email"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="um-email"
                    type="email"
                    required={modalMode === "add"}
                    readOnly={modalMode === "edit"}
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand read-only:bg-gray-50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="um-phone"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Số điện thoại
                  </label>
                  <input
                    id="um-phone"
                    type="tel"
                    readOnly={modalMode === "edit"}
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand read-only:bg-gray-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="um-role"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Vai trò
                  </label>
                  <select
                    id="um-role"
                    value={form.role}
                    disabled={
                      modalMode === "edit" &&
                      isSelf(
                        users.find((u) => String(u._id) === editingId),
                      )
                    }
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand disabled:bg-gray-50"
                  >
                    <option value="user">Khách hàng</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="um-rank"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Hạng
                  </label>
                  <select
                    id="um-rank"
                    value={form.rank}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rank: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    <option value="Bạc">Bạc</option>
                    <option value="Vàng">Vàng</option>
                    <option value="Kim cương">Kim cương</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="um-status"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Trạng thái
                  </label>
                  <select
                    id="um-status"
                    value={form.accountStatus}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        accountStatus: e.target.value,
                      }))
                    }
                    disabled={modalMode === "edit"}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand disabled:bg-gray-50 disabled:opacity-80"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng HĐ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="um-birthYear"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Năm sinh
                  </label>
                  <input
                    id="um-birthYear"
                    type="number"
                    inputMode="numeric"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={form.birthYear}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, birthYear: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label
                    htmlFor="um-occupation"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Nghề nghiệp
                  </label>
                  <input
                    id="um-occupation"
                    type="text"
                    value={form.occupation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, occupation: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label
                    htmlFor="um-gender"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Giới tính
                  </label>
                  <select
                    id="um-gender"
                    value={form.gender}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gender: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="um-marital"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Tình trạng hôn nhân
                  </label>
                  <select
                    id="um-marital"
                    value={form.maritalStatus}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maritalStatus: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    <option value="single">Độc thân</option>
                    <option value="married">Đã có gia đình</option>
                    <option value="other">Khác / Không muốn nói</option>
                  </select>
                </div>
              </div>
              {modalMode === "add" ? (
                <div>
                  <label
                    htmlFor="um-pw"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Mật khẩu (tuỳ chọn)
                  </label>
                  <input
                    id="um-pw"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Để trống = hệ thống tạo mật khẩu tạm"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary order-1 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-sm disabled:pointer-events-none disabled:opacity-60 sm:order-none sm:flex-1 sm:py-2.5"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                  {modalMode === "add" ? "Thêm" : "Cập nhật"}
                </button>
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="order-2 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:order-none sm:flex-1 sm:py-2.5"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailUser ? (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="fade-in w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#105551] via-teal-700 to-emerald-600 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    Hồ sơ tài khoản
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold">
                    Chi tiết người dùng
                  </h3>
                  <p className="mt-1 text-sm text-emerald-100">
                    {detailUser.name || "Khách hàng"} ·{" "}
                    {detailUser.role === "admin" ? "Admin" : "Khách hàng"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="rounded-lg bg-white/15 p-2 text-white transition hover:bg-white/25"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50/70 p-5 sm:grid-cols-4">
              {[
                {
                  label: "Tổng chi tiêu",
                  value: `${(Number(detailUser.totalSpent) || 0).toLocaleString("vi-VN")} đ`,
                },
                { label: "Tổng đơn", value: bookingStats.totalBookings },
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
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5"
                >
                  <p className="text-[11px] text-gray-500">{s.label}</p>
                  <p className="mt-1 text-sm font-extrabold text-gray-900">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 text-sm sm:grid-cols-2">
              {[
                { label: "Họ tên", value: detailUser.name || "—" },
                { label: "Email", value: detailUser.email || "—" },
                { label: "Số điện thoại", value: detailUser.phone || "—" },
                { label: "Ngày tham gia", value: formatJoinedDate(detailUser) },
                {
                  label: "Ngày sinh",
                  value: detailUser.dob
                    ? new Date(detailUser.dob).toLocaleDateString("vi-VN")
                    : "—",
                },
                {
                  label: "Năm sinh",
                  value:
                    detailUser.birthYear != null && String(detailUser.birthYear).trim() !== ""
                      ? detailUser.birthYear
                      : detailUser.dob
                        ? new Date(detailUser.dob).getFullYear()
                        : "—",
                },
                {
                  label: "Giới tính",
                  value:
                    detailUser.gender === "female"
                      ? "Nữ"
                      : detailUser.gender === "other"
                        ? "Khác"
                        : "Nam",
                },
                {
                  label: "Nghề nghiệp",
                  value: detailUser.occupation ? detailUser.occupation : "—",
                },
                {
                  label: "Hôn nhân",
                  value:
                    detailUser.maritalStatus === "single"
                      ? "Độc thân"
                      : detailUser.maritalStatus === "married"
                        ? "Đã có gia đình"
                        : "Khác / Không muốn nói",
                },
                {
                  label: "Vai trò",
                  value: detailUser.role === "admin" ? "Admin" : "Khách hàng",
                },
                { label: "Hạng", value: detailUser.rank || "Bạc" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <p className="text-gray-500">{row.label}</p>
                  <p className="font-semibold text-gray-900">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {detailLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
            Đang tải chi tiết người dùng...
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="fade-in w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="font-display text-lg font-bold text-gray-900">
              Xóa người dùng?
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn xóa{" "}
              <span className="font-semibold text-gray-800">
                {deleteTarget.name}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Xóa"
                )}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserManagement;
