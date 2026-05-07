import { Suspense, lazy, useContext, useEffect, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScrollToTop from "./components/ScrollToTop";
import ChatWidget from "./components/ChatWidget";
import HomeFloatingDock from "./components/HomeFloatingDock";
import { AppContext } from "./context/AppContext";
import { applySiteBrandingIcons, resolveSiteLogoSrc } from "./utils/siteLogo";

const Home = lazy(() => import("./pages/Home"));
const Tour = lazy(() => import("./pages/Tour"));
const TourDetails = lazy(() => import("./pages/TourDetails"));
const Login = lazy(() => import("./pages/Login"));
const Booking = lazy(() => import("./pages/Booking"));
const Invoice = lazy(() => import("./pages/Invoice"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const About = lazy(() => import("./pages/About"));
const MyBooking = lazy(() => import("./pages/MyBooking"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const PaymentReturn = lazy(() => import("./components/PaymentReturn"));
const Privileges = lazy(() => import("./pages/Privileges"));
const MyCollection = lazy(() => import("./pages/MyCollection"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Diaries = lazy(() => import("./pages/Diaries"));
const DisasterMap = lazy(() => import("./pages/DisasterMap"));
const Careers = lazy(() => import("./pages/Careers"));
const SearchResultList = lazy(() => import("./pages/SearchResultList"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Maintenance = lazy(() => import("./pages/Maintenance.jsx"));

function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[50vh] w-full flex-1 flex-col items-center justify-center gap-4 px-4"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-600 dark:border-t-sky-400"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang tải trang…</p>
    </div>
  );
}

const App = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, siteConfig } = useContext(AppContext);

  const maintenance = siteConfig?.maintenance;
  const isMaintenanceEnabled = Boolean(maintenance?.enabled);
  const isAdmin = user?.role === "admin";

  const shouldShowMaintenance = useMemo(() => {
    if (!isMaintenanceEnabled) return false;
    if (isAdmin) return false;
    // allow admin panel routes if any (frontend doesn't have them, but keep safe)
    if (location.pathname.startsWith("/admin")) return false;
    return true;
  }, [isMaintenanceEnabled, isAdmin, location.pathname]);

  const shouldHideFooter = useMemo(() => {
    // Chỉ ẩn footer ở trang chi tiết tour: /tours/:slug
    return /^\/tours\/[^/]+$/.test(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    applySiteBrandingIcons(resolveSiteLogoSrc(siteConfig?.logoUrl));
  }, [siteConfig?.logoUrl]);

  return (
    <div className="flex min-h-screen flex-col">
      <ToastContainer
        theme="dark"
        position="bottom-right"
        autoClose={2800}
        pauseOnHover
        limit={4}
        newestOnTop
      />
      {shouldShowMaintenance ? null : (
        <>
          <Navbar />
          <ScrollToTop />
          {isHome ? <HomeFloatingDock /> : <ChatWidget />}
        </>
      )}

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Suspense fallback={<PageFallback />}>
          {shouldShowMaintenance ? (
            <Maintenance maintenance={maintenance} />
          ) : (
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tour />} />
            <Route path="/tours/search" element={<SearchResultList />} />
            <Route path="/about" element={<About />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogDetail />} />
            {/* Legacy route: redirect /blog/:id -> /blogs/<slug>-<id> */}
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/tours/:slug" element={<TourDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/my-booking" element={<MyBooking />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-return" element={<PaymentReturn />} />
            <Route path="/privileges" element={<Privileges />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/disaster-map" element={<DisasterMap />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/my-collection" element={<MyCollection />} />
            <Route path="/diaries" element={<Diaries />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </Suspense>
      </main>
      {shouldShowMaintenance || shouldHideFooter ? null : <Footer />}
    </div>
  );
};

export default App;
