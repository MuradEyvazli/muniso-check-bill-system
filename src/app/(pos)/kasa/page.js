"use client";

import { useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { CURRENCY_SYMBOL } from "@/lib/constants";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export default function KasaPage() {
  const { data, refresh } = usePolling(() => fetchJson("/api/shifts?active=true"), 8000, []);
  const shift = data?.shift;

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [movementModal, setMovementModal] = useState(null); // "giris" | "cikis" | null
  const [closeModal, setCloseModal] = useState(false);
  const [lastReport, setLastReport] = useState(null);

  async function handleStartShift() {
    setStarting(true);
    setStartError("");
    try {
      await fetchJson("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingCash: 0 }),
      });
      setLastReport(null);
      refresh();
    } catch (err) {
      setStartError(err.message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PageHeader eyebrow="Genel" title="Kasa" />

      {!shift && !lastReport && (
        <div className="card p-6 text-center flex flex-col items-center gap-3">
          <p className="text-white/60">Açık vardiya yok. Satış ve ödeme almak için vardiyayı başlatın.</p>
          {startError && <div className="text-red-300 text-sm">{startError}</div>}
          <Button variant="gold" disabled={starting} onClick={handleStartShift}>
            {starting ? "Başlatılıyor…" : "Vardiyayı Başlat"}
          </Button>
        </div>
      )}

      {shift && (
        <div className="card p-6 flex flex-col gap-4">
          <div>
            <div className="text-white font-bold text-lg">Vardiya Açık</div>
            <div className="text-white/40 text-sm">
              Başlangıç: {new Date(shift.openedAt).toLocaleString("tr-TR")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => setMovementModal("giris")}>
              + Nakit Giriş
            </Button>
            <Button variant="ghost" onClick={() => setMovementModal("cikis")}>
              − Nakit Çıkış
            </Button>
          </div>

          <Button className="!bg-red-700 hover:!bg-red-600" onClick={() => setCloseModal(true)}>
            Vardiyayı Kapat (Z-Raporu)
          </Button>
        </div>
      )}

      {lastReport && <ZReportCard report={lastReport} />}

      <CashMovementModal
        type={movementModal}
        shiftId={shift?._id}
        onClose={() => setMovementModal(null)}
        onDone={refresh}
      />
      <CloseShiftModal
        open={closeModal}
        shiftId={shift?._id}
        onClose={() => setCloseModal(false)}
        onClosed={(report) => {
          setLastReport(report);
          refresh();
        }}
      />
    </div>
  );
}

function CashMovementModal({ type, shiftId, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!amount || !reason) return;
    setLoading(true);
    setError("");
    try {
      await fetchJson(`/api/shifts/${shiftId}/cash-movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: Number(amount), reason }),
      });
      onDone();
      setAmount("");
      setReason("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={!!type}
      onClose={onClose}
      title={type === "giris" ? "Nakit Giriş" : "Nakit Çıkış"}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input
          type="number"
          className="input-field"
          placeholder="Tutar"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Gerekçe"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button variant="gold" disabled={loading} onClick={submit}>
          {loading ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </Modal>
  );
}

function CloseShiftModal({ open, shiftId, onClose, onClosed }) {
  const [counted, setCounted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const { shift } = await fetchJson(`/api/shifts/${shiftId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingCashCounted: counted ? Number(counted) : undefined }),
      });
      onClosed(shift.zReportSnapshot);
      setCounted("");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Vardiyayı Kapat" size="sm">
      <div className="flex flex-col gap-3">
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input
          type="number"
          className="input-field"
          placeholder="Sayılan kasa tutarı"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
        />
        <Button className="!bg-red-700 hover:!bg-red-600" disabled={loading} onClick={submit}>
          {loading ? "Kapatılıyor…" : "Vardiyayı Kapat ve Z-Raporu Oluştur"}
        </Button>
      </div>
    </Modal>
  );
}

function ZReportCard({ report }) {
  return (
    <div className="card p-6 flex flex-col gap-3">
      <div className="text-white font-bold text-lg">Z-Raporu</div>
      <Row label="Toplam Ciro" value={report.totalRevenue} />
      {Object.entries(report.totalsByMethodLabeled || {}).map(([label, amount]) => (
        <Row key={label} label={label} value={amount} muted />
      ))}
      <div className="border-t border-ink-border my-2" />
      <Row label="Açılış Nakit" value={report.openingCash} muted />
      <Row label="Nakit Giriş" value={report.cashIn} muted />
      <Row label="Nakit Çıkış" value={-report.cashOut} muted />
      <Row label="Beklenen Kasa" value={report.expectedCash} />
      <Row label="Sayılan Kasa" value={report.closingCashCounted} />
      <Row label="Fark" value={report.difference} highlight />
      <div className="border-t border-ink-border my-2" />
      <div className="flex justify-between text-white/60 text-sm">
        <span>Kapanan Adisyon</span>
        <span>{report.ticketsClosedCount}</span>
      </div>
      <div className="flex justify-between text-white/60 text-sm">
        <span>İptal Edilen Ürün</span>
        <span>{report.voidCount}</span>
      </div>
      <div className="flex justify-between text-white/60 text-sm">
        <span>İkram Edilen Ürün</span>
        <span>{report.compCount}</span>
      </div>
    </div>
  );
}

function Row({ label, value, muted, highlight }) {
  return (
    <div className={`flex justify-between ${muted ? "text-white/50 text-sm" : "text-white font-semibold"} ${highlight ? "text-gold" : ""}`}>
      <span>{label}</span>
      <span>
        {CURRENCY_SYMBOL}
        {Number(value || 0).toFixed(2)}
      </span>
    </div>
  );
}
