// Restoran Türkiye'de (İstanbul, UTC+3, 2016'dan beri yaz saati yok) — "gün" sınırları
// her zaman bu saat dilimine göre hesaplanır. Sunucu hangi saat diliminde çalışırsa
// çalışsın (çoğu bulut ortamı UTC) "bugün" doğru hesaplansın diye.

const ISTANBUL_TZ = "Europe/Istanbul";
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

export function istanbulTodayStr() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISTANBUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // "YYYY-MM-DD"
}

// dateStr: "YYYY-MM-DD" (İstanbul takvim günü). Verilmezse bugün kullanılır.
// Döner: { date, start, end } — start/end UTC Date nesneleridir, Mongo sorgularında
// doğrudan kullanılabilir ([start, end) aralığı o İstanbul takvim gününü kapsar).
export function istanbulDayRange(dateStr) {
  const str = dateStr || istanbulTodayStr();
  const [y, m, d] = str.split("-").map(Number);
  const startMs = Date.UTC(y, m - 1, d, 0, 0, 0) - ISTANBUL_OFFSET_MS;
  return { date: str, start: new Date(startMs), end: new Date(startMs + 24 * 60 * 60 * 1000) };
}

export const BUSINESS_TIMEZONE = ISTANBUL_TZ;
