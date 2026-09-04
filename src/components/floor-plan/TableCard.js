"use client";

import { TABLE_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

const STATUS_STYLES = {
  bos: {
    overlay: "from-black/85 via-black/50 to-black/20",
    ring: "border-white/10",
    label: "Boş",
    labelColor: "text-emerald-300/90",
    accent: "",
    glow: "",
  },
  dolu: {
    overlay: "from-black/90 via-burgundy-dark/45 to-burgundy/15",
    ring: "border-burgundy/50",
    label: "Dolu",
    labelColor: "text-burgundy-light",
    accent: "via-burgundy-light/70",
    glow: "shadow-[0_0_28px_-6px_rgba(123,30,43,0.65)]",
  },
  odeme_bekliyor: {
    overlay: "from-black/90 via-black/45 to-gold/15",
    ring: "border-gold/60",
    label: "Ödeme Bekliyor",
    labelColor: "text-gold",
    accent: "via-gold/70",
    glow: "shadow-glow",
  },
};

// Tablo adı "S1", "S2" gibi salon kısaltmalı saklanıyor — kartta sade şekilde
// sadece sayıyı büyük tipografik unsur olarak göstermek için ayıklıyoruz.
function tableNumber(name) {
  const match = String(name || "").match(/\d+/);
  return match ? match[0] : name;
}

export default function TableCard({ table, onClick }) {
  const style = STATUS_STYLES[table.status] || STATUS_STYLES[TABLE_STATUS.BOS];
  const occupied = table.status !== "bos";
  const waitingPayment = table.status === "odeme_bekliyor";

  return (
    <button
      onClick={onClick}
      className={`tap-target group relative flex flex-col justify-between overflow-hidden rounded-xl2 border ${style.ring} ${style.glow} h-48 sm:h-56 text-left transition-all duration-200 active:scale-[0.97] hover:-translate-y-1 hover:border-gold/50`}
      style={{
        backgroundImage: "url('/images/masa-arkaplan.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Ödeme bekleyen masalar kasiyerin gözünden kaçmasın diye yumuşak bir
          nabız efektiyle vurgulanır — diğer durumlar sabit kalır. */}
      {waitingPayment && (
        <div className="absolute inset-0 rounded-xl2 border-2 border-gold/70 animate-pulseSoft pointer-events-none" />
      )}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${style.overlay} transition-opacity duration-200 group-hover:opacity-90`}
      />
      {occupied && (
        <div
          className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent ${style.accent} to-transparent`}
        />
      )}

      <div className="relative flex items-center justify-between px-5 pt-4">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${style.labelColor}`}>
          {style.label}
        </span>
        {occupied && (
          <span className="text-white/55 text-[10px] tracking-wide">{table.elapsedMinutes} DK</span>
        )}
      </div>

      <div className="relative px-5 pb-5">
        <div className="flex items-baseline gap-2">
          <span className="font-display italic text-white text-4xl sm:text-5xl font-medium leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            {tableNumber(table.name)}
          </span>
          <span className="text-white/40 text-[10px] uppercase tracking-[0.25em] mb-1">Masa</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          {table.capacity ? (
            <span className="text-white/35 text-[10px] tracking-wide">{table.capacity} KİŞİ</span>
          ) : (
            <span />
          )}
          {occupied && (
            <span className="font-display text-gold text-base drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              {formatCurrency(table.openAmount)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
