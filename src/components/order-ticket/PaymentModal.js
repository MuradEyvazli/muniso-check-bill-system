"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { can } from "@/lib/permissions";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export default function PaymentModal({ open, onClose, ticket, onPay, onFullyPaid, role }) {
  const [method, setMethod] = useState("nakit");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [paidTicketId, setPaidTicketId] = useState(null); // ödeme tamamlanınca fiş için ticket id'sini tutar

  // Ödeme akışı boyunca güncel adisyon durumunu (özellikle indirim uygulandıktan
  // sonraki yeni toplamı) burada tutuyoruz — `ticket` prop'u üst ekranda "dondurulmuş"
  // bir kopya olduğu için indirim sonrası kendiliğinden güncellenmiyor.
  const [liveTicket, setLiveTicket] = useState(ticket);

  // İndirim paneli
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountTab, setDiscountTab] = useState("total"); // "total" | "percent" | "amount"
  const [discountInput, setDiscountInput] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const canDiscount = can(role, "tickets:discount");

  const remaining = Math.max(
    Math.round(((liveTicket?.grandTotal || 0) - (liveTicket?.paidTotal || 0)) * 100) / 100,
    0
  );

  useEffect(() => {
    setLiveTicket(ticket);
  }, [ticket]);

  useEffect(() => {
    if (open) {
      setAmount(remaining.toFixed(2));
      setReceived("");
      setError("");
      setMethod("nakit");
      setPayments([]);
      setPaidTicketId(null);
      setShowDiscount(false);
      setDiscountTab("total");
      setDiscountInput("");
      setDiscountReason("");
      setDiscountError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?._id]);

  const changeAmount =
    method === "nakit" && received
      ? Math.max(Number(received) - Number(amount), 0).toFixed(2)
      : null;

  const activeManualDiscount = liveTicket?.manualDiscount?.type ? liveTicket.manualDiscount : null;

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const result = await onPay({
        method,
        amount: Number(amount),
        receivedAmount: received ? Number(received) : undefined,
      });
      setPayments((prev) => [...prev, result.payment]);
      setLiveTicket(result.ticket);
      if (result.fullyPaid) {
        setPaidTicketId(liveTicket._id);
      } else {
        const newRemaining = Math.max(
          Math.round((result.ticket.grandTotal - result.ticket.paidTotal) * 100) / 100,
          0
        );
        setAmount(newRemaining.toFixed(2));
        setReceived("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function applyDiscount() {
    setDiscountError("");
    const value = Number(discountInput);
    if (!discountInput || Number.isNaN(value) || value < 0) {
      setDiscountError("Geçerli bir tutar girin");
      return;
    }
    setDiscountLoading(true);
    try {
      const payload =
        discountTab === "total"
          ? { targetTotal: value, reason: discountReason }
          : { type: discountTab, value, reason: discountReason };
      const data = await fetchJson(`/api/tickets/${liveTicket._id}/discount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setLiveTicket(data.ticket);
      const newRemaining = Math.max(
        Math.round((data.ticket.grandTotal - data.ticket.paidTotal) * 100) / 100,
        0
      );
      setAmount(newRemaining.toFixed(2));
      setDiscountInput("");
      setDiscountReason("");
      setShowDiscount(false);
    } catch (err) {
      setDiscountError(err.message);
    } finally {
      setDiscountLoading(false);
    }
  }

  async function removeDiscount() {
    setDiscountLoading(true);
    setDiscountError("");
    try {
      const data = await fetchJson(`/api/tickets/${liveTicket._id}/discount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: null, value: 0 }),
      });
      setLiveTicket(data.ticket);
      const newRemaining = Math.max(
        Math.round((data.ticket.grandTotal - data.ticket.paidTotal) * 100) / 100,
        0
      );
      setAmount(newRemaining.toFixed(2));
    } catch (err) {
      setDiscountError(err.message);
    } finally {
      setDiscountLoading(false);
    }
  }

  function finish() {
    setPaidTicketId(null);
    onFullyPaid?.();
  }

  if (paidTicketId) {
    return (
      <Modal open={open} onClose={finish} title="Ödeme Tamamlandı" size="sm">
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-2xl">
            ✓
          </div>
          <p className="text-white/70 text-sm text-center">
            Ödeme alındı. Fişi PDF olarak indirebilir veya yazdırabilirsiniz.
          </p>
          <a
            href={`/api/tickets/${paidTicketId}/receipt?type=payment`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full text-center"
          >
            Fiş İndir (PDF, 80mm)
          </a>
          <Button variant="ghost" className="w-full" onClick={finish}>
            Kapat
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Ödeme Al" size="md">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl2 bg-ink-soft border border-ink-border p-4 flex items-center justify-between">
          <span className="text-white/60 text-sm">Kalan Bakiye</span>
          <span className="text-gold font-bold text-xl">{formatCurrency(remaining)}</span>
        </div>

        {activeManualDiscount && (
          <div className="rounded-xl2 bg-gold/10 border border-gold/30 px-4 py-2 flex items-center justify-between">
            <span className="text-gold/90 text-xs">
              Uygulanan indirim: {activeManualDiscount.type === "percent"
                ? `%${activeManualDiscount.value}`
                : formatCurrency(activeManualDiscount.value)}
              {activeManualDiscount.reason ? ` — ${activeManualDiscount.reason}` : ""}
            </span>
            {canDiscount && (
              <button
                className="text-white/40 text-xs underline shrink-0 ml-2"
                onClick={removeDiscount}
                disabled={discountLoading}
              >
                Kaldır
              </button>
            )}
          </div>
        )}

        {canDiscount && (
          <div>
            {!showDiscount ? (
              <button
                className="text-gold/80 text-xs underline"
                onClick={() => setShowDiscount(true)}
              >
                {activeManualDiscount ? "İndirimi Değiştir" : "İndirim / Özel Fiyat Uygula"}
              </button>
            ) : (
              <div className="rounded-xl2 bg-ink-soft border border-ink-border p-3 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2 bg-ink rounded-xl2 p-1">
                  {[
                    { key: "total", label: "Yeni Toplam" },
                    { key: "percent", label: "% İndirim" },
                    { key: "amount", label: "₺ İndirim" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setDiscountTab(tab.key);
                        setDiscountInput("");
                        setDiscountError("");
                      }}
                      className={`tap-target rounded-xl2 text-xs font-semibold ${
                        discountTab === tab.key ? "bg-gold text-ink" : "text-white/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {discountError && <div className="text-red-300 text-xs">{discountError}</div>}

                <input
                  type="number"
                  className="input-field"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder={
                    discountTab === "total"
                      ? "Yeni toplam tutar (₺)"
                      : discountTab === "percent"
                        ? "% miktar"
                        : "₺ miktar"
                  }
                />
                <input
                  type="text"
                  className="input-field"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Gerekçe (opsiyonel) — örn. Tanıdık indirimi"
                />

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-sm"
                    onClick={() => setShowDiscount(false)}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1 text-sm"
                    disabled={discountLoading || !discountInput}
                    onClick={applyDiscount}
                  >
                    {discountLoading ? "Uygulanıyor…" : "Uygula"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="text-red-300 text-sm">{error}</div>}

        <div>
          <div className="text-white/60 text-xs font-semibold mb-2 uppercase">Yöntem</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`tap-target rounded-xl2 px-3 text-sm font-semibold border ${
                  method === key
                    ? "bg-burgundy border-burgundy text-white"
                    : "bg-ink-soft border-ink-border text-white/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-white/60 text-xs font-semibold mb-2 uppercase">Tutar</div>
          <input
            type="number"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {method === "nakit" && (
          <div>
            <div className="text-white/60 text-xs font-semibold mb-2 uppercase">Alınan Nakit</div>
            <input
              type="number"
              className="input-field"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              placeholder="Müşteriden alınan tutar"
            />
            {changeAmount !== null && (
              <p className="text-gold text-sm mt-2">Para üstü: {formatCurrency(changeAmount)}</p>
            )}
          </div>
        )}

        {payments.length > 0 && (
          <div className="text-white/40 text-xs">
            Bu oturumda alınan: {payments.length} ödeme
          </div>
        )}

        <Button
          variant="gold"
          disabled={loading || !amount || Number(amount) <= 0}
          onClick={submit}
        >
          {loading ? "İşleniyor…" : `${formatCurrency(amount || 0)} Öde`}
        </Button>
      </div>
    </Modal>
  );
}
