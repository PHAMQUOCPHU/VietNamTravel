/**
 * Hỗ trợ Web Speech API (giọng do trình duyệt/OS cung cấp).
 * Tối ưu để đọc tour "Miu" rõ và tự nhiên hết mức có thể mà không cần API TTS ngoài.
 */

export function prepareTextForTTS(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/\*\*?|__|`|#{1,6}\s?/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Độc/lấy giọng ưu tiên nữ/neural — hợp nhân vật Miu, thường trong trẻo hơn giọng mặc định máy */
export function pickBestVietnameseVoice(voiceList) {
  const list = voiceList || [];
  const vi = list.filter((v) => {
    const lang = (v.lang || "").toLowerCase();
    return lang === "vi" || lang.startsWith("vi-");
  });
  if (vi.length === 0) return null;

  const score = (v) => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let s = 0;
    if (/\b(premium|natural|neural|enhanced|wavenet|online)\b/.test(n)) s += 120;
    if (n.includes("google")) s += 100;
    if (n.includes("microsoft")) s += 70;
    if (n.includes("apple") || n.includes("siri")) s += 65;
    if (/\bfemale|\(female\)|nữ\b/i.test(n)) s += 55;
    const neuralName = /\b(premium|natural|neural|enhanced)\b/.test(n);
    if (/\bmale|\(male\)|nam minh|minh quân/i.test(n) && !neuralName) s -= 40;
    if (/hoai|my ha|hạnh|linh|chi|mai|nga|quỳnh|thảo|trang|lan|thu|ly\b/i.test(n))
      s += 45;
    if ((v.lang || "").toLowerCase() === "vi-vn") s += 25;
    return s;
  };

  return [...vi].sort((a, b) => score(b) - score(a))[0] || vi[0];
}

/** Tốc độ & cao độ theo tên giọng — giọng nữ/neural Việt: hơi chậm + pitch vừa = trong trẻo nhưng không “thé” như pitch 1.2 */
export function prosodyForVoice(voice) {
  const n = `${voice?.name || ""}`.toLowerCase();
  const feminine =
    /\bfemale|\(female\)|nữ\b/i.test(n) ||
    /hoai|hạnh|linh|my|mai|chi|nga|quỳnh|thảo|trang|lan|thu|ly\b|sara|victoria|jenny|allison|miu/i.test(
      n,
    );
  const masculine = /\bmale|\(male\)|nam minh|minh quân/i.test(n);
  const neural =
    /\b(premium|natural|neural|enhanced|wavenet|online)\b/.test(n) ||
    /google|microsoft|apple|siri/.test(n);

  if (feminine && !masculine) {
    return neural
      ? { rate: 0.93, pitch: 1.08 }
      : { rate: 0.9, pitch: 1.1 };
  }
  if (masculine) return { rate: 0.94, pitch: 0.99 };
  return neural ? { rate: 0.94, pitch: 1.05 } : { rate: 0.92, pitch: 1.07 };
}

/**
 * Chia nhỏ để có ngắt nghỉ: câu → đoạn >100 ký tự thì thêm ngắt theo dấu phẩy.
 */
export function splitForNaturalSpeech(text) {
  const cleaned = prepareTextForTTS(text);
  if (!cleaned) return [];

  const bySentence = cleaned
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [];
  for (const segment of bySentence) {
    if (segment.length <= 100) {
      out.push(segment);
      continue;
    }
    const byComma = segment
      .split(/,\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (byComma.length > 1) out.push(...byComma);
    else out.push(segment);
  }
  return out.length ? out : [cleaned];
}

/** Safari đôi khi “đóng băng” queue; resume trước khi nói */
export function ensureSpeechSynthActive(synth) {
  if (!synth) return;
  try {
    if (synth.paused) synth.resume();
  } catch {
    /* ignore */
  }
}

/**
 * Đưa từng đoạn vào hàng đợi nói (trình duyệt tự ngắt giữa các utterance).
 */
export function speakQueued(text, { voices = [], speechSynthesis: synth } = {}) {
  if (typeof window === "undefined" || !synth) return;

  synth.cancel();
  ensureSpeechSynthActive(synth);

  const list = voices.length ? voices : synth.getVoices();
  const voice = pickBestVietnameseVoice(list);
  const { rate, pitch } = prosodyForVoice(voice);
  const segments = splitForNaturalSpeech(text);
  if (segments.length === 0) return;

  segments.forEach((segment) => {
    const u = new SpeechSynthesisUtterance(segment);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang || "vi-VN";
    } else {
      u.lang = "vi-VN";
    }
    u.rate = rate;
    u.pitch = pitch;
    u.volume = 1;
    synth.speak(u);
  });
}
