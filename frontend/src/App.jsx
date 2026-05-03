import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScrollToTop from "./components/ScrollToTop";
import ChatWidget from "./components/ChatWidget";
import HomeFloatingDock from "./components/HomeFloatingDock";

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

function PageFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] w-full flex-1 items-center justify-center text-neutral-500"
    >
      Đang tải…
    </div>
  );
}

const App = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      <ToastContainer theme="dark" position="bottom-right" autoClose={1000} />
      <Navbar />
      <ScrollToTop />

      {isHome ? <HomeFloatingDock /> : <ChatWidget />}

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<Tour />} />
            <Route path="/tours/search" element={<SearchResultList />} />
            <Route path="/about" element={<About />} />
            <Route path="/blogs" element={<Blogs />} />
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
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default App;
