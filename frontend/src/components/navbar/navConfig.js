import { Crown, Gem, Star } from "lucide-react";

export const DEFAULT_USER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%234F46E5'/%3E%3Cpath d='M20 22c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm0 2c-4.418 0-14 2.209-14 7v3h28v-3c0-4.791-9.582-7-14-7z' fill='white'/%3E%3C/svg%3E";

export const getDisplayRank = (totalSpent) => {
  if (totalSpent >= 30000000) return "Kim cương";
  if (totalSpent >= 10000000) return "Vàng";
  return "Bạc";
};

export const getRankConfig = (rankName) => {
  switch (rankName) {
    case "Vàng":
      return {
        color: "text-amber-500",
        icon: Star,
        iconClassName: "fill-amber-500",
      };
    case "Kim cương":
      return {
        color: "text-cyan-500",
        icon: Gem,
        iconClassName: "fill-cyan-500",
      };
    default:
      return {
        color: "text-slate-400",
        icon: Crown,
        iconClassName: "fill-slate-400",
      };
  }
};

export const buildNavLinks = (user) => [
  { to: "/", label: "Home", id: "nav-home" },
  { to: "/about", label: "About", id: "nav-about" },
  { to: "/blogs", label: "Blogs", id: "nav-blogs" },
  { to: "/tours", label: "Tours", id: "nav-tours" },
  ...(user ? [{ to: "/my-booking", label: "My Bookings", id: "nav-bookings" }] : []),
];
