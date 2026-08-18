"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PaymentModal from "@/components/order-ticket/PaymentModal";
import { formatCurrency } from "@/lib/format";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export default function SplitBillModal({ open, onClose, ticket, onSplitEqual, onSplitByItem, role }) {
  const [mode, setMode] = useState("equal");
  const [parts, setParts] = useState(2);
  const [shares, setShares] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // "Ürüne göre böl" ile bu oturumda oluşturulan yeni adisyonlar — her biri doğrudan ödenebilir.
  const [splitTickets, setSplitTickets] = useState([]);
  const [payingTicket, setPayingTicket] = useState(null);

  async function calcEqual() {
    setLoading(true);
    setError("");
    try {
      const result = await onSplitEqual(parts);
      setShares(result.shares);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(id) {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submitByItem() {
    if (selectedItemIds.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await onSplitByItem(selectedItemIds);
      setSplitTickets((prev) => [...prev, ...(result.newTickets || [])]);
      setSelectedItemIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function paySplitTicket(payload) {
    const result = await fetchJson("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: payingTicket._id, ...payload }),
    });
    setSplitTickets((prev) =>
      prev.map((t) => (t._id === payingTicket._id ? result.ticket : t))
    );
    return result;
  }

  function handleClose() {
    setShares(null);
    setSelectedItemIds([]);
    setSplitTickets([]);
    setError("");
    setMode("equal");
    onClose();
  }

  const activeItems = (ticket?.items || []).filter((i) => !i.isVoided);
  const openSplitTickets = splitTickets.filter((t) => t.status === "acik");
  const closedSplitTickets = splitTickets.filter((t) => t.status !== "acik");

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Hesap Böl" size="md">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 bg-ink-soft rounded-xl2 p-1">
            <button
              onClick={() => setMode("equal")}
              className={`tap-target rounded-xl2 text-sm font-semibold ${
                mode === "equal" ? "bg-burgundy text-white" : "text-white/50"
              }`}
            >
              Eşit Böl
            </button>
            <button
              onClick={() => setMode("item")}
              className={`tap-target rounded-xl2 text-sm font-semibold ${
                mode === "item" ? "bg-burgundy text-white" : "text-white/50"
              }`}
            >
              Ürüne Göre Böl
            </button>
          </div>

          {error && <div className="text-red-300 text-sm">{error}</div>}

          {mode === "equal" ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm">Kişi sayısı</span>
                <input
                  type="number"
                  min={2}
                  className="input-field w-24"
                  value={parts}
                  onChange={(e) => setParts(Number(e.target.value))}
                />
                <Button variant="ghost" onClick={calcEqual} disabled={loading}>
                  Hesapla
                </Button>
              </div>
              {shares && (
                <div className="grid grid-cols-2 gap-2">
                  {shares.map((s, i) => (
                    <div key={i} className="rounded-xl2 bg-ink-soft border border-ink-border p-3 text-center">
                      <div className="text-white/40 text-xs">Kişi {i + 1}</div>
                      <div className="text-gold font-bold">{formatCurrency(s)}</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-white/30 text-xs">
                Bu sadece hesaplamadır. Ödemeleri &ldquo;Ödeme Al&rdquo; ekranından kısmi
                tutarlarla alabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-white/50 text-xs">
                Ayrı hesaba geçecek ürünleri seçin. Seçilenler yeni bir adisyona taşınır ve
                aşağıdan doğrudan ödenebilir.
              </p>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {activeItems.map((item) => (
                  <label
                    key={item._id}
                    className="tap-target flex items-center justify-between rounded-xl2 border border-ink-border bg-ink-soft px-3"
                  >
                    <span className="text-white text-sm">
                      {item.quantity}× {item.nameSnapshot}
                    </span>
                    <input
                      type="checkbox"
                      className="w-6 h-6 accent-gold"
                      checked={selectedItemIds.includes(item._id)}
                      onChange={() => toggleItem(item._id)}
                    />
                  </label>
                ))}
                {activeItems.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">
                    Ana adisyonda taşınacak ürün kalmadı.
                  </p>
                )}
              </div>
              <Button
                variant="gold"
                disabled={selectedItemIds.length === 0 || loading}
                onClick={submitByItem}
              >
                {loading ? "İşleniyor…" : "Yeni Adisyona Böl"}
              </Button>

              {splitTickets.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-ink-border">
                  <div className="text-white/60 text-xs font-semibold uppercase">
                    Bölünen Hesaplar
                  </div>
                  {openSplitTickets.map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between rounded-xl2 border border-gold/30 bg-gold/5 px-3 py-2"
                    >
                      <div>
                        <div className="text-white text-sm font-semibold">
                          Adisyon #{t.ticketNo}
                        </div>
                        <div className="text-white/40 text-xs">
                          {t.items.length} ürün · {formatCurrency(t.grandTotal)}
                        </div>
                      </div>
                      <Button variant="gold" className="text-xs px-4" onClick={() => setPayingTicket(t)}>
                        Öde
                      </Button>
                    </div>
                  ))}
                  {closedSplitTickets.map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between rounded-xl2 border border-emerald-500/30 bg-emerald-500/5 px-3 py-2"
                    >
                      <div className="text-white text-sm font-semibold">
                        Adisyon #{t.ticketNo}
                      </div>
                      <Badge tone="success">Ödendi</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <PaymentModal
        open={!!payingTicket}
        onClose={() => setPayingTicket(null)}
        ticket={payingTicket}
        onPay={paySplitTicket}
        onFullyPaid={() => setPayingTicket(null)}
        role={role}
      />
    </>
  );
}
