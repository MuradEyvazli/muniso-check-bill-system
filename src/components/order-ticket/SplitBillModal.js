"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export default function SplitBillModal({
  open,
  onClose,
  ticket,
  onSplitByItem,
  onPayShare,
}) {
  const [mode, setMode] = useState("amount"); // "amount" | "item"

  // --- Tutara göre böl (eşit veya özel) ---
  const [amountSubMode, setAmountSubMode] = useState("esit"); // "esit" | "ozel"
  const [parts, setParts] = useState(2);
  const [customCount, setCustomCount] = useState(2);
  const [customAmounts, setCustomAmounts] = useState(["", ""]);
  const [shares, setShares] = useState(null); // number[] onaylanan pay planı
  const [shareStatus, setShareStatus] = useState([]); // {paid, method}[]
  const [payingIndex, setPayingIndex] = useState(null);
  const [rowMethod, setRowMethod] = useState("nakit");
  const [rowReceived, setRowReceived] = useState("");
  const [rowError, setRowError] = useState("");
  const [rowLoading, setRowLoading] = useState(false);

  // --- Ürüne göre böl ---
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Bu oturumda oluşturulan adisyonlar — sadece bilgilendirme amaçlı. Gerçek durumları
  // (açık/ödendi) masa ekranındaki "Diğer Açık Adisyonlar" bölümünden takip edilir,
  // o bölüm veritabanından canlı okur ve bu modal kapansa/sayfa yenilense bile kaybolmaz.
  const [justSplit, setJustSplit] = useState([]);

  const remaining = ticket ? Math.max(round2(ticket.grandTotal - ticket.paidTotal), 0) : 0;
  const customSum = round2(customAmounts.reduce((s, v) => s + (Number(v) || 0), 0));
  const customValid =
    customAmounts.every((v) => Number(v) > 0) && Math.abs(customSum - remaining) < 0.01;

  useEffect(() => {
    if (!open) return;
    setMode("amount");
    setAmountSubMode("esit");
    setParts(2);
    setCustomCount(2);
    setCustomAmounts(["", ""]);
    setShares(null);
    setShareStatus([]);
    setPayingIndex(null);
    setRowError("");
    setSelectedItemIds([]);
    setError("");
    setJustSplit([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?._id]);

  function buildEqualShares() {
    const n = Math.max(parseInt(parts, 10) || 2, 2);
    const perShare = Math.floor((remaining / n) * 100) / 100;
    const arr = Array.from({ length: n }, () => perShare);
    const distributed = perShare * n;
    const rem = round2(remaining - distributed);
    arr[0] = round2(arr[0] + rem);
    setShares(arr);
    setShareStatus(arr.map(() => ({ paid: false, method: null })));
  }

  function setCustomCountAndResize(n) {
    const count = Math.max(parseInt(n, 10) || 2, 2);
    setCustomCount(count);
    setCustomAmounts((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
  }

  function confirmCustomShares() {
    if (!customValid) return;
    const arr = customAmounts.map((v) => round2(Number(v)));
    setShares(arr);
    setShareStatus(arr.map(() => ({ paid: false, method: null })));
  }

  function resetShares() {
    setShares(null);
    setShareStatus([]);
    setPayingIndex(null);
  }

  function openRowPayment(index) {
    setPayingIndex(index);
    setRowMethod("nakit");
    setRowReceived("");
    setRowError("");
  }

  async function confirmRowPayment(index) {
    setRowLoading(true);
    setRowError("");
    try {
      const amount = shares[index];
      const result = await onPayShare({
        method: rowMethod,
        amount,
        receivedAmount: rowReceived ? Number(rowReceived) : undefined,
      });
      setShareStatus((prev) =>
        prev.map((s, i) => (i === index ? { paid: true, method: rowMethod } : s))
      );
      setPayingIndex(null);
      return result;
    } catch (err) {
      setRowError(err.message);
    } finally {
      setRowLoading(false);
    }
  }

  const paidShareCount = shareStatus.filter((s) => s.paid).length;
  const allSharesPaid = shares && paidShareCount === shares.length;

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
      setJustSplit((prev) => [...prev, ...(result.newTickets || [])]);
      setSelectedItemIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    onClose();
  }

  const activeItems = (ticket?.items || []).filter((i) => !i.isVoided);

  return (
      <Modal open={open} onClose={handleClose} title="Hesap Böl" size="md">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 bg-ink-soft rounded-xl2 p-1">
            <button
              onClick={() => setMode("amount")}
              className={`tap-target rounded-xl2 text-sm font-semibold ${
                mode === "amount" ? "bg-burgundy text-white" : "text-white/50"
              }`}
            >
              Tutara Göre Böl
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

          {mode === "amount" ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl2 bg-ink-soft border border-ink-border px-4 py-2.5 flex items-center justify-between">
                <span className="text-white/60 text-sm">Kalan Bakiye</span>
                <span className="text-gold font-bold">{formatCurrency(remaining)}</span>
              </div>

              {!shares ? (
                <>
                  <div className="grid grid-cols-2 gap-2 bg-ink rounded-xl2 p-1">
                    <button
                      onClick={() => setAmountSubMode("esit")}
                      className={`tap-target rounded-xl2 text-xs font-semibold ${
                        amountSubMode === "esit" ? "bg-gold text-ink" : "text-white/50"
                      }`}
                    >
                      Eşit Böl
                    </button>
                    <button
                      onClick={() => setAmountSubMode("ozel")}
                      className={`tap-target rounded-xl2 text-xs font-semibold ${
                        amountSubMode === "ozel" ? "bg-gold text-ink" : "text-white/50"
                      }`}
                    >
                      Özel Tutarlarla Böl
                    </button>
                  </div>

                  {amountSubMode === "esit" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm">Kişi sayısı</span>
                      <input
                        type="number"
                        min={2}
                        className="input-field w-24"
                        value={parts}
                        onChange={(e) => setParts(e.target.value)}
                      />
                      <Button variant="ghost" onClick={buildEqualShares} disabled={remaining <= 0}>
                        Hesapla
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white/60 text-sm">Kişi sayısı</span>
                        <input
                          type="number"
                          min={2}
                          className="input-field w-24"
                          value={customCount}
                          onChange={(e) => setCustomCountAndResize(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {customAmounts.map((val, i) => (
                          <input
                            key={i}
                            type="number"
                            className="input-field"
                            placeholder={`Kişi ${i + 1} (₺)`}
                            value={val}
                            onChange={(e) =>
                              setCustomAmounts((prev) =>
                                prev.map((p, idx) => (idx === i ? e.target.value : p))
                              )
                            }
                          />
                        ))}
                      </div>
                      <div
                        className={`text-xs ${
                          Math.abs(customSum - remaining) < 0.01 ? "text-emerald-300" : "text-white/40"
                        }`}
                      >
                        Girilen toplam: {formatCurrency(customSum)} / Gereken:{" "}
                        {formatCurrency(remaining)}
                      </div>
                      <Button variant="gold" onClick={confirmCustomShares} disabled={!customValid}>
                        Payları Oluştur
                      </Button>
                    </div>
                  )}
                  <p className="text-white/30 text-xs">
                    Her pay için ayrı ödeme yöntemi (nakit/kart) seçebilirsiniz.
                  </p>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">
                      {paidShareCount}/{shares.length} pay ödendi
                    </span>
                    <button className="text-white/40 text-xs underline" onClick={resetShares}>
                      Yeniden Böl
                    </button>
                  </div>

                  {shares.map((amount, i) => (
                    <div
                      key={i}
                      className="rounded-xl2 border border-ink-border bg-ink-soft overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <div className="text-white text-sm font-semibold">Pay {i + 1}</div>
                          <div className="text-gold font-bold text-sm">{formatCurrency(amount)}</div>
                        </div>
                        {shareStatus[i]?.paid ? (
                          <Badge tone="success">
                            Ödendi · {PAYMENT_METHOD_LABELS[shareStatus[i].method]}
                          </Badge>
                        ) : payingIndex === i ? (
                          <button
                            className="text-white/40 text-xs underline"
                            onClick={() => setPayingIndex(null)}
                          >
                            Vazgeç
                          </button>
                        ) : (
                          <Button
                            variant="gold"
                            className="text-xs px-4"
                            onClick={() => openRowPayment(i)}
                          >
                            Öde
                          </Button>
                        )}
                      </div>

                      {payingIndex === i && (
                        <div className="px-3 pb-3 pt-1 border-t border-ink-border flex flex-col gap-2">
                          {rowError && <div className="text-red-300 text-xs">{rowError}</div>}
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => setRowMethod(key)}
                                className={`tap-target rounded-xl2 px-2 text-xs font-semibold border ${
                                  rowMethod === key
                                    ? "bg-burgundy border-burgundy text-white"
                                    : "bg-ink border-ink-border text-white/60"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {rowMethod === "nakit" && (
                            <input
                              type="number"
                              className="input-field"
                              placeholder="Alınan nakit (opsiyonel)"
                              value={rowReceived}
                              onChange={(e) => setRowReceived(e.target.value)}
                            />
                          )}
                          <Button
                            variant="gold"
                            className="text-sm"
                            disabled={rowLoading}
                            onClick={() => confirmRowPayment(i)}
                          >
                            {rowLoading ? "İşleniyor…" : `${formatCurrency(amount)} Öde`}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {allSharesPaid && (
                    <div className="rounded-xl2 bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 text-emerald-300 text-sm text-center">
                      Tüm paylar ödendi ✓
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {error && <div className="text-red-300 text-sm">{error}</div>}
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

              {justSplit.length > 0 && (
                <div className="rounded-xl2 bg-emerald-500/10 border border-emerald-400/30 px-3 py-2.5 flex flex-col gap-1">
                  <div className="text-emerald-300 text-sm font-semibold">
                    {justSplit.map((t) => `Adisyon #${t.ticketNo}`).join(", ")} oluşturuldu.
                  </div>
                  <p className="text-white/50 text-xs">
                    Bu pencereyi kapatsanız veya masadan çıkıp tekrar girseniz bile
                    kaybolmaz — masa ekranında &ldquo;Diğer Açık Adisyonlar&rdquo; bölümünde
                    görünür ve istediğiniz an oradan ödenebilir.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
  );
}
