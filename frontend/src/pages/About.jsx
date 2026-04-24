import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Building2,
  Stethoscope,
  BadgeCheck,
  ArrowRight,
  CalendarClock,
  HelpCircle,
  ChevronDown,
  GraduationCap,
  Code2,
  Layers,
  Server,
  Database,
  Lock,
  Wifi,
  Plug,
  ExternalLink,
} from "lucide-react";
import { insuranceImages } from "../assets";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

/** Đối tác bảo hiểm — logo từ `src/assets` */
const partners = [
  {
    name: "Bảo Việt Life",
    website: "https://www.baovietlife.com.vn/",
    tagline: "Thương hiệu nhân thọ bản địa uy tín",
    image: insuranceImages.baovietlife,
    accent: "from-emerald-600/15 via-white to-sky-500/10",
    ring: "ring-emerald-500/40",
    benefits: ["Gói du lịch & tai nạn linh hoạt", "Mạng lưới hỗ trợ trong nước rộng", "Quy trình hồ sơ quen thuộc"],
  },
  {
    name: "Manulife Vietnam",
    website: "https://www.manulife.com.vn/vi.html",
    tagline: "Kinh nghiệm quốc tế, tư vấn chuyên sâu",
    image: insuranceImages.manulife,
    accent: "from-green-600/12 via-white to-emerald-400/10",
    ring: "ring-green-600/35",
    benefits: ["Ưu tiên quyền lợi y tế & an toàn", "Đồng hành tour dài ngày", "Hotline hỗ trợ rõ ràng"],
  },
  {
    name: "Dai-ichi Life Việt Nam",
    website: "https://dai-ichi-life.com.vn/",
    tagline: "Ổn định & minh bạch theo hành trình",
    image: insuranceImages.daichilife,
    accent: "from-red-500/10 via-white to-rose-400/8",
    ring: "ring-rose-500/35",
    benefits: ["Bảo vệ gia đình đi cùng", "Lựa chọn hạn mức theo nhu cầu", "Tư vấn cá nhân hóa"],
  },
  {
    name: "Prudential Vietnam",
    website: "https://www.prudential.com.vn/",
    tagline: "Giải pháp tài chính & bảo vệ toàn diện",
    image: insuranceImages.prudential,
    accent: "from-blue-700/12 via-white to-indigo-500/10",
    ring: "ring-blue-600/40",
    benefits: ["Gói kết hợp nhiều rủi ro du lịch", "Hỗ trợ tài chính khi sự cố", "Thương hiệu quen thuộc tại VN"],
  },
];

/** Nội dung giới thiệu kiến thức CNTT — phục vụ trình bày khóa luận / bảo vệ đồ án */
const thesisTechShowcase = {
  intro:
    "Dưới đây là các hạ tầng kỹ thuật và kiến thức lập trình web hiện đại đã được vận dụng trực tiếp trong hệ thống: từ giao diện, API, cơ sở dữ liệu đến bảo mật, realtime và tích hợp dịch vụ bên thứ ba.",
  blocks: [
    {
      title: "Ngôn ngữ & môi trường phát triển",
      icon: Code2,
      bullets: [
        "Ngôn ngữ JavaScript (chuẩn ES Modules) dùng thống nhất cho frontend và backend.",
        "Runtime Node.js; tách ứng dụng thành client (trình duyệt) và server (API).",
      ],
    },
    {
      title: "Giao diện người dùng (SPA)",
      icon: Layers,
      bullets: [
        "Thư viện React 18, bundler Vite, định tuyến React Router.",
        "Styling với Tailwind CSS; hiệu ứng giao diện Framer Motion; icon Lucide React.",
        "Bản đồ & dữ liệu địa lý: Leaflet, react-leaflet; tích hợp Google Maps API.",
        "Các thành phần UX: Swiper, react-datepicker, toast thông báo, PDF (react-pdf).",
      ],
    },
    {
      title: "Máy chủ & API (backend)",
      icon: Server,
      bullets: [
        "Framework Express.js, kiến trúc RESTful API, middleware xử lý request/response.",
        "HTTP server tích hợp Socket.io trên cùng cổng để chat và thông báo realtime.",
        "Tác vụ định kỳ (cron) với node-cron: nhắc hạn thanh toán, nhắc lịch khởi hành.",
      ],
    },
    {
      title: "Cơ sở dữ liệu & mô hình dữ liệu",
      icon: Database,
      bullets: [
        "MongoDB (NoSQL) kết nối qua Mongoose ODM: schema, truy vấn, quan hệ tham chiếu.",
        "Mô hình hóa thực thể: người dùng, tour, booking, blog, đánh giá, tin nhắn, thông báo.",
      ],
    },
    {
      title: "Bảo mật & xác thực",
      icon: Lock,
      bullets: [
        "Xác thực người dùng bằng JSON Web Token (JWT), middleware bảo vệ route.",
        "Mã hóa mật khẩu với bcrypt; CAPTCHA (svg-captcha) hỗ trợ chống spam đăng nhập.",
      ],
    },
    {
      title: "Realtime & trải nghiệm tương tác",
      icon: Wifi,
      bullets: [
        "Socket.io (client–server): chat hỗ trợ, đồng bộ thông báo giữa khách và quản trị.",
      ],
    },
    {
      title: "Tích hợp dịch vụ & quản trị",
      icon: Plug,
      bullets: [
        "Cloudinary: lưu trữ và tối ưu hình ảnh/ media; Multer xử lý upload phía server.",
        "Gửi email giao dịch / OTP qua Nodemailer; thanh toán trực tuyến tích hợp VNPay.",
        "Ứng dụng quản trị (admin) riêng: React, biểu đồ Chart.js, soạn thảo rich text (React Quill).",
      ],
    },
  ],
};

/** Lộ trình thực tế theo các hạng mục đã xây dựng trong VietNam Travel */
const vietNamTravelTimeline = [
  {
    phase: "Khởi động & định hướng kỹ thuật",
    detail:
      "Phân tích nhu cầu đặt tour nội địa, chọn kiến trúc ba lớp (React + Express + MongoDB), thiết kế luồng người dùng và sơ đồ API.",
  },
  {
    phase: "Core backend & cơ sở dữ liệu",
    detail:
      "Triển khai REST API với Express, mô hình dữ liệu Mongoose (user, tour, booking), xác thực JWT và middleware bảo vệ route.",
  },
  {
    phase: "Ứng dụng khách hàng & đặt tour",
    detail:
      "Xây dựng SPA bằng Vite + React: trang chủ, chi tiết tour, giỏ/đặt chỗ, bản đồ tuyến (Leaflet/Google Maps), blog du lịch.",
  },
  {
    phase: "Thanh toán, media & vận hành",
    detail:
      "Tích hợp VNPay, upload ảnh Cloudinary (Multer), email OTP (Nodemailer), cron nhắc hạn thanh toán và nhắc lịch khởi hành.",
  },
  {
    phase: "Realtime, thông báo & quản trị",
    detail:
      "Socket.io cho chat hỗ trợ và thông báo; panel admin quản lý tour/booking/blog; hoàn thiện luồng hóa đơn (PDF) và trải nghiệm người dùng.",
  },
];

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const insuranceFaq = [
  {
    id: "why-buy",
    q: "Vì sao nên mua bảo hiểm du lịch khi đặt tour?",
    a:
      "Bảo hiểm du lịch giúp bạn giảm áp lực tài chính khi gặp rủi ro bất ngờ: tai nạn, ốm đau cần khám chữa, trễ hoặc hủy chuyến bay, thất lạc hành lý hay giấy tờ quan trọng. Nhiều gói còn hỗ trợ chi phí y tế khẩn cấp, sơ tán hoặc nằm viện tạm thời ở nước ngoài — những khoản tự chi trả có thể rất lớn so với giá tour. Với tour quốc tế, một số quốc gia hoặc đại sứ quán còn yêu cầu chứng minh bảo hiểm khi xin visa; vì vậy mua sớm cùng lúc đặt tour giúp bạn chủ động hồ sơ và yên tâm tập trung trải nghiệm.",
  },
  {
    id: "incident",
    q: "Nếu xảy ra sự cố trong chuyến đi thì xử lý như thế nào?",
    a:
      "Hãy giữ bình tĩnh, đảm bảo an toàn cá nhân trước, sau đó liên hệ ngay hotline 24/7 của VietNam Travel hoặc đường dây nóng trên giấy chứng nhận bảo hiểm (ví dụ Bảo Việt, Dai-ichi Life Việt Nam) để được hướng dẫn cụ thể theo từng tình huống. Khi có thể, lưu hóa đơn, biên lai viện phí, biên bản hãng bay hoặc báo cáo của cơ quan chức năng — đây là căn cứ quan trọng khi làm hồ sơ bồi thường. Đội ngũ VietNam Travel có thể giúp bạn nắm các bước khai báo ban đầu và liên hệ đối tác bảo hiểm; quyền lợi cuối cùng vẫn theo điều khoản gói bạn đã chọn và quy định của nhà bảo hiểm.",
  },
  {
    id: "mandatory",
    q: "Bảo hiểm du lịch có bắt buộc không?",
    a:
      "Với phần lớn tour trong nước, bảo hiểm thường không bắt buộc nhưng được khuyến khích mạnh vì chi phí thấp so với rủi ro có thể gặp (trễ chuyến, hủy chỗ, sự cố trên đường đi). Riêng tour quốc tế, nhiều nước yêu cầu du khách có bảo hiểm y tế hoặc bảo hiểm du lịch đủ hạn mức mới cấp visa hoặc nhập cảnh; một số tuyến leo núi, lặn biển hay hoạt động mạo hiểm cũng có thể được nhà tổ chức tour khuyến nghị hoặc yêu cầu kèm theo. Bạn nên đọc kỹ điều kiện tour và hỏi tư vấn viên để chọn gói phù hợp với lịch trình và yêu cầu pháp lý từng điểm đến.",
  },
  {
    id: "cost",
    q: "Chi phí bảo hiểm có đắt không?",
    a:
      "Nhìn chung, phí bảo hiểm du lịch chỉ là một phần nhỏ so với tổng chi phí chuyến đi — thường rơi vào khoảng vài phần trăm giá tour, tùy độ dài hành trình, vùng đến và mức bảo vệ bạn chọn (ví dụ hạn mức y tế cao hơn thì phí cao hơn một chút). So với việc phải tự trả toàn bộ viện phí hay vé máy bay thay thế khi có sự cố, đây là khoản đầu tư hợp lý cho sự an tâm. Bạn có thể so sánh vài gói song song, chú ý phần loại trừ trách nhiệm và điều kiện đồng bảo để chọn mức vừa túi tiền vừa đủ bảo vệ cho cả nhóm đi cùng.",
  },
  {
    id: "buy-after",
    q: "Tôi có thể mua bảo hiểm sau khi đã đặt tour không?",
    a:
      "Trong nhiều trường hợp, bạn vẫn có thể mua hoặc gia hạn bảo hiểm sau khi đã đặt tour, miễn là trong thời hạn cho phép của nhà bảo hiểm và trước ngày khởi hành (một số gói có điểm bắt đầu bảo hiểm cố định theo ngày xuất phát). Tuy nhiên, mua càng sớm càng tốt: nhiều quyền lợi liên quan hủy chuyến, hoãn bay hoặc bệnh nền chỉ áp dụng nếu bạn tham gia bảo hiểm khi chưa phát sinh sự kiện bảo hiểm. Nên xác nhận rõ ngày hiệu lực, địa lý được bảo vệ và các hoạt động đặc biệt trong tour có nằm trong phạm vi hay không để tránh hiểu nhầm khi cần dùng đến bảo hiểm.",
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

  const consultCount = useMemo(() => {
    try {
      const raw = localStorage.getItem("insurance-leads");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [submitted]);

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!leadForm.fullName.trim() || !leadForm.phone.trim() || !selectedPartner) return;
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
      const { data } = await axios.post(`${backendUrl}/api/insurance-leads`, payload);
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
        err.response?.data?.message || "Không kết nối được máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-white py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="relative overflow-hidden rounded-3xl border border-blue-100/80 bg-white/70 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8"
        >
          <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-blue-200/50 blur-2xl" />
          <div className="absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-indigo-200/40 blur-2xl" />
          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-slate-100 to-blue-100 p-4">
              <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-blue-300/70 bg-white/55 text-center md:h-[420px]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700/70">
                    Founder Portrait
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Placeholder ảnh Phạm Quốc Phú
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-blue-600 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                About VietNam Travel
              </span>
              <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900 md:text-4xl">
                Hành trình tạo ra hệ sinh thái du lịch thông minh
              </h1>
              <p className="mt-4 text-slate-600">
                Tôi là <b>Phạm Quốc Phú</b>, Founder & Lead Developer của VietNam
                Travel. Sản phẩm này được xây dựng từ đam mê khám phá Việt Nam và
                tư duy công nghệ hiện đại: kết hợp trải nghiệm người dùng, dữ liệu
                hành trình và dịch vụ đối tác để mỗi chuyến đi an toàn, cá nhân hóa
                và có giá trị thực tế hơn.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {["Innovation", "User Experience", "Travel Expert"].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                Mục tiêu của tôi không chỉ là một website đặt tour, mà là một sản phẩm
                thể hiện tư duy hệ sinh thái: lấy trải nghiệm du lịch làm trung tâm,
                sau đó mở rộng bằng các dịch vụ giá trị gia tăng như bảo hiểm, chăm sóc
                sau chuyến đi và hệ thống dữ liệu phục vụ quyết định kinh doanh.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-8 rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/40 to-blue-50/60 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
              <GraduationCap size={16} />
              Khóa luận / đồ án
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
            Kiến thức CNTT & công nghệ đã áp dụng trong dự án
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
            {thesisTechShowcase.intro}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {thesisTechShowcase.blocks.map((block) => {
              const Icon = block.icon;
              return (
                <article
                  key={block.title}
                  className="rounded-3xl border border-indigo-100/90 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-[0_12px_32px_rgba(67,56,202,0.12)]"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="inline-flex shrink-0 rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                      <Icon size={22} />
                    </div>
                    <h3 className="pt-0.5 text-lg font-extrabold leading-snug text-slate-900">
                      {block.title}
                    </h3>
                  </div>
                  <ul className="space-y-2 border-t border-indigo-100/80 pt-3">
                    {block.bullets.map((line) => (
                      <li
                        key={line}
                        className="flex gap-2 text-sm leading-relaxed text-slate-600"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <p className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 text-xs leading-relaxed text-slate-600 md:text-sm">
            <span className="font-bold text-indigo-900">Gợi ý khi báo cáo:</span> có thể chiếu mục này
            cùng sơ đồ kiến trúc (client → API → MongoDB → dịch vụ ngoài) để minh chứng năng lực phân
            tầng hệ thống và lựa chọn công nghệ phù hợp bài toán đặt tour du lịch trực tuyến.
          </p>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 rounded-3xl border border-blue-100/80 bg-white/75 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="text-blue-600" size={18} />
              <h2 className="text-2xl font-black text-slate-900 md:text-[1.65rem]">
                Timeline phát triển dự án VietNam Travel
              </h2>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
              {vietNamTravelTimeline.length} mốc
            </span>
          </div>
          <p className="mb-8 max-w-3xl text-sm leading-relaxed text-slate-600">
            Các giai đoạn bám sát quá trình hiện thực hóa sản phẩm: từ nền tảng API và cơ sở dữ liệu đến giao diện khách hàng,
            thanh toán, realtime và kênh quản trị.
          </p>

          <div className="relative">
            {/* Đường timeline dọc — gradient */}
            <div
              className="pointer-events-none absolute left-[22px] top-3 bottom-3 z-0 w-[4px] rounded-full bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.35)] md:left-[23px]"
              aria-hidden
            />

            <ul className="relative z-[1] m-0 list-none space-y-0 p-0">
              {vietNamTravelTimeline.map((item, index) => (
                <li
                  key={item.phase}
                  className="relative flex gap-4 pb-10 last:pb-0 md:gap-5"
                >
                  {/* Mốc tròn trên đường */}
                  <div className="relative z-10 flex w-12 shrink-0 justify-center md:w-14">
                    <span
                      className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-black text-white shadow-[0_4px_14px_rgba(29,78,216,0.45)] ring-2 ring-blue-100/90 md:h-11 md:w-11"
                      title={`Mốc ${index + 1}`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  <article className="min-w-0 flex-1 rounded-2xl border border-blue-100/90 bg-gradient-to-br from-white to-blue-50/40 p-4 shadow-sm md:p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600/90">
                      Mốc {index + 1} · VietNam Travel
                    </p>
                    <h3 className="mt-1.5 text-lg font-extrabold leading-snug text-slate-900 md:text-xl">
                      {item.phase}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 rounded-3xl border border-blue-100/80 bg-gradient-to-br from-white/85 to-blue-50/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-8"
        >
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1 text-xs font-black uppercase tracking-widest text-blue-700">
              <Building2 size={14} />
              Đối tác bảo hiểm chiến lược
            </span>
            <h2 className="text-2xl font-black text-slate-900 md:text-3xl">
              Biến bảo hiểm thành một phần tất yếu của chuyến đi
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              Mỗi lượt tư vấn là một tín hiệu nhu cầu thật. VietNam Travel kết nối
              trực tiếp khách hàng với đối tác bảo hiểm uy tín để tăng độ an tâm
              cho người dùng và mở rộng hệ sinh thái doanh thu dịch vụ.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => {
              const isSelected = selectedPartner === partner.name;
              return (
                <article
                  key={partner.name}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white/95 shadow-sm transition-all duration-300 ${
                    isSelected
                      ? `border-blue-400/80 shadow-[0_20px_50px_rgba(29,78,216,0.18)] ring-2 ring-offset-2 ring-offset-blue-50/80 ${partner.ring}`
                      : "border-slate-200/90 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
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
                          isSelected ? "shadow-[0_12px_36px_rgba(29,78,216,0.15)]" : ""
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
                        <h3 className="text-[15px] font-black leading-tight text-slate-900 md:text-base">
                          {partner.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                          {partner.tagline}
                        </p>
                      </div>
                      <ul className="space-y-2 border-t border-slate-100 pt-3">
                        {partner.benefits.map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-2 text-xs font-medium leading-snug text-slate-600"
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
                      <p className="text-[11px] font-bold uppercase tracking-wide text-blue-600/90 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                        Nhấn để chọn tư vấn →
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-3 pt-0">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/80"
                    >
                      Xem chi tiết
                      <ExternalLink size={14} className="shrink-0 opacity-80" aria-hidden />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 rounded-3xl border border-white/80 bg-white/80 p-4 md:grid-cols-[1.5fr_1fr] md:p-5">
            <form onSubmit={handleSubmitLead} className="space-y-3">
              <p className="text-sm font-bold text-slate-900">
                Nhận tư vấn miễn phí - thu thập nhu cầu bảo hiểm thực tế
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={leadForm.fullName}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Họ và tên *"
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  type="text"
                  value={leadForm.phone}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Số điện thoại *"
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) =>
                  setLeadForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email (không bắt buộc)"
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={insuranceConsent}
                  onChange={(e) => {
                    setInsuranceConsent(e.target.checked);
                    if (e.target.checked) setConsentError(false);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium leading-relaxed text-slate-700">
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
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="mb-3 inline-flex rounded-xl bg-white p-2 text-blue-700">
                <Stethoscope size={18} />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Tư vấn được chọn:{" "}
                <span className="text-blue-700">{selectedPartner || "Chưa chọn đối tác"}</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Tín hiệu lead hiện có: <b>{consultCount}</b> yêu cầu đã ghi nhận từ
                trang About.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Đây là điểm chạm chuyển đổi quan trọng, giúp đội ngũ xác định chính xác
                khách hàng có nhu cầu bảo hiểm thật để tư vấn cá nhân hóa.
              </p>
              {submitted && (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
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
          className="mt-8 rounded-3xl border border-blue-100/80 bg-white/75 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="text-blue-600" size={18} />
            <h2 className="text-2xl font-black text-slate-900">FAQ bảo hiểm du lịch</h2>
          </div>
          <div className="space-y-2.5">
            {insuranceFaq.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-sm transition-shadow duration-300 hover:shadow-md hover:shadow-blue-100/40"
                >
                  <button
                    type="button"
                    id={`faq-trigger-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${item.id}`}
                    onClick={() =>
                      setOpenFaqId((prev) => (prev === item.id ? null : item.id))
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-blue-50/50 md:px-5"
                  >
                    <span className="text-[15px] font-extrabold leading-snug text-slate-900 md:text-base">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={22}
                      className={`shrink-0 text-blue-600 transition-transform duration-300 ease-out motion-reduce:transition-none ${
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
                        className="border-t border-blue-100/90 px-4 pb-4 pt-3 md:px-5 md:pb-5 md:pt-3.5"
                      >
                        <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
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
