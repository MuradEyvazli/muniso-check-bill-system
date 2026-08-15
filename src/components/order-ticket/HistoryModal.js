"use client";

import Modal from "@/components/ui/Modal";

export default function HistoryModal({ open, onClose, history }) {
  return (
    <Modal open={open} onClose={onClose} title="Adisyon Geçmişi" size="md">
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {[...(history || [])].reverse().map((h, i) => (
          <div key={i} className="rounded-xl2 bg-ink-soft border border-ink-border px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-semibold">{h.action}</span>
              <span className="text-white/30 text-xs">
                {new Date(h.at).toLocaleString("tr-TR")}
              </span>
            </div>
            {h.detail && <div className="text-white/50 text-xs mt-0.5">{h.detail}</div>}
            {h.actorId?.name && (
              <div className="text-white/30 text-xs mt-0.5">{h.actorId.name}</div>
            )}
          </div>
        ))}
        {(!history || history.length === 0) && (
          <p className="text-white/30 text-sm text-center py-6">Kayıt yok.</p>
        )}
      </div>
    </Modal>
  );
}
