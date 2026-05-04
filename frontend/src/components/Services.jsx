import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const SLIDES = [
  {
    src: "/home-slides/slide-1.png",
    alt: "Khám phá Vịnh Hạ Long — VietNam Travel",
  },
  {
    src: "/home-slides/slide-2.png",
    alt: "Việt Nam — Hội An, biển và hành trình của bạn",
  },
  {
    src: "/home-slides/slide-3.png",
    alt: "Du lịch Việt Nam — ưu đãi và hành trình trọn vẹn",
  },
];

const Services = () => {
  const swiperRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <>
      <style>{`
        @keyframes homeShowcaseKen {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
        .home-showcase-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: rgba(255,255,255,0.45);
          opacity: 1;
          transition: transform 0.25s ease, background 0.25s ease;
        }
        .home-showcase-swiper .swiper-pagination-bullet-active {
          background: #3b82f6;
          transform: scale(1.25);
        }
        .dark .home-showcase-swiper .swiper-pagination-bullet-active {
          background: #60a5fa;
        }
        .home-showcase-swiper .swiper-slide-active .home-showcase-slide-img {
          animation: homeShowcaseKen 12s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .home-showcase-swiper .swiper-slide-active .home-showcase-slide-img {
            animation: none;
          }
        }
      `}</style>
      <section
        className="w-full max-w-[min(100%,1320px)] mx-auto my-16 md:my-24 px-4 sm:px-6 lg:px-12"
        aria-label="Hình ảnh nổi bật VietNam Travel"
      >
        <div className="relative group rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 dark:shadow-black/40 ring-1 ring-slate-200/80 dark:ring-slate-700/80">
          <Swiper
            className="home-showcase-swiper aspect-video min-h-[200px] max-h-[min(48vh,380px)] bg-slate-900 sm:max-h-[min(56vh,480px)] md:aspect-[21/9] md:max-h-[min(64vh,520px)] lg:max-h-[min(72vh,560px)]"
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            speed={reduceMotion ? 280 : 1400}
            loop
            autoplay={
              reduceMotion
                ? false
                : {
                    delay: 5500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
            }
            pagination={{ clickable: true, dynamicBullets: true }}
            onSwiper={(instance) => {
              swiperRef.current = instance;
            }}
          >
            {SLIDES.map((slide, index) => (
              <SwiperSlide key={slide.src} className="!flex">
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="home-showcase-slide-img absolute inset-0 w-full h-full object-cover object-center"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : undefined}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
                    aria-hidden
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg opacity-90 transition-opacity duration-300 hover:bg-white hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:left-5 md:opacity-0 md:group-hover:opacity-100 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Ảnh trước"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg opacity-90 transition-opacity duration-300 hover:bg-white hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:right-5 md:opacity-0 md:group-hover:opacity-100 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-label="Ảnh sau"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>
      </section>
    </>
  );
};

export default Services;
