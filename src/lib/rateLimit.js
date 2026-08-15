import RateLimitAttempt from "@/models/RateLimitAttempt";

// MongoDB tabanlı rate limiter. Amaç DDoS savunması değil, giriş/PIN
// ekranına karşı otomatik deneme (brute-force) saldırılarını pratik olarak
// imkansız hale getirmek. Veritabanında tutulduğu için serverless barındırma
// (ör. Vercel) dahil, kaç farklı process/instance çalışırsa çalışsın doğru
// sonuç verir — bellek içi bir sayaç bunu garanti edemezdi.
export async function checkRateLimit(key, { max = 10, windowMs = 10 * 60 * 1000 } = {}) {
  const since = new Date(Date.now() - windowMs);
  const count = await RateLimitAttempt.countDocuments({ key, createdAt: { $gte: since } });

  if (count >= max) {
    const oldest = await RateLimitAttempt.findOne({ key, createdAt: { $gte: since } })
      .sort({ createdAt: 1 })
      .lean();
    const retryAfterMs = oldest
      ? Math.max(new Date(oldest.createdAt).getTime() + windowMs - Date.now(), 0)
      : windowMs;
    return { allowed: false, retryAfterMs };
  }

  await RateLimitAttempt.create({ key });
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * İstekten en iyi tahmini istemci IP adresini çıkarır. Vercel gibi bir ters
 * proxy arkasında "x-forwarded-for" header'ı güvenilir şekilde ayarlanır.
 * Bulunamazsa tüm istekler tek bir ortak anahtarda sınırlanır — bu da hâlâ
 * brute-force'u yavaşlatır.
 */
export function getClientKey(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
