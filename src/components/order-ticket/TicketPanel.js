"use client";

import { ORDER_TYPE_LABELS, KDS_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

function lineTotal(item) {
  const optionsTotal = (item.selectedOptions || []).reduce((s, o) => s + (o.priceDelta || 0), 0);
  const base = (item.unitPriceSnapshot + optionsTotal) * item.quantity;
  if (item.isComp) return 0;
  if (item.discount?.type === "percent") return base - (base * (item.discount.value || 0)) / 100;
  if (item.discount?.type === "amount") return base - Math.min(item.discount.value || 0, base);
  return base;
}

export default function TicketPanel({ ticket, onItemClick }) {
  if (!ticket) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white font-bold">Adisyon #{ticket.ticketNo}</div>
          <div className="text-white/40 text-xs">{ORDER_TYPE_LABELS[ticket.orderType]}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 pb-2">
        {ticket.items.length === 0 && (
          <p className="text-white/30 text-sm text-center py-10">
            Henüz ürün eklenmedi. Soldan ürün seçin.
          </p>
        )}
        {ticket.items.map((item) => (
          <button
            key={item._id}
            onClick={() => onItemClick(item)}
            className={`text-left rounded-xl2 border px-3 py-2 transition-colors ${
              item.isVoided
                ? "border-red-500/30 bg-red-500/5 opacity-60"
                : "border-ink-border bg-ink-card hover:border-gold/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-white text-sm font-semibold ${item.isVoided ? "line-through" : ""}`}>
                {item.quantity}× {item.nameSnapshot}
              </span>
              <span className="text-white/80 text-sm font-semibold">
                {item.isVoided ? "İPTAL" : formatCurrency(lineTotal(item))}
              </span>
            </div>
            {item.selectedOptions?.length > 0 && (
              <div className="text-white/40 text-xs mt-0.5">
                {item.selectedOptions.map((o) => o.optionName).join(", ")}
              </div>
            )}
            {item.note && <div className="text-gold/70 text-xs mt-0.5 italic">&ldquo;{item.note}&rdquo;</div>}
            <div className="flex items-center gap-2 mt-1">
              {item.isComp && <span className="badge bg-gold/20 text-gold text-[10px]">İKRAM</span>}
              {item.isVoided && (
                <span className="badge bg-red-500/20 text-red-300 text-[10px]">{item.voidReason}</span>
              )}
              {!item.isVoided && (
                <span className="badge bg-white/10 text-white/50 text-[10px]">
                  {KDS_STATUS_LABELS[item.kdsStatus]}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-ink-border pt-3 flex flex-col gap-1 text-sm">
        <Row label="Ara Toplam" value={ticket.subtotal} />
        <Row label="İndirim" value={-ticket.discountTotal} muted={ticket.discountTotal === 0} />
        <Row label="Toplam" value={ticket.grandTotal} bold />
        <Row label="Ödenen" value={ticket.paidTotal} muted={ticket.paidTotal === 0} />
        <Row
          label="Kalan"
          value={Math.max(ticket.grandTotal - ticket.paidTotal, 0)}
          bold
          highlight
        />
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted, highlight }) {
  return (
    <div
      className={`flex items-center justify-between ${bold ? "font-bold text-white" : "text-white/60"} ${
        highlight ? "text-gold" : ""
      } ${muted ? "opacity-50" : ""}`}
    >
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
