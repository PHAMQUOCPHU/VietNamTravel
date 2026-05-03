/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, useRef } from "react";
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
  const backendUrl = normalizeBackendOrigin(
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5001",
  );

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
      setAdminChatUnreadCount(0);
      return undefined;
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
    refreshAdminChatUnread();

    const intervalId = setInterval(refreshAdminChatUnread, 22000);

    return () => {
      clearTimeout(chatUnreadDebounceRef.current);
      clearInterval(intervalId);
      sock.off("receive_message", onIncomingToAdmin);
      sock.emit("leave_staff_admin_chat");
    };
  }, [aToken, backendUrl, refreshAdminChatUnread]);

  const deleteUser = useCallback(
    async (id) => {
      if (window.confirm("Bạn chắc chắn muốn xóa?")) {
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
            getAllUsers();
          } else {
            toast.error(data.message || "Không xóa được");
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Lỗi khi xóa người dùng");
        }
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

  const value = {
    aToken,
    setAToken,
    backendUrl,
    users,
    getAllUsers,
    deleteUser,
    updateUserAdmin,
    adminChatUnreadCount,
    refreshAdminChatUnread,
  };

  return (
    <AdminContext.Provider value={value}>{props.children}</AdminContext.Provider>
  );
};

export default AdminContextProvider;
