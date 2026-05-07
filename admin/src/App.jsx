import { Suspense, lazy, useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdminContext } from "./context/AdminContext.jsx";
import { applyAdminPanelFavicon, resolveAdminPanelLogoSrc } from "./utils/adminBranding";

import AdminLayout from "./components/AdminLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const TourManagement = lazy(() => import("./pages/TourManagement"));
const AddTour = lazy(() => import("./pages/AddTour"));
const EditTour = lazy(() => import("./pages/EditTour"));
const BookingManagement = lazy(() => import("./pages/BookingManagement"));
const Login = lazy(() => import("./pages/Login"));
const AdminForgotPassword = lazy(() => import("./pages/AdminForgotPassword.jsx"));
const AdminVerifyOtpReset = lazy(() => import("./pages/AdminVerifyOtpReset.jsx"));
const AdminResetPassword = lazy(() => import("./pages/AdminResetPassword.jsx"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const PostManagement = lazy(() => import("./pages/PostManagement"));
const AddBlog = lazy(() => import("./pages/AddBlog"));
const ListBlog = lazy(() => import("./pages/ListBlog.jsx"));
const EditBlog = lazy(() => import("./pages/EditBlog.jsx"));
const Vouchers = lazy(() => import("./pages/Vouchers"));
const Messages = lazy(() => import("./pages/Messages"));
const PromotionManager = lazy(() => import("./pages/PromotionManager.jsx"));
const InsurancePartners = lazy(() => import("./pages/InsurancePartners.jsx"));
const JobManagement = lazy(() => import("./pages/JobManagement.jsx"));
const ApplicationManagement = lazy(
  () => import("./pages/ApplicationManagement.jsx"),
);
const Settings = lazy(() => import("./pages/Settings.jsx"));
const TermsManagement = lazy(() => import("./pages/TermsManagement.jsx"));
const MaintenanceSettings = lazy(() => import("./pages/MaintenanceSettings.jsx"));

function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] w-full flex-1 items-center justify-center bg-slate-900 text-sm text-slate-400"
    >
      Đang tải…
    </div>
  );
}

function App() {
  const { aToken, adminLogoUrl } = useContext(AdminContext);

  useEffect(() => {
    applyAdminPanelFavicon(resolveAdminPanelLogoSrc(adminLogoUrl));
  }, [adminLogoUrl]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <Routes>
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<PageFallback />}>
              {aToken ? <Navigate to="/admin" replace /> : <Login />}
            </Suspense>
          }
        />

        <Route
          path="/admin/forgot-password"
          element={
            <Suspense fallback={<PageFallback />}>
              {aToken ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminForgotPassword />
              )}
            </Suspense>
          }
        />
        <Route
          path="/admin/verify-otp-reset"
          element={
            <Suspense fallback={<PageFallback />}>
              {aToken ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminVerifyOtpReset />
              )}
            </Suspense>
          }
        />
        <Route
          path="/admin/reset-password"
          element={
            <Suspense fallback={<PageFallback />}>
              {aToken ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminResetPassword />
              )}
            </Suspense>
          }
        />

        <Route
          path="/admin"
          element={
            aToken ? <AdminLayout /> : <Navigate to="/admin/login" replace />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="messages" element={<Messages />} />
          <Route path="tours" element={<TourManagement />} />
          <Route path="add-tour" element={<AddTour />} />
          <Route path="edit-tour/:tourKey" element={<EditTour />} />
          <Route path="promotions" element={<PromotionManager />} />
          <Route path="posts" element={<PostManagement />} />
          <Route path="add-blog" element={<AddBlog />} />
          <Route path="blog-list" element={<ListBlog />} />
          <Route path="edit-blog/:id" element={<EditBlog />} />
          <Route path="partners" element={<InsurancePartners />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="jobs" element={<JobManagement />} />
          <Route path="applications" element={<ApplicationManagement />} />
          <Route path="settings/terms" element={<TermsManagement />} />
          <Route path="settings/maintenance" element={<MaintenanceSettings />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}

export default App;
