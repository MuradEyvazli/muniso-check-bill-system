// Restoran Türkiye'de (İstanbul, UTC+3, 2016'dan beri yaz saati yok) — "gün" sınırları
// her zaman bu saat dilimine göre hesaplanır. Sunucu hangi saat diliminde çalışırsa
// çalışsın (çoğu bulut ortamı UTC) "bugün" doğru hesaplansın diye.
//
// Gece yarısından sonra da açık kalan işletmeler (ör. 11:00 - 03:00) için "gün" tam
// gece yarısında değil, Ayarlar'dan belirlenen bir "iş günü sınırı" (cutoffHour) saatinde
// başlar/biter — böylece gece 01:00-03:00 arası satışlar hâlâ "önceki gün"e sayılır.
// cutoffHour verilmezse (veya 0 ise) davranış eskisiyle birebir aynıdır (tam gece yarısı).

import Branch from "@/models/Branch";

const ISTANBUL_TZ = "Europe/Istanbul";
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

export const DEFAULT_BUSINESS_DAY_CUTOFF_HOUR = 5;

export function istanbulTodayStr(cutoffHour = 0) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // İş günü sınırı saat kadar geriye kaydırılıp o ana denk gelen takvim günü alınır —
  // ör. cutoffHour=5 iken saat 02:00'de "bugün" hâlâ dünün tarihidir.
  const shifted = new Date(Date.now() - cutoffHour * 60 * 60 * 1000);
  return fmt.format(shifted);
}

// dateStr: "YYYY-MM-DD" (İstanbul takvim günü). Verilmezse bugün kullanılır.
// Döner: { date, start, end } — start/end UTC Date nesneleridir, Mongo sorgularında
// doğrudan kullanılabilir ([start, end) aralığı o iş gününü kapsar).
export function istanbulDayRange(dateStr, cutoffHour = 0) {
  const str = dateStr || istanbulTodayStr(cutoffHour);
  const [y, m, d] = str.split("-").map(Number);
  const startMs = Date.UTC(y, m - 1, d, cutoffHour, 0, 0) - ISTANBUL_OFFSET_MS;
  return { date: str, start: new Date(startMs), end: new Date(startMs + 24 * 60 * 60 * 1000) };
}

// Şubenin Ayarlar'dan belirlediği iş günü sınırını okur (yoksa varsayılana döner).
export async function getBusinessDayCutoffHour(branchId) {
  const branch = await Branch.findById(branchId).select("businessDayCutoffHour").lean();
  const value = branch?.businessDayCutoffHour;
  return typeof value === "number" && value >= 0 && value <= 12
    ? value
    : DEFAULT_BUSINESS_DAY_CUTOFF_HOUR;
}

export const BUSINESS_TIMEZONE = ISTANBUL_TZ;
