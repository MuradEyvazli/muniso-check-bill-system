"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

export default function PaymentModal({ open, onClose, ticket, onPay, onFullyPaid }) {
  const [method, setMethod] = useState("nakit");
  const [amount, setAmount] = useState("");
  const [received, setReceived] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [paidTicketId, setPaidTicketId] = useState(null); // ödeme tamamlanınca fiş için ticket id'sini tutar

  const remaining = Math.max(
    Math.round(((ticket?.grandTotal || 0) - (ticket?.paidTotal || 0)) * 100) / 100,
    0
  );

  useEffect(() => {
    if (open) {
      setAmount(remaining.toFixed(2));
      setReceived("");
      setError("");
      setMethod("nakit");
      setPayments([]);
      setPaidTicketId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?._id]);

  const changeAmount =
    method === "nakit" && received
      ? Math.max(Number(received) - Number(amount), 0).toFixed(2)
      : null;

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
      if (result.fullyPaid) {
        setPaidTicketId(ticket._id);
      } else {
        const newRemaining = Math.max(
          Math.round((ticket.grandTotal - result.ticket.paidTotal) * 100) / 100,
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
