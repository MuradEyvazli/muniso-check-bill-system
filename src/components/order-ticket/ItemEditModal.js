"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { can } from "@/lib/permissions";
import { VOID_REASONS } from "@/lib/constants";

export default function ItemEditModal({ open, onClose, item, role, onSave, onDelete }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [isComp, setIsComp] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showVoid, setShowVoid] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setNote(item.note || "");
      setDiscountType(item.discount?.type || null);
      setDiscountValue(item.discount?.value || 0);
      setIsComp(!!item.isComp);
      setShowVoid(false);
      setVoidReason("");
    }
  }, [item]);

  if (!item) return null;

  const canEdit = can(role, "tickets:edit-items");
  const canDiscount = can(role, "tickets:discount");
  const canComp = can(role, "tickets:comp");
  const canVoid = can(role, "tickets:void");

  function saveChanges() {
    const payload = {};
    if (canEdit) {
      payload.quantity = quantity;
      payload.note = note;
    }
    if (canDiscount) payload.discount = { type: discountType, value: Number(discountValue) || 0 };
    if (canComp) payload.isComp = isComp;
    onSave(payload);
  }

  function confirmVoid() {
    if (!voidReason) return;
    onSave({ isVoided: true, voidReason });
  }

  return (
    <Modal open={open} onClose={onClose} title={item.nameSnapshot} size="sm">
      {showVoid ? (
        <div className="flex flex-col gap-3">
          <p className="text-white/60 text-sm">Void gerekçesi seçin:</p>
          <div className="flex flex-wrap gap-2">
            {VOID_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setVoidReason(reason)}
                className={`tap-target rounded-xl2 px-4 text-sm border ${
                  voidReason === reason
                    ? "bg-red-500/20 border-red-400 text-red-200"
                    : "bg-ink-soft border-ink-border text-white/60"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowVoid(false)} className="flex-1">
              Vazgeç
            </Button>
            <Button
              className="flex-1 !bg-red-600 hover:!bg-red-500"
              onClick={confirmVoid}
              disabled={!voidReason}
            >
              İptal Et
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {item.isVoided ? (
            <p className="text-red-300 text-sm">
              Bu ürün iptal edildi. Gerekçe: {item.voidReason}
            </p>
          ) : (
            <>
              {canEdit && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs font-semibold uppercase">Adet</span>
                    <div className="flex items-center gap-3">
                      <button
                        className="tap-target w-12 rounded-xl2 bg-ink-soft border border-ink-border text-white text-xl"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        −
                      </button>
                      <span className="text-white font-bold text-lg w-8 text-center">{quantity}</span>
                      <button
                        className="tap-target w-12 rounded-xl2 bg-ink-soft border border-ink-border text-white text-xl"
                        onClick={() => setQuantity((q) => q + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-white/60 text-xs font-semibold mb-2 uppercase">Not</div>
                    <textarea
                      className="input-field resize-none"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </>
              )}

              {canDiscount && (
                <div>
                  <div className="text-white/60 text-xs font-semibold mb-2 uppercase">İndirim</div>
                  <div className="flex gap-2 mb-2">
                    {[
                      { key: null, label: "Yok" },
                      { key: "percent", label: "%" },
                      { key: "amount", label: CURRENCY_LABEL },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setDiscountType(opt.key)}
                        className={`tap-target flex-1 rounded-xl2 text-sm border ${
                          discountType === opt.key
                            ? "bg-gold text-ink border-gold"
                            : "bg-ink-soft border-ink-border text-white/60"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {discountType && (
                    <input
                      type="number"
                      className="input-field"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "% miktar" : "₺ miktar"}
                    />
                  )}
                </div>
              )}

              {canComp && (
                <label className="flex items-center justify-between tap-target">
                  <span className="text-white/70 text-sm">İkram (Comp)</span>
                  <input
                    type="checkbox"
                    className="w-6 h-6 accent-gold"
                    checked={isComp}
                    onChange={(e) => setIsComp(e.target.checked)}
                  />
                </label>
              )}

              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="ghost" className="flex-1 !text-red-300" onClick={onDelete}>
                    Sil
                  </Button>
                )}
                {canVoid && (
                  <Button variant="ghost" className="flex-1 !text-red-300" onClick={() => setShowVoid(true)}>
                    Void
                  </Button>
                )}
                <Button variant="gold" className="flex-1" onClick={saveChanges}>
                  Kaydet
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

const CURRENCY_LABEL = "₺";
