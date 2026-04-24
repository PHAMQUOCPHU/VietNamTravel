import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Route, Routes, useLocation } from "react-router-dom";
import Tour from "./pages/Tour";
import TourDetails from "./pages/TourDetails";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Booking from "./pages/Booking";
import Invoice from "./pages/Invoice";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import ScrollToTop from "./components/ScrollToTop";
import MyBooking from "./pages/MyBooking";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import PaymentPage from "./pages/PaymentPage";
import PaymentReturn from "./components/PaymentReturn";
import Privileges from "./pages/Privileges";
import MyCollection from "./pages/MyCollection"; // Giả sử sếp để trong folder pages
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";

// --- BƯỚC 1: IMPORT CHAT WIDGET ---
import ChatWidget from "./components/ChatWidget";
import HomeFloatingDock from "./components/HomeFloatingDock";

import SearchResultList from "./pages/SearchResultList";

const App = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer theme="dark" position="bottom-right" autoClose={1000} />
      <Navbar />
      <ScrollToTop />

      {isHome ? <HomeFloatingDock /> : <ChatWidget />}

      <main className="flex-1">
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
          <Route path="/my-collection" element={<MyCollection />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
