import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fallbackImage = "https://via.placeholder.com/1200x800?text=VietNam+Travel";

const injectCloudinaryTransform = (url, width) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  // Chèn transform sau /upload/ nếu URL chưa có transform theo width này
  if (url.includes(`/upload/w_${width},`)) return url;
  return url.replace("/upload/", `/upload/w_${width},c_fill,q_auto,f_auto,dpr_auto/`);
};

const resolveImageUrl = (image, backendUrl, width = 1200) => {
  if (!image) return fallbackImage;
  if (image.startsWith("http") || image.includes("data:image")) {
    return injectCloudinaryTransform(image, width);
  }
  const localUrl = `${backendUrl.trim().replace(/\/+$/, "")}/uploads/${image}`;
  return localUrl;
};

const TourCardStackGallery = ({ images = [], title = "", backendUrl = "" }) => {
  const normalizedImages = useMemo(() => {
    const list = Array.isArray(images) ? images : [];
    const unique = [...new Set(list.filter(Boolean))];
    if (!unique.length) return [fallbackImage];
    return unique.slice(0, 3);
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const primaryImage = normalizedImages[activeIndex] || normalizedImages[0];
  const sideImages = normalizedImages
    .map((img, idx) => ({ img, idx }))
    .filter((item) => item.idx !== activeIndex)
    .slice(0, 2);

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-2xl border border-white/70">
      <AnimatePresence mode="wait">
        <motion.img
          key={primaryImage}
          src={resolveImageUrl(primaryImage, backendUrl, 1200)}
          alt={title}
          initial={{ opacity: 0.65, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0.65, x: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full h-full object-cover object-center"
          style={{ imageRendering: "auto" }}
        />
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />

      {sideImages.length > 0 && (
        <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 md:gap-4">
        {sideImages.map((item, order) => (
          <motion.button
            key={item.idx}
            type="button"
            onClick={() => setActiveIndex(item.idx)}
            initial={{ opacity: 0.85, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: order * 0.06, ease: "easeInOut" }}
            whileHover={{ x: -6, rotate: 0 }}
            className={`relative w-[92px] h-[68px] md:w-[150px] md:h-[104px] rounded-2xl overflow-hidden border-2 border-white/90 shadow-xl transition-all duration-500 ease-in-out ${
              order === 0 ? "rotate-[-3deg] z-20" : "rotate-[4deg] z-10 -mt-5"
            }`}
          >
            <img
              src={resolveImageUrl(item.img, backendUrl, 400)}
              alt={`${title}-sub-${order + 1}`}
              className="w-full h-full object-cover"
              style={{ imageRendering: "auto" }}
            />
            <div className="absolute inset-0 bg-black/5" />
          </motion.button>
        ))}
        </div>
      )}
    </div>
  );
};

export default TourCardStackGallery;
