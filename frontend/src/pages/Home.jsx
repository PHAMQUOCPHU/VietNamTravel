import React from "react";
import Header from "../components/Header";
import AdvancedSearch from "../components/AdvancedSearch";
import Services from "../components/Services";
import AllTours from "../components/AllTours";
import TravelLog from "../components/TravelLog";
import FoodSlide from "../components/FoodSlide";
import Experience from "../components/Experience";
import NewsLetterBox from "../components/NewsLetterBox";

const Home = () => {
  return (
    <div className="relative bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* 1. Phần Header (Hero Section) */}
      <div id="step-header-container">
        <Header />
      </div>

      {/* Tìm kiếm nâng cao — đè một phần lên Hero */}
      <div id="step-search" className="relative z-30">
        <AdvancedSearch />
      </div>

      <div className="mt-12 sm:mt-16 md:mt-20">
        {" "}
        {/* Khoảng cách để các phần dưới không bị dính vào thanh search */}
        <Services />
      </div>

      {/* 3. Phần danh sách Tours */}
      <div id="step-tours">
        <AllTours />
      </div>

      <TravelLog />
      <FoodSlide />
      <Experience />
      <NewsLetterBox />
    </div>
  );
};

export default Home;
