import { GoogleGenerativeAI } from "@google/generative-ai";
import tourModel from "../models/TourModel.js";
import { slugifyTourTitle } from "../utils/tourSlug.js";

const MAX_TOURS = 100;
/** Google đã retire gemini-1.5-flash (404). Dùng dòng 2.5 trở lên — xem https://ai.google.dev/gemini-api/docs/models */
const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_COOLDOWN_MS = 20 * 1000;
let geminiCoolingUntil = 0;

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function extractBudgetCap(message) {
  const text = String(message || "").toLowerCase();
  const trMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(tr|triệu)/i);
  if (trMatch) {
    const n = Number(String(trMatch[1]).replace(",", "."));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 1_000_000);
  }
  const rawMoney = text.match(/(\d[\d.,]{5,})/);
  if (rawMoney) {
    const digits = String(rawMoney[1]).replace(/[^\d]/g, "");
    const n = Number(digits);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function extractDurationPref(message) {
  const text = String(message || "").toLowerCase();
  const m = text.match(/(\d+)\s*ngày/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractRegionPref(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("miền bắc") || text.includes("mien bac")) return "Bắc";
  if (text.includes("miền trung") || text.includes("mien trung")) return "Trung";
  if (text.includes("miền nam") || text.includes("mien nam")) return "Nam";
  return null;
}

/** Thứ tự: .env → 2.5 flash → lite (rẻ) → 2.0 bản stable */
function buildModelCandidates() {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  const pool = [
    fromEnv || DEFAULT_MODEL,
    DEFAULT_MODEL,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-001",
  ];
  return [...new Set(pool.filter(Boolean))];
}

/** Lỗi có thể thử model khác (404 tên cũ, 429 quota) — không retry khi sai key */
function shouldTryNextModel(err) {
  const raw = String(err?.message || err || "");
  if (/401|API key|API_KEY_INVALID|PERMISSION_DENIED|API_KEY/i.test(raw)) {
    return false;
  }
  return /404|not found|not supported|429|RESOURCE_EXHAUSTED|quota|Too Many Requests/i.test(
    raw,
  );
}

async function generateReply(genAI, modelId, userPayload) {
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
  const result = await model.generateContent(userPayload);
  return result.response?.text?.() ?? "";
}

function mapGeminiError(error) {
  const raw = String(error?.message || error || "");
  if (/503|UNAVAILABLE|overloaded|temporarily unavailable|temporarily overloaded|The model is overloaded/i.test(raw)) {
    return {
      http: 503,
      message:
        "Hệ thống AI đang quá tải tạm thời. Vui lòng thử lại sau khoảng 15-30 giây.",
    };
  }
  if (/429|Too Many Requests|RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return {
      http: 429,
      message:
        "Gemini báo hết hạn mức hoặc quá nhiều request (429). Đợi vài phút; thử GEMINI_MODEL=gemini-2.5-flash-lite; hoặc xem quota tại Google AI Studio.",
    };
  }
  if (/401|API key|API_KEY_INVALID|invalid api key/i.test(raw)) {
    return {
      http: 503,
      message:
        "API key Gemini không hợp lệ hoặc bị từ chối. Kiểm tra GEMINI_API_KEY trong backend/.env.",
    };
  }
  if (/404|not found|not supported for generateContent/i.test(raw)) {
    return {
      http: 502,
      message:
        "Model Gemini không tồn tại hoặc đã ngừng (gemini-1.5-* thường 404). Trong backend/.env đặt GEMINI_MODEL=gemini-2.5-flash hoặc gemini-2.5-flash-lite rồi restart.",
    };
  }
  return {
    http: 500,
    message:
      raw.slice(0, 400) ||
      "Lỗi khi gọi AI. Vui lòng thử lại sau.",
  };
}

const buildCatalog = (tours) =>
  tours.map((t) => {
    const slug =
      (t.slug && String(t.slug).trim().toLowerCase()) ||
      slugifyTourTitle(t.title || "");
    const path = `/tours/${slug}`;
    return {
      tourId: String(t._id),
      title: t.title,
      path,
      city: t.city,
      region: t.region,
      category: t.category,
      durationDays: t.duration,
      priceVnd: t.price,
      summary: String(t.desc || "").slice(0, 450),
    };
  });

function buildLocalAdvisorReply(message, catalog) {
  const budgetCap = extractBudgetCap(message);
  const durationPref = extractDurationPref(message);
  const regionPref = extractRegionPref(message);
  const query = String(message || "").trim().toLowerCase();

  const scored = (catalog || [])
    .map((t) => {
      let score = 0;
      const title = String(t.title || "").toLowerCase();
      const city = String(t.city || "").toLowerCase();
      const cat = String(t.category || "").toLowerCase();
      const region = String(t.region || "");
      const price = Number(t.priceVnd || 0);
      const days = Number(t.durationDays || 1);

      if (query && (title.includes(query) || city.includes(query) || cat.includes(query))) {
        score += 3;
      }
      if (regionPref && region === regionPref) score += 2;
      if (durationPref && Math.abs(days - durationPref) <= 1) score += 2;
      if (budgetCap && price > 0 && price <= budgetCap) score += 2;
      if (price > 0) score += 0.2;

      return { ...t, score };
    })
    .sort((a, b) => b.score - a.score || Number(a.priceVnd || 0) - Number(b.priceVnd || 0));

  const filtered =
    budgetCap && scored.some((x) => Number(x.priceVnd || 0) <= budgetCap)
      ? scored.filter((x) => Number(x.priceVnd || 0) <= budgetCap)
      : scored;

  const picks = filtered.slice(0, 3);

  if (!picks.length) {
    return [
      "Hiện mình chưa thấy tour khớp chính xác tiêu chí bạn nhập.",
      "Bạn có thể xem thêm tại [/tours](/tours) và lọc theo miền, ngân sách, số ngày để ra kết quả tốt hơn.",
    ].join("\n\n");
  }

  const lines = picks.map((t, idx) => {
    const price = formatVnd(t.priceVnd);
    const days = Number(t.durationDays || 1);
    return `${idx + 1}. [${t.title}](${t.path}) · ${t.city} (${t.region}) · ${days} ngày · từ ${price}`;
  });

  return [
    "AI đang bận nên mình tạm gợi ý nhanh từ dữ liệu tour hiện có:",
    lines.join("\n"),
    "Bạn muốn mình lọc sát hơn theo tiêu chí nào (miền/ngân sách/số ngày)?",
  ].join("\n\n");
}

const SYSTEM_INSTRUCTION = `Bạn là trợ lý tư vấn tour du lịch của VietNam Travel (Việt Nam), văn phong thân thiện, chuyên nghiệp.

QUY TẮC:
- Chỉ gợi ý tour dựa trên danh sách JSON trong tin nhắn (field path, title, …). Không bịa thêm tour không có trong danh sách.
- Khi nhắc đến một tour để khách có thể đặt, BẮT BUỘC chèn liên kết Markdown đúng path trong dữ liệu:
  [Tên tour đầy đủ](path_của_tour)
  Ví dụ: [Hành trình Đà Lạt](/tours/da-lat-...) — copy chính xác giá trị "path" từ JSON.
- Trả lời bằng tiếng Việt, gọn (khoảng 4–12 câu). Có thể gợi ý tối đa 3 tour nếu phù hợp.
- Nếu không có tour phù hợp, gợi ý khách xem thêm tại /tours và nêu tiêu chí lọc (miền, ngân sách, số ngày).
- Không dùng URL tuyệt đối dạng https:// — chỉ đường dẫn bắt đầu bằng /`;

export async function postTourAdvisor(req, res) {
  try {
    const raw = req.body?.message ?? req.body?.question;
    const message = String(raw ?? "").trim();
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập câu hỏi.",
      });
    }

    const tours = await tourModel
      .find({ isActive: { $ne: false } })
      .select(
        "title slug city region category duration price desc featured updatedAt",
      )
      .sort({ featured: -1, updatedAt: -1 })
      .limit(MAX_TOURS)
      .lean();

    const catalog = buildCatalog(tours);

    if (Date.now() < geminiCoolingUntil) {
      const waitSec = Math.max(1, Math.ceil((geminiCoolingUntil - Date.now()) / 1000));
      return res.json({
        success: true,
        reply: `${buildLocalAdvisorReply(message, catalog)}\n\n(Chế độ tạm thời: Gemini đang hạ tải, thử lại AI sau khoảng ${waitSec}s.)`,
        meta: {
          tourCount: catalog.length,
          model: "local-fallback",
          fallbackUsed: true,
        },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: `${buildLocalAdvisorReply(message, catalog)}\n\n(Hiện đang dùng gợi ý nội bộ vì server chưa cấu hình GEMINI_API_KEY.)`,
        meta: {
          tourCount: catalog.length,
          model: "local-fallback",
          fallbackUsed: true,
        },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const userPayload = `Dữ liệu tour (JSON, mỗi phần tử có "path" để đặt link):\n${JSON.stringify(catalog)}\n\n---\nCâu hỏi của khách:\n${message}`;

    const candidates = buildModelCandidates();
    let reply = "";
    let usedModel = candidates[0];
    let usedFallback = false;
    let lastErr = null;

    for (let i = 0; i < candidates.length; i++) {
      const mid = candidates[i];
      try {
        reply = await generateReply(genAI, mid, userPayload);
        usedModel = mid;
        usedFallback = i > 0;
        break;
      } catch (err) {
        lastErr = err;
        const more = i < candidates.length - 1;
        if (more && shouldTryNextModel(err)) {
          console.warn(
            `[Gemini] model "${mid}" failed, trying next:`,
            String(err?.message).slice(0, 160),
          );
          continue;
        }
        throw err;
      }
    }

    if (!reply.trim() && lastErr) {
      throw lastErr;
    }

    if (!reply.trim()) {
      return res.status(502).json({
        success: false,
        message: "Không nhận được phản hồi từ AI.",
      });
    }

    return res.json({
      success: true,
      reply: reply.trim(),
      meta: {
        tourCount: catalog.length,
        model: usedModel,
        fallbackUsed: usedFallback,
      },
    });
  } catch (error) {
    console.error("Gemini tour advisor:", error);
    const { http, message } = mapGeminiError(error);
    if (http === 429 || http === 503) {
      geminiCoolingUntil = Date.now() + GEMINI_COOLDOWN_MS;
    }
    try {
      const raw = req.body?.message ?? req.body?.question;
      const userMessage = String(raw ?? "").trim();
      const tours = await tourModel
        .find({ isActive: { $ne: false } })
        .select("title slug city region category duration price desc featured updatedAt")
        .sort({ featured: -1, updatedAt: -1 })
        .limit(MAX_TOURS)
        .lean();
      const catalog = buildCatalog(tours);
      return res.json({
        success: true,
        reply: `${buildLocalAdvisorReply(userMessage, catalog)}\n\n(Ghi chú hệ thống: ${message})`,
        meta: {
          tourCount: catalog.length,
          model: "local-fallback",
          fallbackUsed: true,
        },
      });
    } catch {
      return res.status(http).json({ success: false, message });
    }
  }
}
