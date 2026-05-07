/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getSocket } from "../lib/socketClient";
import { normalizeBackendOrigin } from "../lib/backendOrigin";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [aToken, setAToken] = useState(
    localStorage.getItem("adminToken") || "",
  );
  const [users, setUsers] = useState([]);
  const [adminChatUnreadCount, setAdminChatUnreadCount] = useState(0);
  const [adminLogoUrl, setAdminLogoUrl] = useState("");
  const backendUrl = normalizeBackendOrigin(
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5001",
  );

  const refreshAdminBranding = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/site-config/public`,
      );
      if (data?.success && typeof data.adminLogoUrl === "string") {
        setAdminLogoUrl(data.adminLogoUrl.trim());
      }
    } catch {
      /* ignore offline */
    }
  }, [backendUrl]);

  useEffect(() => {
    // tránh warning "setState in effect" của eslint rule dự án
    const t = setTimeout(() => {
      refreshAdminBranding();
    }, 0);
    return () => clearTimeout(t);
  }, [refreshAdminBranding]);

  const refreshAdminChatUnread = useCallback(async () => {
    if (!aToken) {
      setAdminChatUnreadCount(0);
      return;
    }
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/messages/admin/unread-count`,
        { headers: { atoken: aToken } },
      );
      if (data.success) setAdminChatUnreadCount(data.unreadCount ?? 0);
    } catch {
      setAdminChatUnreadCount(0);
    }
  }, [aToken, backendUrl]);

  const getAllUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/admin/users`, {
        headers: { atoken: aToken },
      });
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Lỗi kết nối Backend hoặc hết phiên",
      );
    }
  }, [aToken, backendUrl]);

  const chatUnreadDebounceRef = useRef(null);

  useEffect(() => {
    if (!aToken) {
      // tránh warning "setState in effect" của eslint rule dự án
      const t = setTimeout(() => setAdminChatUnreadCount(0), 0);
      return () => clearTimeout(t);
    }

    const apiBase = backendUrl.replace(/\/+$/, "");
    const sock = getSocket(apiBase);

    sock.emit("join_staff_admin_chat", { atoken: aToken });

    const bumpUnreadBadge = () => {
      clearTimeout(chatUnreadDebounceRef.current);
      chatUnreadDebounceRef.current = setTimeout(() => {
        refreshAdminChatUnread();
      }, 380);
    };

    const onIncomingToAdmin = (data) => {
      if (
        data?.receiverId === "ADMIN" &&
        data?.senderId &&
        data.senderId !== "ADMIN"
      ) {
        bumpUnreadBadge();
      }
    };

    sock.on("receive_message", onIncomingToAdmin);
    // tránh warning "setState in effect" của eslint rule dự án
    const t0 = setTimeout(() => {
      refreshAdminChatUnread();
    }, 0);

    const intervalId = setInterval(refreshAdminChatUnread, 22000);

    return () => {
      clearTimeout(t0);
      clearTimeout(chatUnreadDebounceRef.current);
      clearInterval(intervalId);
      sock.off("receive_message", onIncomingToAdmin);
      sock.emit("leave_staff_admin_chat");
    };
  }, [aToken, backendUrl, refreshAdminChatUnread]);

  /** Xóa user (gọi trực tiếp — UI tự hiển thị xác nhận nếu cần) */
  const deleteUser = useCallback(
    async (id) => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/admin/delete-user`,
          { id },
          {
            headers: { atoken: aToken },
          },
        );
        if (data.success) {
          toast.success(data.message);
          await getAllUsers();
          return true;
        }
        toast.error(data.message || "Không xóa được");
        return false;
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa người dùng");
        return false;
      }
    },
    [aToken, backendUrl, getAllUsers],
  );

  const createUserAdminApi = useCallback(
    async (payload) => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/admin/create-user`,
          payload,
          { headers: { atoken: aToken } },
        );
        if (data.success) {
          toast.success(data.message || "Đã tạo người dùng");
          if (data.tempPassword) {
            toast.info(
              `Mật khẩu tạm (lưu lại): ${data.tempPassword}`,
              { autoClose: 20000 },
            );
          }
          await getAllUsers();
          return data;
        }
        toast.error(data.message || "Không tạo được");
        return null;
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Lỗi khi tạo người dùng",
        );
        return null;
      }
    },
    [aToken, backendUrl, getAllUsers],
  );

  const updateUserAdmin = useCallback(
    async (userId, payload) => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/user/admin/users/update`,
          { userId, ...payload },
          { headers: { atoken: aToken } },
        );
        if (data.success) {
          toast.success(data.message || "Đã cập nhật");
          await getAllUsers();
          return true;
        }
        toast.error(data.message || "Cập nhật thất bại");
        return false;
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Lỗi khi cập nhật người dùng",
        );
        return false;
      }
    },
    [aToken, backendUrl, getAllUsers],
  );

  useEffect(() => {
    if (aToken) {
      localStorage.setItem("adminToken", aToken);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [aToken]);

  const value = useMemo(
    () => ({
      aToken,
      setAToken,
      backendUrl,
      users,
      getAllUsers,
      deleteUser,
      createUserAdminApi,
      updateUserAdmin,
      adminChatUnreadCount,
      refreshAdminChatUnread,
      adminLogoUrl,
      refreshAdminBranding,
    }),
    [
      aToken,
      backendUrl,
      users,
      getAllUsers,
      deleteUser,
      createUserAdminApi,
      updateUserAdmin,
      adminChatUnreadCount,
      refreshAdminChatUnread,
      adminLogoUrl,
      refreshAdminBranding,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>
  );
};

export default AdminContextProvider;
