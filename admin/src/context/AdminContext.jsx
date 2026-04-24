/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [aToken, setAToken] = useState(
    localStorage.getItem("adminToken") || "",
  );
  const [users, setUsers] = useState([]);
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const getAllUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/admin/users`, {
        headers: { token: aToken },
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

  const deleteUser = useCallback(
    async (id) => {
      if (window.confirm("Bạn chắc chắn muốn xóa?")) {
        try {
          const { data } = await axios.post(
            `${backendUrl}/api/user/admin/delete-user`,
            { id },
            {
              headers: { token: aToken },
            },
          );
          if (data.success) {
            toast.success(data.message);
            getAllUsers();
          } else {
            toast.error(data.message || "Không xóa được");
          }
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Lỗi khi xóa người dùng",
          );
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
          { headers: { token: aToken } },
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
  };
  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
