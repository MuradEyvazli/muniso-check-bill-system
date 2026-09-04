"use client";

// Masalar banner'ı ve login ekranıyla aynı tipografik dili (eyebrow + Fraunces
// italik başlık) uygulama genelindeki sayfa başlıklarına da taşımak için ortak
// bileşen — Raporlar/Ayarlar/Kasa/Menü Yönetimi gibi sayfalarda kullanılır.
export default function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-1">
      {eyebrow && (
        <p className="text-gold/70 text-[10px] font-semibold tracking-[0.35em] uppercase mb-2">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display italic text-white text-3xl sm:text-4xl font-medium tracking-tight leading-none">
        {title}
      </h1>
      {subtitle && <p className="text-white/35 text-sm mt-3 tracking-wide">{subtitle}</p>}
    </div>
  );
}
