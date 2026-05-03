import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Heart } from "lucide-react";
import TourCard from "../components/TourCard";

const Favorites = () => {
  const { user, tours } = useContext(AppContext);
  const navigate = useNavigate();

  const favoriteTours = useMemo(
    () =>
      tours.filter((tour) => {
        const tid = tour?._id != null ? String(tour._id) : "";
        if (!tid) return false;
        return user?.favorites?.some((fav) => {
          const fid = fav?._id != null ? String(fav._id) : String(fav);
          return fid === tid;
        });
      }),
    [tours, user],
  );

  return (
    <div className="max-w-6xl mx-auto my-10 p-4 animate-in fade-in duration-500">
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <Heart size={28} className="fill-white" />
          Tour Yêu thích
        </h1>
        <p className="text-blue-100 mt-2 font-medium">
          Tất cả hành trình bạn đã đánh dấu để xem lại nhanh hơn.
        </p>
      </div>

      <div className="mt-8">
        {favoriteTours.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteTours.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
            <Heart className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-medium">
              Ban chua luu tour nao vao danh sach yeu thich.
            </p>
            <button
              onClick={() => navigate("/tours")}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Kham pha cac tour ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
