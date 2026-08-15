"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TableCard from "@/components/floor-plan/TableCard";
import AddTableModal from "@/components/floor-plan/AddTableModal";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export default function MasalarPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [activeHall, setActiveHall] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(null);

  const { data: hallsData } = usePolling(() => fetchJson("/api/halls"), 30000, []);
  const { data: tablesData, refresh } = usePolling(() => fetchJson("/api/tables"), 4000, []);
  const { data: todayData } = usePolling(() => fetchJson("/api/reports/today"), 20000, []);

  const halls = hallsData?.halls || [];
  const tables = tablesData?.tables || [];
  const todayRevenue = todayData?.totalRevenue ?? null;

  const currentHallId = activeHall || halls[0]?._id;
  // Masa adları "S1", "S2" ... gibi salon kısaltmalı saklanıyor — metin sırasına göre
  // değil (S1, S10, S11...) sondaki sayıya göre (1, 2, 3...) sıralanmalı.
  const tableNum = (name) => {
    const match = String(name || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  };
  const visibleTables = tables
    .filter((t) => t.hallId === currentHallId)
    .sort((a, b) => tableNum(a.name) - tableNum(b.name));

  const doluCount = tables.filter((t) => t.status !== "bos").length;
  const odemeBekleyenCount = tables.filter((t) => t.status === "odeme_bekliyor").length;
  const acikTutar = tables.reduce((sum, t) => sum + (t.openAmount || 0), 0);

  async function handleTableClick(table) {
    if (table.status === "bos") {
      setCreating(table._id);
      try {
        await fetchJson("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderType: "masa", tableId: table._id }),
        });
        router.push(`/masalar/${table._id}`);
      } catch (err) {
        alert(err.message);
      } finally {
        setCreating(null);
      }
    } else {
      router.push(`/masalar/${table._id}`);
    }
  }

  const isAdmin = user?.role === "admin";
  const currentHall = halls.find((h) => h._id === currentHallId);

  return (
    <div className="flex flex-col gap-6">
      {/* Marka / özet banner */}
      <div className="relative overflow-hidden rounded-xl2 border border-ink-border bg-gradient-to-br from-burgundy/25 via-ink-card to-ink-card p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gold/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gold text-xs font-bold tracking-widest uppercase mb-1">
              Yegane Pilavcısı
            </p>
            <h2 className="font-display text-white text-xl sm:text-2xl font-semibold">
              {currentHall?.name || "Salon"}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {tables.length} masadan {doluCount} tanesi dolu
              {odemeBekleyenCount > 0 && ` · ${odemeBekleyenCount} masa ödeme bekliyor`}
            </p>
          </div>
          <div className="flex gap-3">
            <StatPill label="Dolu Masa" value={`${doluCount}/${tables.length}`} />
            <StatPill label="Açık Tutar" value={formatCurrency(acikTutar)} highlight />
            <StatPill
              label="Bugünkü Ciro"
              value={todayRevenue === null ? "…" : formatCurrency(todayRevenue)}
              highlight
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {halls.length > 1 &&
          halls.map((hall) => (
            <button
              key={hall._id}
              onClick={() => setActiveHall(hall._id)}
              className={`tap-target rounded-xl2 px-5 font-semibold text-sm border transition-all duration-200 ${
                currentHallId === hall._id
                  ? "bg-gradient-to-b from-burgundy-light to-burgundy border-burgundy text-white shadow-glow -translate-y-0.5"
                  : "bg-ink-card border-ink-border text-white/60 hover:border-gold/30 hover:text-white"
              }`}
            >
              {hall.name}
            </button>
          ))}
        {isAdmin && (
          <Button variant="ghost" className="ml-auto text-sm" onClick={() => setAddOpen(true)}>
            + Masa Ekle
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {visibleTables.map((table) => (
          <div key={table._id} className={creating === table._id ? "opacity-50 pointer-events-none" : ""}>
            <TableCard table={table} onClick={() => handleTableClick(table)} />
          </div>
        ))}
        {visibleTables.length === 0 && (
          <p className="text-white/40 col-span-full py-10 text-center">
            Bu salonda masa bulunmuyor.
          </p>
        )}
      </div>

      {isAdmin && currentHallId && (
        <AddTableModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          hallId={currentHallId}
          onCreated={refresh}
        />
      )}
    </div>
  );
}

function StatPill({ label, value, highlight }) {
  return (
    <div className="rounded-xl2 bg-ink-soft/80 border border-ink-border px-4 py-2 text-center min-w-[92px]">
      <div className={`font-black text-lg ${highlight ? "text-gold" : "text-white"}`}>{value}</div>
      <div className="text-white/35 text-[10px] uppercase tracking-wide">{label}</div>
    </div>
  );
}
