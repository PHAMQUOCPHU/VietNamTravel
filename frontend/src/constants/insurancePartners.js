import { insuranceImages } from "../assets";

/** Bốn đối tác bảo hiểm — dùng chung About & Footer */
export const INSURANCE_PARTNERS = [
  {
    name: "Bảo Việt Life",
    website: "https://www.baovietlife.com.vn/",
    tagline: "Thương hiệu nhân thọ bản địa uy tín",
    image: insuranceImages.baovietlife,
    accent: "from-emerald-600/15 via-white to-sky-500/10",
    ring: "ring-emerald-500/40",
    benefits: [
      "Gói du lịch & tai nạn linh hoạt",
      "Mạng lưới hỗ trợ trong nước rộng",
      "Quy trình hồ sơ quen thuộc",
    ],
  },
  {
    name: "Manulife Vietnam",
    website: "https://www.manulife.com.vn/vi.html",
    tagline: "Kinh nghiệm quốc tế, tư vấn chuyên sâu",
    image: insuranceImages.manulife,
    accent: "from-green-600/12 via-white to-emerald-400/10",
    ring: "ring-green-600/35",
    benefits: [
      "Ưu tiên quyền lợi y tế & an toàn",
      "Đồng hành tour dài ngày",
      "Hotline hỗ trợ rõ ràng",
    ],
  },
  {
    name: "Dai-ichi Life Việt Nam",
    website: "https://dai-ichi-life.com.vn/",
    tagline: "Ổn định & minh bạch theo hành trình",
    image: insuranceImages.daichilife,
    accent: "from-red-500/10 via-white to-rose-400/8",
    ring: "ring-rose-500/35",
    benefits: [
      "Bảo vệ gia đình đi cùng",
      "Lựa chọn hạn mức theo nhu cầu",
      "Tư vấn cá nhân hóa",
    ],
  },
  {
    name: "Prudential Vietnam",
    website: "https://www.prudential.com.vn/",
    tagline: "Giải pháp tài chính & bảo vệ toàn diện",
    image: insuranceImages.prudential,
    accent: "from-blue-700/12 via-white to-indigo-500/10",
    ring: "ring-blue-600/40",
    benefits: [
      "Gói kết hợp nhiều rủi ro du lịch",
      "Hỗ trợ tài chính khi sự cố",
      "Thương hiệu quen thuộc tại VN",
    ],
  },
];
