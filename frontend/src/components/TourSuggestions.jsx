import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { buildTourSlug } from "../lib/tourSlug";
 
const normalizeCityKey = (value) => {
  const s = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
  if (!s) return "";
 
  // Một vài alias hay gặp: tphcm / tp hcm / hồ chí minh
  if (/(^|\s)(tp|thanh pho)\s*hcm(\s|$)/i.test(s)) return "tp hcm";
  if (s.includes("hồ chí minh") || s.includes("ho chi minh")) return "tp hcm";
  if (s.includes("tphcm")) return "tp hcm";
  return s;
};
 
const resolveTourImage = (tour) => {
  const cover = tour?.images?.[0] || tour?.image || "";
  const s = String(cover || "").trim();
  if (!s) return "https://via.placeholder.com/500x350?text=VietNam+Travel";
  if (s.startsWith("http") || s.includes("data:image")) return s;
  return "https://via.placeholder.com/500x350?text=VietNam+Travel";
};
 
export default function TourSuggestions({ tours, currentTour, maxItems = 8 }) {
  const city = currentTour?.city || "";
  const cityKey = useMemo(() => normalizeCityKey(city), [city]);
  const currentId = currentTour?._id != null ? String(currentTour._id) : "";
 
  const items = useMemo(() => {
    const list = Array.isArray(tours) ? tours : [];
    if (!cityKey) return [];
    return list
      .filter((t) => {
        if (!t) return false;
        const tid = t._id != null ? String(t._id) : "";
        if (currentId && tid === currentId) return false;
        return normalizeCityKey(t.city) === cityKey;
      })
      .slice(0, Math.max(0, Number(maxItems) || 0));
  }, [tours, cityKey, currentId, maxItems]);
 
  if (!items.length) return null;
 
  return (
    <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative px-6 py-6 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">
              Gợi ý tour gần đây
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Cùng khu vực <span className="text-blue-700">{city}</span>
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Có thể bạn sẽ thích các tour tương tự trong khu vực này.
            </p>
          </div>
        </div>
      </div>
 
      <div className="px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="flex snap-x snap-mandatory gap-4 pb-2">
            {items.map((t) => {
              const href = `/tours/${buildTourSlug(t)}`;
              const price = Number(t.salePrice ?? t.price ?? 0);
              return (
                <Link
                  key={t._id || href}
                  to={href}
                  className="group snap-start"
                  aria-label={`Xem tour: ${t.title || "Tour"}`}
                >
                  <article className="w-[16.5rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-[18rem]">
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                      <img
                        src={resolveTourImage(t)}
                        alt={t.title || "Tour"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/500x350?text=VietNam+Travel";
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        <span className="max-w-[10rem] truncate">
                          {t.city || city}
                        </span>
                      </div>
                    </div>
 
                    <div className="p-4">
                      <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900">
                        {t.title || "Tour du lịch"}
                      </h4>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-[#1e3a8a] tabular-nums">
                          {price.toLocaleString("vi-VN")} đ
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-700">
                          Xem
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

