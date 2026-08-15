import jwt from "jsonwebtoken";

// Güvenlik: JWT imzalama anahtarları için kod içinde sabit bir varsayılan değer
// KULLANILMAZ. Böyle bir varsayılan olsaydı, .env yanlışlıkla eksik yüklendiğinde
// uygulama sessizce herkesin bildiği bir anahtarla çalışmaya devam eder ve bu,
// oturum jetonlarının (token) sahtelenebilmesi anlamına gelirdi. Bunun yerine,
// anahtar tanımlı değilse uygulama başlangıçta net bir hatayla durur.
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET ve JWT_REFRESH_SECRET .env dosyasında tanımlı olmalı. " +
      "Güvenlik nedeniyle sabit/varsayılan bir değer kullanılmıyor."
  );
}

export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}
