import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";
import { AdminContext } from "./context/AdminContext.jsx";

// Layout
import AdminLayout from "./components/AdminLayout";

// Import các Pages
import Dashboard from "./pages/Dashboard";
import TourManagement from "./pages/TourManagement";
import AddTour from "./pages/AddTour";
import EditTour from "./pages/EditTour";
import BookingManagement from "./pages/BookingManagement";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";
import PostManagement from "./pages/PostManagement";
import AddBlog from "./pages/AddBlog";
import ListBlog from "./pages/ListBlog.jsx";
import EditBlog from "./pages/EditBlog.jsx";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages"; // Đảm bảo file này đã tồn tại trong admin/src/pages/
import PromotionManager from "./pages/PromotionManager.jsx";
import InsurancePartners from "./pages/InsurancePartners.jsx";

function App() {
  const { aToken } = useContext(AdminContext);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <Routes>
        {/* 1. Trang Login */}
        <Route
          path="/admin/login"
          element={aToken ? <Navigate to="/admin" replace /> : <Login />}
        />

        {/* 2. Cụm Admin: Có AdminLayout che chở (Sidebar + Navbar) */}
        <Route
          path="/admin"
          element={
            aToken ? <AdminLayout /> : <Navigate to="/admin/login" replace />
          }
        >
          {/* Khi khớp /admin thì hiện Dashboard */}
          <Route index element={<Dashboard />} />

          {/* --- FIX LỖI TẠI ĐÂY --- */}
          {/* Đường dẫn sẽ là /admin/messages */}
          <Route path="messages" element={<Messages />} />

          {/* Quản lý Tour */}
          <Route path="tours" element={<TourManagement />} />
          <Route path="add-tour" element={<AddTour />} />
          <Route path="edit-tour/:tourKey" element={<EditTour />} />
          <Route path="promotions" element={<PromotionManager />} />

          {/* Quản lý Blog/Posts */}
          <Route path="posts" element={<PostManagement />} />
          <Route path="add-blog" element={<AddBlog />} />
          <Route path="blog-list" element={<ListBlog />} />
          <Route path="edit-blog/:id" element={<EditBlog />} />
          <Route path="partners" element={<InsurancePartners />} />

          {/* Các quản lý khác */}
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 3. Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

export default App;
