import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Bắt buộc phải có dòng này để bản đồ không bị vỡ layout
import "leaflet/dist/leaflet.css";

// Fix lỗi Marker không hiển thị icon trong React
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Helper component để di chuyển bản đồ khi tọa độ thay đổi
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lon], 13);
    }
  }, [coords, map]);
  return null;
};

const TourMap = ({ coords, title }) => {
  // Tọa độ mặc định (TP.HCM) trong khi chờ API
  const defaultCenter = [10.762622, 106.660172];

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
      <h3 className="text-xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
        <MapPin className="text-orange-500" size={24} />
        Vị trí trên bản đồ
        <span className="text-slate-400 text-sm font-medium uppercase ml-2">
          | {title}
        </span>
      </h3>

      {/* Container bản đồ dùng Tailwind để chỉnh bo góc và chiều cao */}
      <div className="h-[400px] w-full rounded-[1.5rem] overflow-hidden border-4 border-slate-50 relative z-0">
        <MapContainer
          center={coords ? [coords.lat, coords.lon] : defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full" // Tailwind class để chiếm hết khung
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {coords && (
            <>
              <RecenterMap coords={coords} />
              <Marker position={[coords.lat, coords.lon]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-[#1e3a8a] m-0">{title}</p>
                    <p className="text-[10px] text-slate-500 m-0">
                      Điểm đến của bạn
                    </p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default TourMap;
