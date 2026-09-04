"use client";

// Düz "Yükleniyor…" metni yerine kullanılan iskelet kutucuk — veriler gelene
// kadar sayfanın yaklaşık iskeletini gösterip daha "canlı" bir bekleme hissi verir.
export function SkeletonBlock({ className = "", style }) {
  return (
    <div
      className={`rounded-xl2 bg-white/[0.06] animate-pulseSoft ${className}`}
      style={style}
      aria-hidden
    />
  );
}

// Birkaç satırlık genel amaçlı iskelet — kart/liste görünümleri için.
export function SkeletonLines({ count = 3, className = "" }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-4" style={{ width: `${Math.max(85 - i * 12, 35)}%` }} />
      ))}
    </div>
  );
}
