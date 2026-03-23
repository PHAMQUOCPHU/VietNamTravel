import React from "react";
import ServiceCard from "./ServiceCard";
import { Hotel, Plane, Pyramid } from "lucide-react";

const services = [
  {
    // Đã đổi lại icon Plane cho đúng với Đặt vé máy bay
    icon: <Plane className="text-blue-500 w-8 h-8" />, 
    title: "Đặt vé máy bay",
    desc: "Dễ dàng đặt vé đến điểm đến mơ ước. Nền tảng của chúng tôi luôn cung cấp giá cạnh tranh và nhiều lựa chọn linh hoạt.",
  },
  {
    // Đã đổi lại icon Hotel cho đúng với Đặt phòng khách sạn
    icon: <Hotel className="text-blue-500 w-8 h-8" />, 
    title: "Đặt phòng khách sạn",
    desc: "Tìm và đặt những khách sạn tốt nhất. Từ chỗ nghỉ bình dân đến nghỉ dưỡng sang trọng, chúng tôi đều có lựa chọn phù hợp.",
  },
  {
    icon: <Pyramid className="text-blue-500 w-8 h-8" />,
    title: "Tour khám phá",
    desc: "Dấn thân vào những hành trình đầy kịch tính tại các điểm đến mới lạ. Lựa chọn hoàn hảo cho những người yêu thiên nhiên và cảm giác mạnh.",
  },
];

const ServiceList = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((item, index) => (
        <ServiceCard item={item} key={index} />
      ))}
    </div>
  );
};

export default ServiceList;
