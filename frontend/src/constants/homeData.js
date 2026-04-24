import { Compass, MapPin, UsersRound, Wallet } from "lucide-react";
import { assets } from "../assets";

export const stepsData = [
  {
    title: "Địa điểm",
    description:
      "Bạn dự định đi đâu? Chúng tôi sẽ tìm điểm đến hoàn hảo cho chuyến đi của bạn.",
    icon: MapPin,
  },
  {
    title: "Khoảng cách",
    description:
      "Khoảng cách từ vị trí của bạn. Chọn phạm vi phù hợp nhất cho lộ trình.",
    icon: Compass,
  },
  {
    title: "Số lượng người",
    description:
      "Số người tối đa. Chọn số lượng thành viên tham gia chuyến đi của bạn.",
    icon: UsersRound,
  },
  {
    title: "Ngân sách",
    description:
      "Lựa chọn mức giá phù hợp để chúng tôi đề xuất các tour vừa túi tiền nhất.",
    icon: Wallet,
  },
];

export const blogs = [
  {
    id: 1,
    title: "Hành trình tìm về biển vắng",
    desc: "Khám phá những bãi biển hoang sơ ít người biết tại Phú Yên. Nơi tiếng sóng vỗ rì rào hòa cùng nắng vàng rực rỡ.",
    img: assets.blog1,
    date: "20 Mar 2026",
  },
  {
    id: 2,
    title: "Sapa - Thành phố trong sương",
    desc: "Trải nghiệm văn hóa bản địa đặc sắc và những cung đường trekking hùng vĩ qua những thửa ruộng bậc thang.",
    img: assets.blog2,
    date: "22 Mar 2026",
  },
  {
    id: 3,
    title: "Ẩm thực đường phố Hội An",
    desc: "Top 10 món ăn nhất định phải thử khi ghé thăm phố cổ: Cao lầu, bánh mì Phượng và chè bắp ven sông.",
    img: assets.blog3,
    date: "25 Mar 2026",
  },
];

export const resorts = [assets.resort1, assets.resort2, assets.resort3];

export const foodServices = [
  {
    id: 1,
    name: "Tinh Hoa Quốc Hồn",
    tag: "KÝ ỨC TRUYỀN THỐNG",
    desc: "Hương vị nồng nàn của nước dùng truyền thống, gói trọn tâm hồn người Việt qua bao thế hệ.",
    img: assets.food1,
  },
  {
    id: 2,
    name: "Hương Vị Đường Phố",
    tag: "TINH HOA VIỆT",
    desc: "Sự giao thoa hoàn hảo giữa lớp vỏ giòn tan và tinh túy nhân truyền thống đậm đà bản sắc.",
    img: assets.food2,
  },
  {
    id: 3,
    name: "Phong Vị Hà Thành",
    tag: "DI SẢN ẨM THỰC",
    desc: "Thưởng thức nghệ thuật nướng than hồng nguyên bản, đánh thức mọi giác quan từ những điều bình dị nhất.",
    img: assets.food3,
  },
];
