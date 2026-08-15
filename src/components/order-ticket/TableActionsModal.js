"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Masa adı "S1", "S2" gibi salon kısaltmalı saklanıyor — burada da sade "Masa 1" olarak gösteriyoruz.
function tableNumber(name) {
  const match = String(name || "").match(/\d+/);
  return match ? match[0] : name;
}

export default function TableActionsModal({ open, onClose, tables, currentTableId, onMerge, onMove }) {
  const [mode, setMode] = useState("merge");
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const others = tables
    .filter((t) => t._id !== currentTableId)
    .sort((a, b) => Number(tableNumber(a.name)) - Number(tableNumber(b.name)));
  const candidates = mode === "move" ? others.filter((t) => t.status === "bos") : others;

  async function submit() {
    if (!target) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "merge") await onMerge(target);
      else await onMove(target);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Masa İşlemleri" size="md">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 bg-ink-soft rounded-xl2 p-1">
          <button
            onClick={() => {
              setMode("merge");
              setTarget(null);
            }}
            className={`tap-target rounded-xl2 text-sm font-semibold ${
              mode === "merge" ? "bg-burgundy text-white" : "text-white/50"
            }`}
          >
            Masa Birleştir
          </button>
          <button
            onClick={() => {
              setMode("move");
              setTarget(null);
            }}
            className={`tap-target rounded-xl2 text-sm font-semibold ${
              mode === "move" ? "bg-burgundy text-white" : "text-white/50"
            }`}
          >
            Adisyon Taşı
          </button>
        </div>

        {error && <div className="text-red-300 text-sm">{error}</div>}

        <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {candidates.map((t) => (
            <button
              key={t._id}
              onClick={() => setTarget(t._id)}
              className={`tap-target rounded-xl2 border px-2 py-3 text-sm font-semibold ${
                target === t._id
                  ? "bg-gold text-ink border-gold"
                  : "bg-ink-soft border-ink-border text-white/70"
              }`}
            >
              Masa {tableNumber(t.name)}
            </button>
          ))}
          {candidates.length === 0 && (
            <p className="col-span-full text-white/40 text-sm text-center py-6">
              Uygun masa bulunamadı.
            </p>
          )}
        </div>

        <Button variant="gold" disabled={!target || loading} onClick={submit}>
          {loading ? "İşleniyor…" : mode === "merge" ? "Birleştir" : "Taşı"}
        </Button>
      </div>
    </Modal>
  );
}
