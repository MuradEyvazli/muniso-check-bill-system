"use client";

import { TABLE_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

const STATUS_STYLES = {
  bos: {
    overlay: "from-black/85 via-black/50 to-black/20",
    ring: "border-white/10",
    dot: "bg-emerald-400",
    label: "Boş",
    labelColor: "text-emerald-300",
    glow: "",
  },
  dolu: {
    overlay: "from-black/90 via-burgundy-dark/45 to-burgundy/15",
    ring: "border-burgundy/60",
    dot: "bg-burgundy-light",
    label: "Dolu",
    labelColor: "text-burgundy-light",
    glow: "shadow-[0_0_28px_-6px_rgba(123,30,43,0.65)]",
  },
  odeme_bekliyor: {
    overlay: "from-black/90 via-black/45 to-gold/15",
    ring: "border-gold/70",
    dot: "bg-gold animate-pulseSoft",
    label: "Ödeme Bekliyor",
    labelColor: "text-gold",
    glow: "shadow-glow",
  },
};

// Tablo adı "S1", "S2" gibi salon kısaltmalı saklanıyor — kartta sade şekilde
// "Masa 1", "Masa 2" olarak göstermek için sondaki sayıyı ayıklıyoruz.
function tableNumber(name) {
  const match = String(name || "").match(/\d+/);
  return match ? match[0] : name;
}

export default function TableCard({ table, onClick }) {
  const style = STATUS_STYLES[table.status] || STATUS_STYLES[TABLE_STATUS.BOS];

  return (
    <button
      onClick={onClick}
      className={`tap-target group relative flex flex-col justify-between overflow-hidden rounded-xl2 border ${style.ring} ${style.glow} h-44 sm:h-52 text-left transition-all active:scale-[0.97] hover:-translate-y-1 hover:border-gold/60`}
      style={{
        backgroundImage: "url('/images/masa-arkaplan.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-t ${style.overlay} transition-opacity duration-200 group-hover:opacity-90`}
      />

      <div className="relative flex items-center justify-between p-4">
        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        {table.status !== "bos" && (
          <span className="text-white/80 text-xs font-semibold bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            {table.elapsedMinutes} dk
          </span>
        )}
      </div>

      <div className="relative flex flex-col gap-1 p-4">
        <span className={`text-[11px] font-bold uppercase tracking-widest ${style.labelColor}`}>
          {style.label}
        </span>
        <span className="text-white font-black text-2xl sm:text-3xl leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          Masa {tableNumber(table.name)}
        </span>
        <div className="flex items-center justify-between mt-1.5">
          {table.capacity ? (
            <span className="text-white/55 text-[11px]">{table.capacity} kişi</span>
          ) : (
            <span />
          )}
          {table.status !== "bos" && (
            <span className="text-gold font-bold text-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              {formatCurrency(table.openAmount)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
