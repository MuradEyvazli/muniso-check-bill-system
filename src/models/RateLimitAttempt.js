const mongoose = require("mongoose");

// Giriş/PIN denemelerini kaydeder. "createdAt" alanındaki TTL (expires)
// sayesinde MongoDB kayıtları 30 dakika sonra kendiliğinden siler — elle
// temizlik gerekmez. Bellek içi (in-memory) bir sayaç yerine bunun
// kullanılma sebebi: serverless barındırmada (ör. Vercel) her istek farklı,
// kısa ömürlü bir process'e düşebilir; bellekteki sayaç güvenilir olmaz.
// Veritabanı tüm process'ler arasında ortak olduğu için doğru çalışır.
const RateLimitAttemptSchema = new mongoose.Schema({
  key: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 30 },
});

module.exports =
  mongoose.models.RateLimitAttempt || mongoose.model("RateLimitAttempt", RateLimitAttemptSchema);
