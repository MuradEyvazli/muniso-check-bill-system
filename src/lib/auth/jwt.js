import jwt from "jsonwebtoken";

// Güvenlik: JWT imzalama anahtarları için kod içinde sabit bir varsayılan değer
// KULLANILMAZ. Böyle bir varsayılan olsaydı, .env yanlışlıkla eksik yüklendiğinde
// uygulama sessizce herkesin bildiği bir anahtarla çalışmaya devam eder ve bu,
// oturum jetonlarının (token) sahtelenebilmesi anlamına gelirdi. Anahtar tanımlı
// değilse token imzalanacağı/doğrulanacağı anda net bir hatayla durur.
//
// NOT: Bu kontrol BİLEREK modül yüklenirken değil, fonksiyon çağrıldığında
// yapılıyor. Modül yüklenirken (top-level) fırlatılan bir hata, Next.js
// "next build" sırasında bu dosyayı (dolaylı olarak) import eden HER sayfa için
// build'in tamamen çökmesine yol açar — ör. Railway/Vercel gibi platformlarda
// build adımı ile çalışma zamanı ortam değişkenlerinin senkron olmadığı anlarda
// bu, gerçek bir eksik yapılandırma olmasa bile build'i kırar. Fonksiyon
// çağrıldığında kontrol etmek, aynı güvenlik garantisini (secret yoksa asla
// sessizce devam etmez) korurken bu kırılganlığı ortadan kaldırır.
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_ACCESS_SECRET .env dosyasında tanımlı olmalı. Güvenlik nedeniyle sabit/varsayılan bir değer kullanılmıyor."
    );
  }
  return secret;
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET .env dosyasında tanımlı olmalı. Güvenlik nedeniyle sabit/varsayılan bir değer kullanılmıyor."
    );
  }
  return secret;
}

export function signAccessToken(payload) {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch {
    return null;
  }
}
