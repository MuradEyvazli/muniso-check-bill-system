"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TableCard from "@/components/floor-plan/TableCard";
import AddTableModal from "@/components/floor-plan/AddTableModal";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
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
    <div className="flex flex-col gap-8">
      {/* Marka / özet banner — sade, tipografi öncelikli */}
      <div className="relative overflow-hidden rounded-xl2 border border-ink-border bg-ink-card p-6 sm:p-10">
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/5 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-gold/70 text-[10px] font-semibold tracking-[0.35em] uppercase mb-3">
              Yegane Pilavcısı
            </p>
            <h2 className="font-display italic text-white text-4xl sm:text-6xl font-medium tracking-tight leading-none">
              {currentHall?.name || "Salon"}
            </h2>
            <p className="text-white/35 text-sm mt-4 tracking-wide">
              {tables.length} masadan {doluCount} tanesi dolu
              {odemeBekleyenCount > 0 && ` · ${odemeBekleyenCount} masa ödeme bekliyor`}
            </p>
          </div>
          <div className="flex divide-x divide-white/10 border-t border-white/10 pt-6 sm:border-t-0 sm:pt-0 sm:pl-8 sm:border-l">
            <StatColumn label="Dolu Masa" value={`${doluCount}/${tables.length}`} />
            <StatColumn
              label="Açık Tutar"
              value={<AnimatedNumber value={acikTutar} format={formatCurrency} />}
              highlight
            />
            <StatColumn
              label="Bugünkü Ciro"
              value={
                todayRevenue === null ? "…" : <AnimatedNumber value={todayRevenue} format={formatCurrency} />
              }
              highlight
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-ink-border pb-4">
        {halls.length > 1 &&
          halls.map((hall) => {
            const active = currentHallId === hall._id;
            return (
              <button
                key={hall._id}
                onClick={() => setActiveHall(hall._id)}
                className={`tap-target relative pb-1 text-sm font-semibold tracking-wide transition-colors ${
                  active ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {hall.name}
                {active && (
                  <motion.div
                    layoutId="masalar-hall-tab"
                    className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-gold"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="tap-target ml-auto flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80 hover:text-gold transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Masa Ekle
          </button>
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

function StatColumn({ label, value, highlight }) {
  return (
    <div className="px-5 first:pl-0 flex flex-col gap-1.5 min-w-[84px]">
      <div className={`font-display text-2xl sm:text-3xl leading-none ${highlight ? "text-gold" : "text-white"}`}>
        {value}
      </div>
      <div className="text-white/30 text-[10px] uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}
