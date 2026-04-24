import {
  AirVent,
  BadgePercent,
  Bus,
  GlassWater,
  HandCoins,
  Plug,
  Ticket,
  Users,
  UtensilsCrossed,
  Wallet,
  Wifi,
} from "lucide-react";

export const TOUR_AMENITIES = [
  { Icon: Plug, label: "Sạc điện thoại" },
  { Icon: Wifi, label: "Wifi" },
  { Icon: GlassWater, label: "Nước uống" },
  { Icon: AirVent, label: "Điều hòa" },
];

export const TOUR_INCLUSIONS = [
  { Icon: Bus, text: "Xe đưa đón đời mới." },
  { Icon: Ticket, text: "Vé vào cổng các điểm tham quan (nếu có)." },
  { Icon: UtensilsCrossed, text: "Bữa ăn theo chương trình." },
  { Icon: Users, text: "Hướng dẫn viên vui tính, nhiệt tình." },
];

export const TOUR_EXCLUSIONS = [
  { Icon: Wallet, text: "Chi phí cá nhân (giặt ủi, điện thoại)." },
  { Icon: HandCoins, text: "Tiền tip cho hướng dẫn viên (nếu có)." },
  { Icon: BadgePercent, text: "Thuế VAT." },
];
