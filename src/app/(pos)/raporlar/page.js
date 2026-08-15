"use client";

import { useState, useEffect, useMemo } from "react";
import { usePolling } from "@/hooks/usePolling";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

function displayDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export default function RaporlarPage() {
  const { user, loading: userLoading } = useCurrentUser();

  if (userLoading) return null;

  if (user && user.role !== "admin") {
    return (
      <div className="card p-8 max-w-xl text-center mx-auto mt-10">
        <div className="text-3xl mb-3">🔒</div>
        <h2 className="text-white font-bold text-lg mb-2">Yetkiniz Yok</h2>
        <p className="text-white/50 text-sm">Raporlar bölümü sadece yöneticiler içindir.</p>
      </div>
    );
  }

  return <ReportsContent />;
}

function ReportsContent() {
  const { data: today, refresh: refreshToday } = usePolling(
    () => fetchJson("/api/reports/today"),
    15000,
    []
  );

  const [viewDate, setViewDate] = useState(null); // null = bugün (canlı)
  const [days, setDays] = useState([]);
  const [daysLoaded, setDaysLoaded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);

  const { data: ledger, refresh: refreshLedger } = usePolling(
    () => fetchJson(`/api/reports/ledger${viewDate ? `?date=${viewDate}` : ""}`),
    8000,
    [viewDate]
  );

  async function loadDays() {
    const d = await fetchJson("/api/reports/days?limit=90");
    setDays(d.days);
    setDaysLoaded(true);
  }

  useEffect(() => {
    loadDays();
  }, []);

  const monthly = useMemo(() => {
    const map = new Map();
    for (const d of days) {
      const key = d.date.slice(0, 7); // "YYYY-MM"
      const label = new Date(`${d.date}T12:00:00`).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
      });
      const cur = map.get(key) || { key, label, total: 0, count: 0, sittingSum: 0, sittingCount: 0 };
      cur.total += d.totalRevenue;
      cur.count += 1;
      if (d.avgSittingMinutes !== null) {
        cur.sittingSum += d.avgSittingMinutes * d.tableSessionCount;
        cur.sittingCount += d.tableSessionCount;
      }
      map.set(key, cur);
    }
    return Array.from(map.values())
      .map((m) => ({
        ...m,
        avgSittingMinutes: m.sittingCount > 0 ? Math.round(m.sittingSum / m.sittingCount) : null,
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [days]);

  const entries = ledger?.entries || [];
  const viewTotal = ledger?.totalRevenue ?? 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Bugün</h2>
          <span className="text-white/40 text-xs">
            {today ? displayDate(today.date) : ""}
          </span>
        </div>
        {today ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Toplam Ciro" value={formatCurrency(today.totalRevenue)} highlight />
            <MiniStat label="Kapanan Adisyon" value={today.ticketCount} />
            <MiniStat label="Ödeme Sayısı" value={today.paymentCount} />
            <MiniStat
              label="Ort. Oturma Süresi"
              value={today.avgSittingMinutes !== null ? `${today.avgSittingMinutes} dk` : "—"}
            />
            {Object.entries(today.totalsByMethodLabeled || {}).map(([label, amount]) => (
              <MiniStat key={label} label={label} value={formatCurrency(amount)} />
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm">Yükleniyor…</p>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-white font-bold text-lg">
            {viewDate ? `${displayDate(viewDate)} — İşlemler` : "Bugünün İşlemleri"}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-gold font-bold">{formatCurrency(viewTotal)}</span>
            {viewDate && (
              <Button variant="ghost" className="text-xs" onClick={() => setViewDate(null)}>
                Bugüne Dön
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <LedgerRow
              key={e.paymentId}
              entry={e}
              expanded={expanded === e.paymentId}
              onToggle={() => setExpanded(expanded === e.paymentId ? null : e.paymentId)}
              onDeleteRequest={() => setDeleteTarget(e)}
            />
          ))}
          {ledger && entries.length === 0 && (
            <p className="text-white/30 text-center py-8 text-sm">
              {viewDate ? "Bu günde ödeme kaydı yok." : "Bugün henüz ödeme alınmadı."}
            </p>
          )}
        </div>
      </div>

      {monthly.length > 0 && (
        <div className="card p-6">
          <h2 className="text-white font-bold text-lg mb-4">Aylık Karşılaştırma</h2>
          <div className="flex flex-col gap-2">
            {monthly.map((m) => (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-xl2 bg-ink-soft border border-ink-border px-4 py-2.5 gap-3"
              >
                <span className="text-white text-sm capitalize">{m.label}</span>
                <span className="text-white/40 text-xs">{m.count} gün</span>
                <span className="text-white/40 text-xs">
                  {m.avgSittingMinutes !== null ? `${m.avgSittingMinutes} dk ort.` : "—"}
                </span>
                <span className="text-gold font-bold">{formatCurrency(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-white font-bold text-lg mb-4">Geçmiş Günler</h2>
        <div className="flex flex-col gap-2">
          {days.map((d) => (
            <button
              key={d.date}
              onClick={() => setViewDate(d.date)}
              className={`tap-target w-full flex items-center justify-between rounded-xl2 border px-4 text-left ${
                viewDate === d.date
                  ? "bg-burgundy/20 border-burgundy"
                  : "bg-ink-soft border-ink-border"
              }`}
            >
              <div>
                <div className="text-white text-sm font-semibold">{displayDate(d.date)}</div>
                <div className="text-white/40 text-xs">
                  {d.orderCount} adisyon
                  {d.avgSittingMinutes !== null && ` · ${d.avgSittingMinutes} dk ort. oturma`}
                </div>
              </div>
              <span className="text-gold font-bold">{formatCurrency(d.totalRevenue)}</span>
            </button>
          ))}
          {daysLoaded && days.length === 0 && (
            <p className="text-white/30 text-center py-8 text-sm">
              Henüz geçmiş gün kaydı yok.
            </p>
          )}
        </div>
      </div>

      <div className="card p-6 border-red-900/40">
        <h2 className="text-red-300 font-bold text-lg mb-2">Tehlikeli Bölge</h2>
        <p className="text-white/50 text-sm mb-4">
          Bu işlem tüm ödeme kayıtlarını, vardiya/gün geçmişini ve nakit hareketlerini kalıcı
          olarak siler — sanki hiç satış yapılmamış gibi sıfırlanır. Masalar, adisyonlar ve menü
          bundan etkilenmez. Geri alınamaz.
        </p>
        <Button className="!bg-red-700 hover:!bg-red-600" onClick={() => setResetOpen(true)}>
          Tüm Raporları Sıfırla
        </Button>
      </div>

      <DeletePaymentModal
        entry={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          refreshLedger();
          loadDays();
        }}
      />

      <ResetReportsModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onReset={() => {
          setResetOpen(false);
          setViewDate(null);
          refreshToday();
          refreshLedger();
          loadDays();
        }}
      />
    </div>
  );
}

function MiniStat({ label, value, highlight }) {
  return (
    <div className="rounded-xl2 bg-ink-soft border border-ink-border px-4 py-3 text-center">
      <div className={`font-black text-lg ${highlight ? "text-gold" : "text-white"}`}>{value}</div>
      <div className="text-white/35 text-[10px] uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function LedgerRow({ entry, expanded, onToggle, onDeleteRequest }) {
  const time = new Date(entry.paidAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl2 bg-ink-soft border border-ink-border overflow-hidden">
      <button onClick={onToggle} className="tap-target w-full flex items-center justify-between px-4 gap-3">
        <div className="text-left flex items-center gap-3 min-w-0">
          <span className="text-white/40 text-xs font-mono shrink-0">{time}</span>
          <span className="text-white font-semibold text-sm truncate">{entry.label}</span>
          <span className="text-white/30 text-xs shrink-0">{entry.methodLabel}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-gold font-bold">{formatCurrency(entry.amount)}</span>
          <span className="text-white/30 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-ink-border flex flex-col gap-2">
          {entry.items.length > 0 ? (
            <div className="flex flex-col gap-1">
              {entry.items.map((it, i) => (
                <div key={i} className="flex justify-between text-white/60 text-sm">
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span>{formatCurrency(it.unitPrice * it.quantity)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-xs">Ürün bilgisi bulunamadı.</p>
          )}
          <Button
            variant="ghost"
            className="text-xs !text-red-300 !border-red-900/40 mt-2 self-start"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest();
            }}
          >
            Ödemeyi Sil
          </Button>
        </div>
      )}
    </div>
  );
}

function DeletePaymentModal({ entry, onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPassword("");
    setError("");
  }, [entry]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await fetchJson(`/api/reports/ledger/${entry.paymentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: password }),
      });
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!entry} onClose={onClose} title="Ödemeyi Sil" size="sm">
      <div className="flex flex-col gap-3">
        <p className="text-white/60 text-sm">
          Bu işlem geri alınamaz ve o günün cirosundan düşer. Devam etmek için silme şifresini
          girin.
        </p>
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input
          type="password"
          className="input-field"
          placeholder="Silme şifresi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          className="!bg-red-700 hover:!bg-red-600"
          disabled={loading || !password}
          onClick={submit}
        >
          {loading ? "Siliniyor…" : "Kalıcı Olarak Sil"}
        </Button>
      </div>
    </Modal>
  );
}

function ResetReportsModal({ open, onClose, onReset }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await fetchJson("/api/reports/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: password }),
      });
      onReset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tüm Raporları Sıfırla" size="sm">
      <div className="flex flex-col gap-3">
        <p className="text-red-300 text-sm font-semibold">
          Bu, tüm ödeme, gün ve vardiya geçmişini kalıcı olarak siler. Sanki hiç satış
          yapılmamış gibi sıfırlanır. Bu işlem geri alınamaz.
        </p>
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input
          type="password"
          className="input-field"
          placeholder="Silme şifresi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          className="!bg-red-700 hover:!bg-red-600"
          disabled={loading || !password}
          onClick={submit}
        >
          {loading ? "Sıfırlanıyor…" : "Her Şeyi Sıfırla"}
        </Button>
      </div>
    </Modal>
  );
}
