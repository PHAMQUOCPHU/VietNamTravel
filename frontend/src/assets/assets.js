import facebook_icon from "./facebook_icon.svg";
import instagram_icon from "./instagram_icon.svg";
import twitter_icon from "./twitter_icon.svg";
import earth from "./earth.png";
import headerimg from "./headerimg.png";

import { Compass, MapPin, UsersRound, Wallet } from "lucide-react";
import user from "./profile_icon.png";

export const assets = {
  facebook_icon,
  instagram_icon,
  twitter_icon,
  earth,
  headerimg,
  user,
};

export const stepsData = [
  {
    title: "Địa điểm",
    description: "Bạn dự định đi đâu? Chúng tôi sẽ tìm điểm đến hoàn hảo cho chuyến đi của bạn.",
    icon: MapPin,
  },
  {
    title: "Khoảng cách",
    description: "Khoảng cách từ vị trí của bạn. Chọn phạm vi phù hợp nhất cho lộ trình.",
    icon: Compass,
  },
  {
    title: "Số lượng người",
    description: "Số người tối đa. Chọn số lượng thành viên tham gia chuyến đi của bạn.",
    icon: UsersRound,
  },
  {
    title: "Ngân sách",
    description: "Lựa chọn mức giá phù hợp để chúng tôi đề xuất các tour vừa túi tiền nhất.",
    icon: Wallet,
  },
];
