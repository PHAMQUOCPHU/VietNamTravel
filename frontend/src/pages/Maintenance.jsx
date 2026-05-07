import { Mail, Phone, Wrench } from "lucide-react";

const DEFAULT_TITLE = "Đang bảo trì";
const DEFAULT_MESSAGE =
  "Chúng tôi đang thực hiện bảo trì để cải thiện trải nghiệm của bạn. Chúng tôi sẽ quay trở lại sớm!";

const Maintenance = ({ maintenance }) => {
  const title = maintenance?.title || DEFAULT_TITLE;
  const message = maintenance?.message || DEFAULT_MESSAGE;
  const contact = maintenance?.contact || {};
  const name = contact?.name || "MR Phú";
  const phone = contact?.phone || "0905713702";
  const email = contact?.email || "phamquocphu431207@gmail.com";
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
      >
        <div
          className="absolute -right-[100px] -top-[100px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,#3b82f6_0%,transparent_70%)] opacity-[0.05] motion-reduce:animate-none animate-maintenance-float"
        />
        <div
          className="absolute -bottom-[150px] -left-[150px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,#06b6d4_0%,transparent_70%)] opacity-[0.05] motion-reduce:animate-none animate-maintenance-float-reverse"
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-14 sm:px-6">
        <div className="mx-auto w-full max-w-[500px] px-2 text-center motion-reduce:animate-none animate-maintenance-enter sm:px-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-400">
            <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 motion-reduce:animate-none animate-maintenance-blink" />
            Đang bảo trì
          </div>

          <div className="mx-auto mb-8 flex h-[100px] w-[100px] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 motion-reduce:shadow-none motion-reduce:animate-none animate-maintenance-icon-pulse">
            <Wrench
              className="h-12 w-12 text-white"
              strokeWidth={2}
              aria-hidden
            />
          </div>

          <h1 className="font-terms-display text-4xl font-bold tracking-tight text-transparent sm:text-5xl bg-gradient-to-br from-white to-slate-300 bg-clip-text">
            {title}
          </h1>

          <div
            className="mx-auto my-6 h-[3px] w-[60px] rounded-sm bg-gradient-to-r from-blue-500 to-cyan-500"
            aria-hidden
          />

          <p className="mx-auto mb-8 max-w-md text-lg font-normal leading-relaxed text-slate-400">
            {message}
          </p>

          <div className="rounded-2xl border border-slate-600/50 bg-slate-950/40 p-6 text-left shadow-sm backdrop-blur-md">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Liên hệ hỗ trợ
            </p>
            <p className="mb-4 font-semibold text-slate-200">{name}</p>
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 text-left text-base font-medium text-blue-500 transition-colors hover:text-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                <Phone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span id="maintenance-phone">{phone}</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-start gap-2 break-all text-left text-base font-medium text-blue-500 transition-colors hover:text-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                <Mail
                  className="mt-0.5 h-[18px] w-[18px] shrink-0"
                  aria-hidden
                />
                <span>{email}</span>
              </a>
            </div>
          </div>

          <p className="mt-10 text-sm font-medium tracking-wide text-slate-500">
            © {year} VietNam Travel
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
