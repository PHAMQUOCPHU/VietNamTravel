import React, { useState } from "react";
import { toast } from "react-toastify";
import { buildHttpClient } from "../services/httpClient";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Building2,
  Stethoscope,
  BadgeCheck,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { BACKEND_URL } from "../config/env";
import { INSURANCE_PARTNERS } from "../constants/insurancePartners";
import contactShowreel from "../assets/Agent_video_Pippit_20260504145346.mp4";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const partners = INSURANCE_PARTNERS;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const popIn = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const trustChips = [
  { icon: CheckCircle2, text: "Phản hồi trong ngày làm việc" },
  { icon: CheckCircle2, text: "Tư vấn tour & hỗ trợ đặt chỗ" },
  { icon: CheckCircle2, text: "Kết nối đối tác bảo hiểm uy tín" },
];

const OFFICE = {
  lat: 10.82285,
  lng: 106.68835,
  shortAddress: "12 Nguyễn Văn Bảo, P.1, Gò Vấp, TP.HCM",
  mapsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=12%20Nguy%E1%BB%85n%20V%C4%83n%20B%E1%BA%A3o%2C%20G%C3%B2%20V%E1%BA%A5p%2C%20TP.HCM",
  phone: "0905 713 702",
  phoneHref: "tel:+84905713702",
  email: "phamquocphu@gmail.com",
  hours: "T2 – T6: 8:30 – 17:30 · T7: 9:00 – 12:00",
};

const backendUrl = BACKEND_URL;

const insuranceFaq = [
  {
    id: "why-buy",
    q: "Vì sao nên mua bảo hiểm du lịch khi đặt tour?",
    a: "Bảo hiểm du lịch giúp bạn giảm áp lực tài chính khi gặp rủi ro bất ngờ: tai nạn, ốm đau cần khám chữa, trễ hoặc hủy chuyến bay, thất lạc hành lý hay giấy tờ quan trọng. Nhiều gói còn hỗ trợ chi phí y tế khẩn cấp, sơ tán hoặc nằm viện tạm thời ở nước ngoài — những khoản tự chi trả có thể rất lớn so với giá tour. Với tour quốc tế, một số quốc gia hoặc đại sứ quán còn yêu cầu chứng minh bảo hiểm khi xin visa; vì vậy mua sớm cùng lúc đặt tour giúp bạn chủ động hồ sơ và yên tâm tập trung trải nghiệm.",
  },
  {
    id: "incident",
    q: "Nếu xảy ra sự cố trong chuyến đi thì xử lý như thế nào?",
    a: "Hãy giữ bình tĩnh, đảm bảo an toàn cá nhân trước, sau đó liên hệ ngay hotline 24/7 của VietNam Travel hoặc đường dây nóng trên giấy chứng nhận bảo hiểm (ví dụ Bảo Việt, Dai-ichi Life Việt Nam) để được hướng dẫn cụ thể theo từng tình huống. Khi có thể, lưu hóa đơn, biên lai viện phí, biên bản hãng bay hoặc báo cáo của cơ quan chức năng — đây là căn cứ quan trọng khi làm hồ sơ bồi thường. Đội ngũ VietNam Travel có thể giúp bạn nắm các bước khai báo ban đầu và liên hệ đối tác bảo hiểm; quyền lợi cuối cùng vẫn theo điều khoản gói bạn đã chọn và quy định của nhà bảo hiểm.",
  },
  {
    id: "mandatory",
    q: "Bảo hiểm du lịch có bắt buộc không?",
    a: "Với phần lớn tour trong nước, bảo hiểm thường không bắt buộc nhưng được khuyến khích mạnh vì chi phí thấp so với rủi ro có thể gặp (trễ chuyến, hủy chỗ, sự cố trên đường đi). Riêng tour quốc tế, nhiều nước yêu cầu du khách có bảo hiểm y tế hoặc bảo hiểm du lịch đủ hạn mức mới cấp visa hoặc nhập cảnh; một số tuyến leo núi, lặn biển hay hoạt động mạo hiểm cũng có thể được nhà tổ chức tour khuyến nghị hoặc yêu cầu kèm theo. Bạn nên đọc kỹ điều kiện tour và hỏi tư vấn viên để chọn gói phù hợp với lịch trình và yêu cầu pháp lý từng điểm đến.",
  },
  {
    id: "cost",
    q: "Chi phí bảo hiểm có đắt không?",
    a: "Nhìn chung, phí bảo hiểm du lịch chỉ là một phần nhỏ so với tổng chi phí chuyến đi — thường rơi vào khoảng vài phần trăm giá tour, tùy độ dài hành trình, vùng đến và mức bảo vệ bạn chọn (ví dụ hạn mức y tế cao hơn thì phí cao hơn một chút). So với việc phải tự trả toàn bộ viện phí hay vé máy bay thay thế khi có sự cố, đây là khoản đầu tư hợp lý cho sự an tâm. Bạn có thể so sánh vài gói song song, chú ý phần loại trừ trách nhiệm và điều kiện đồng bảo để chọn mức vừa túi tiền vừa đủ bảo vệ cho cả nhóm đi cùng.",
  },
  {
    id: "buy-after",
    q: "Tôi có thể mua bảo hiểm sau khi đã đặt tour không?",
    a: "Trong nhiều trường hợp, bạn vẫn có thể mua hoặc gia hạn bảo hiểm sau khi đã đặt tour, miễn là trong thời hạn cho phép của nhà bảo hiểm và trước ngày khởi hành (một số gói có điểm bắt đầu bảo hiểm cố định theo ngày xuất phát). Tuy nhiên, mua càng sớm càng tốt: nhiều quyền lợi liên quan hủy chuyến, hoãn bay hoặc bệnh nền chỉ áp dụng nếu bạn tham gia bảo hiểm khi chưa phát sinh sự kiện bảo hiểm. Nên xác nhận rõ ngày hiệu lực, địa lý được bảo vệ và các hoạt động đặc biệt trong tour có nằm trong phạm vi hay không để tránh hiểu nhầm khi cần dùng đến bảo hiểm.",
  },
];

const contactCards = [
  {
    key: "addr",
    icon: MapPin,
    label: "Trụ sở & showroom",
    value: OFFICE.shortAddress,
    href: OFFICE.mapsUrl,
    external: true,
    accent: "from-sky-500/10 to-blue-600/5",
  },
  {
    key: "phone",
    icon: Phone,
    label: "Hotline",
    value: OFFICE.phone,
    href: OFFICE.phoneHref,
    external: false,
    accent: "from-emerald-500/10 to-teal-600/5",
  },
  {
    key: "mail",
    icon: Mail,
    label: "Email",
    value: OFFICE.email,
    href: `mailto:${OFFICE.email}`,
    external: false,
    accent: "from-violet-500/10 to-indigo-600/5",
  },
  {
    key: "hours",
    icon: Clock,
    label: "Giờ làm việc",
    value: OFFICE.hours,
    href: null,
    external: false,
    accent: "from-amber-500/10 to-orange-600/5",
  },
];

const About = () => {
  const [openFaqId, setOpenFaqId] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [leadForm, setLeadForm] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [insuranceConsent, setInsuranceConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const consultCount = (() => {
    try {
      const raw = localStorage.getItem("insurance-leads");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  })();

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!leadForm.fullName.trim() || !leadForm.phone.trim() || !selectedPartner)
      return;
    if (!insuranceConsent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);

    const payload = {
      fullName: leadForm.fullName.trim(),
      phone: leadForm.phone.trim(),
      email: leadForm.email.trim(),
      partner: selectedPartner,
      consentShareForInsuranceAdvice: true,
      source: "about-page-insurance",
    };

    const payloadLocal = {
      ...payload,
      createdAt: new Date().toISOString(),
    };

    setLeadSubmitting(true);
    try {
      const client = buildHttpClient(backendUrl);
      const { data } = await client.post("/api/insurance-leads", payload);

      if (!data.success) {
        toast.error(data.message || "Không gửi được yêu cầu.");
        return;
      }

      try {
        const raw = localStorage.getItem("insurance-leads");
        const parsed = raw ? JSON.parse(raw) : [];
        const leads = Array.isArray(parsed) ? parsed : [];
        leads.push(payloadLocal);
        localStorage.setItem("insurance-leads", JSON.stringify(leads));
      } catch {
        localStorage.setItem("insurance-leads", JSON.stringify([payloadLocal]));
      }

      window.dispatchEvent(
        new CustomEvent("insurance-lead-created", {
          detail: payloadLocal,
        }),
      );

      toast.success("Đã gửi yêu cầu thành công.");
      setSubmitted(true);
      setLeadForm({ fullName: "", phone: "", email: "" });
      setInsuranceConsent(false);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Không kết nối được máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50/90 py-8 md:py-14 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(148_163_184/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.06)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] dark:bg-[linear-gradient(to_right,rgb(51_65_85/0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgb(51_65_85/0.35)_1px,transparent_1px)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-600/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-500/10"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white/90 shadow-[0_28px_80px_-20px_rgba(30,58,138,0.18),0_0_0_1px_rgba(255,255,255,0.6)_inset] ring-1 ring-slate-200/60 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-[0_28px_80px_-24px_rgba(0,0,0,0.55)] dark:ring-slate-700/50"
        >
          <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-10 text-white md:px-10 md:py-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-sky-100 shadow-lg shadow-blue-900/20 backdrop-blur-md">
                <Sparkles
                  className="h-3.5 w-3.5 text-amber-300"
                  strokeWidth={2.4}
                  aria-hidden
                />
                Giới thiệu & liên hệ
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight md:text-5xl">
                <span className="bg-gradient-to-r from-white via-sky-100 to-cyan-100 bg-clip-text text-transparent">
                  VietNam Travel
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300/95 md:text-base md:leading-relaxed">
                Nền tảng đặt tour và trải nghiệm du lịch trong nước. Chúng tôi
                đồng hành chọn hành trình phù hợp, thanh toán minh bạch và kết
                nối dịch vụ giá trị gia tăng — gồm tư vấn bảo hiểm cùng các đối
                tác nhân thọ hàng đầu.
              </p>

              <ul className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                {trustChips.map(({ icon: ChipIcon, text }) => (
                  <li
                    key={text}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 shadow-inner backdrop-blur-sm md:text-[13px]"
                  >
                    <ChipIcon
                      className="h-4 w-4 shrink-0 text-emerald-400"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <div className="space-y-7 border-slate-100 bg-gradient-to-b from-white to-slate-50/90 p-6 md:p-9 lg:border-r dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950/80">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-600/90 dark:text-sky-400/90">
                    Contact
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white md:text-2xl">
                    Thông tin liên hệ
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Gọi hotline, gửi email hoặc ghé văn phòng — đội ngũ sẽ hỗ
                    trợ tour, hợp tác và các vấn đề sau đặt chỗ.
                  </p>
                </div>
              </div>

              <motion.div
                className="grid gap-3 sm:grid-cols-2"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {contactCards.map((card) => {
                  const Icon = card.icon;
                  const inner = (
                    <motion.div
                      variants={popIn}
                      whileHover={{
                        y: -5,
                        transition: {
                          type: "spring",
                          stiffness: 420,
                          damping: 22,
                        },
                      }}
                      whileTap={{ scale: 0.99 }}
                      className={`group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-gradient-to-br p-[1.125rem] shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] transition-[box-shadow,border-color] duration-300 hover:border-blue-300/80 hover:shadow-[0_20px_44px_-16px_rgba(37,99,235,0.22)] dark:border-slate-600/90 dark:shadow-none dark:hover:border-sky-500/40 ${card.accent} ${card.href ? "cursor-pointer" : ""}`}
                    >
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-slate-50 text-blue-600 shadow-md ring-1 ring-slate-200/80 transition group-hover:ring-blue-200/80 dark:from-slate-800 dark:to-slate-900 dark:text-sky-400 dark:ring-slate-600">
                        <Icon size={21} strokeWidth={2.2} aria-hidden />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {card.label}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
                        {card.value}
                      </p>
                      {card.href && (
                        <span className="mt-auto pt-4 text-xs font-bold text-blue-600 transition group-hover:translate-x-0.5 dark:text-sky-400">
                          {card.external ? "Mở bản đồ →" : "Nhấn để liên hệ →"}
                        </span>
                      )}
                    </motion.div>
                  );

                  return card.href ? (
                    <a
                      key={card.key}
                      href={card.href}
                      target={card.external ? "_blank" : undefined}
                      rel={card.external ? "noopener noreferrer" : undefined}
                      className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={card.key}>{inner}</div>
                  );
                })}
              </motion.div>

              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-4 py-3.5 text-xs leading-relaxed text-slate-600 shadow-inner dark:border-slate-700 dark:from-slate-800/60 dark:to-slate-900/40 dark:text-slate-400">
                <strong className="font-extrabold text-slate-800 dark:text-slate-200">
                  Ghi chú:
                </strong>{" "}
                Hotline có thể bận trong giờ cao điểm — gửi email kèm số điện
                thoại, chúng tôi phản hồi trong{" "}
                <span className="font-semibold text-blue-700 dark:text-sky-300">
                  một ngày làm việc
                </span>
                .
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-b from-slate-100/90 to-slate-200/50 dark:from-slate-950 dark:to-slate-900/90">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/40 px-5 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
                      Bản đồ văn phòng
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Trực quan
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">
                    OpenStreetMap · Gò Vấp, TP.HCM
                  </p>
                </div>
                <a
                  href={OFFICE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full border border-white/80 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/25 transition hover:brightness-110 active:scale-[0.98]"
                >
                  Chỉ đường
                </a>
              </div>
              <div className="relative flex flex-1 flex-col p-3 sm:p-4">
                <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] dark:ring-white/10 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] lg:min-h-[400px]">
                  <MapContainer
                    center={[OFFICE.lat, OFFICE.lng]}
                    zoom={16}
                    scrollWheelZoom={false}
                    className="absolute inset-0 z-0 h-full w-full rounded-2xl [&_.leaflet-container]:rounded-2xl"
                    style={{ minHeight: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[OFFICE.lat, OFFICE.lng]}>
                      <Popup>
                        <div className="text-sm font-semibold text-slate-900">
                          VietNam Travel
                        </div>
                        <p className="mt-1 max-w-[220px] text-xs text-slate-600">
                          {OFFICE.shortAddress}
                        </p>
                        <a
                          className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                          href={OFFICE.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Mở Google Maps →
                        </a>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  Vị trí tham chiếu — zoom & kéo trên bản đồ để xem lân cận
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          aria-label="Video giới thiệu liên hệ"
          className="mt-12 w-full"
        >
          <div className="mb-5 max-w-3xl md:mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-[1.75rem]">
              Cảm nhận không khí VietNam Travel
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
              Xem nhanh giới thiệu trước khi liên hệ hoặc tìm hiểu đối tác bảo
              hiểm phía dưới.
            </p>
          </div>

          <video
            className="mx-auto block max-h-[min(60vh,540px)] w-auto max-w-full object-contain sm:max-h-[min(66vh,620px)] md:max-h-[min(72vh,720px)]"
            src={contactShowreel}
            controls
            playsInline
            preload="none"
          >
            Trình duyệt của bạn không hỗ trợ phát video.
          </video>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mt-10 overflow-hidden rounded-[2rem] border border-blue-100/90 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/50 p-5 shadow-[0_24px_70px_-24px_rgba(37,99,235,0.18)] backdrop-blur-md dark:border-slate-700/80 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-indigo-950/40 md:p-9"
        >
          <div
            className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/90 bg-white/95 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-800 shadow-sm dark:border-blue-800/80 dark:bg-slate-800/90 dark:text-sky-300">
              <Building2
                size={14}
                className="text-blue-600 dark:text-sky-400"
              />
              Đối tác bảo hiểm chiến lược
            </span>
            <h2 className="max-w-3xl text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-[1.75rem]">
              Biến bảo hiểm thành một phần tất yếu của chuyến đi
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
              Mỗi lượt tư vấn là một tín hiệu nhu cầu thật. VietNam Travel kết
              nối trực tiếp khách hàng với đối tác bảo hiểm uy tín để tăng độ an
              tâm cho người dùng và mở rộng hệ sinh thái doanh thu dịch vụ.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => {
              const isSelected = selectedPartner === partner.name;
              return (
                <motion.article
                  key={partner.name}
                  whileHover={{
                    y: -6,
                    transition: { type: "spring", stiffness: 380, damping: 22 },
                  }}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white/95 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.15)] transition-shadow duration-300 dark:bg-slate-900/95 ${
                    isSelected
                      ? `border-blue-400/90 shadow-[0_24px_55px_-12px_rgba(29,78,216,0.35)] ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${partner.ring}`
                      : "border-slate-200/90 hover:border-blue-200/90 hover:shadow-[0_20px_50px_-20px_rgba(37,99,235,0.2)] dark:border-slate-700"
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPartner(partner.name)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        setSelectedPartner(partner.name);
                      }
                    }}
                    className="flex w-full flex-1 cursor-pointer flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                  >
                    <div
                      className={`relative flex h-36 items-center justify-center bg-gradient-to-br px-6 py-5 md:h-40 ${partner.accent}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.9),transparent_55%)] opacity-90" />
                      <div
                        className={`relative flex h-[88px] w-full max-w-[200px] items-center justify-center rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.02] ${
                          isSelected
                            ? "shadow-[0_12px_36px_rgba(29,78,216,0.15)]"
                            : ""
                        }`}
                      >
                        <img
                          src={partner.image}
                          alt={`Logo ${partner.name}`}
                          className="max-h-[52px] w-auto max-w-full object-contain object-center"
                          loading="lazy"
                        />
                      </div>
                      {isSelected && (
                        <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                          Đã chọn
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 p-4 pt-3">
                      <div>
                        <h3 className="text-[15px] font-black leading-tight text-slate-900 dark:text-white md:text-base">
                          {partner.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                          {partner.tagline}
                        </p>
                      </div>
                      <ul className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                        {partner.benefits.map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-2 text-xs font-medium leading-snug text-slate-600 dark:text-slate-400"
                          >
                            <BadgeCheck
                              size={15}
                              className={`mt-0.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`}
                              aria-hidden
                            />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600/90 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100 dark:text-blue-400">
                        Nhấn để chọn tư vấn →
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-3 pt-0 dark:border-slate-700">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/80 dark:border-blue-800 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700"
                    >
                      Xem chi tiết
                      <ExternalLink
                        size={14}
                        className="shrink-0 opacity-80"
                        aria-hidden
                      />
                    </a>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="relative mt-8 grid grid-cols-1 gap-4 overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-inner dark:border-slate-600/60 dark:from-slate-800/80 dark:to-slate-900/60 md:grid-cols-[1.5fr_1fr] md:p-6">
            <form onSubmit={handleSubmitLead} className="space-y-3">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Nhận tư vấn miễn phí - thu thập nhu cầu bảo hiểm thực tế
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={leadForm.fullName}
                  onChange={(e) =>
                    setLeadForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="Họ và tên *"
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  value={leadForm.phone}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Số điện thoại *"
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) =>
                  setLeadForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email (không bắt buộc)"
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 px-3 py-3 text-left dark:border-slate-600 dark:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={insuranceConsent}
                  onChange={(e) => {
                    setInsuranceConsent(e.target.checked);
                    if (e.target.checked) setConsentError(false);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                  Tôi đồng ý chia sẻ thông tin để nhận tư vấn bảo hiểm.
                </span>
              </label>
              {consentError && (
                <p className="text-xs font-semibold text-red-600" role="alert">
                  Vui lòng tick xác nhận để gửi yêu cầu tư vấn.
                </p>
              )}
              <button
                type="submit"
                disabled={leadSubmitting}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(29,78,216,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(29,78,216,0.42)] disabled:pointer-events-none disabled:opacity-60"
              >
                {leadSubmitting ? "Đang gửi…" : "Nhận tư vấn miễn phí"}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </form>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <div className="mb-3 inline-flex rounded-xl bg-white p-2 text-blue-700 dark:bg-slate-800 dark:text-sky-400">
                <Stethoscope size={18} />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Tư vấn được chọn:{" "}
                <span className="text-blue-700 dark:text-sky-400">
                  {selectedPartner || "Chưa chọn đối tác"}
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Tín hiệu lead hiện có: <b>{consultCount}</b> yêu cầu đã ghi nhận
                từ trang About.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Đây là điểm chạm chuyển đổi quan trọng, giúp đội ngũ xác định
                chính xác khách hàng có nhu cầu bảo hiểm thật để tư vấn cá nhân
                hóa.
              </p>
              {submitted && (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Đã gửi yêu cầu thành công. Đội ngũ tư vấn sẽ liên hệ sớm nhất.
                </p>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 rounded-[2rem] border border-slate-200/90 bg-white/85 p-5 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/80 md:p-8"
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/25">
              <HelpCircle size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600/90 dark:text-sky-400/90">
                Hỏi — đáp
              </p>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white md:text-2xl">
                FAQ bảo hiểm du lịch
              </h2>
            </div>
          </div>
          <div className="space-y-3">
            {insuranceFaq.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_8px_28px_-16px_rgba(15,23,42,0.1)] transition-all duration-300 hover:border-blue-200/80 hover:shadow-[0_14px_40px_-18px_rgba(37,99,235,0.12)] dark:border-slate-700 dark:bg-slate-800/90 dark:hover:border-slate-600"
                >
                  <button
                    type="button"
                    id={`faq-trigger-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() =>
                      setOpenFaqId((prev) =>
                        prev === item.id ? null : item.id,
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-slate-800/80 md:px-5"
                  >
                    <span className="text-[15px] font-extrabold leading-snug text-slate-900 dark:text-white md:text-base">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={22}
                      className={`shrink-0 text-blue-600 transition-transform duration-300 ease-out motion-reduce:transition-none dark:text-sky-400 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                      aria-hidden
                    />
                  </button>
                  <div
                    id={`faq-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${item.id}`}
                    className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{
                          opacity: isOpen ? 1 : 0,
                        }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="border-t border-blue-100/90 px-4 pb-4 pt-3 dark:border-slate-700 md:px-5 md:pb-5 md:pt-3.5"
                      >
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:text-[15px]">
                          {item.a}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;
