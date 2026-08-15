"use client";

import { useState, useMemo, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export default function AddItemModal({
  open,
  onClose,
  product,
  optionGroupsById,
  orderType,
  onConfirm,
}) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState({}); // groupId -> optionName | [optionName]
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setSelected({});
      setNote("");
    }
  }, [open, product]);

  const groups = useMemo(
    () => (product?.optionGroupIds || []).map((id) => optionGroupsById[id]).filter(Boolean),
    [product, optionGroupsById]
  );

  if (!product) return null;

  const priceField = orderType === "masa" ? "salon" : orderType === "paket" ? "paket" : "gelAl";
  const unitPrice = product.prices?.[priceField] ?? product.prices?.salon ?? 0;
  const maxQuantity =
    typeof product.stockQuantity === "number" ? Math.max(product.stockQuantity, 1) : 99;
  const optionsTotal = Object.entries(selected).reduce((sum, [groupId, val]) => {
    const group = optionGroupsById[groupId];
    if (!group) return sum;
    const names = Array.isArray(val) ? val : val ? [val] : [];
    return (
      sum +
      names.reduce((s, name) => {
        const opt = group.options.find((o) => o.name === name);
        return s + (opt?.priceDelta || 0);
      }, 0)
    );
  }, 0);
  const lineTotal = (unitPrice + optionsTotal) * quantity;

  function toggleOption(group, option) {
    setSelected((prev) => {
      const current = prev[group._id];
      if (group.selectionType === "single") {
        return { ...prev, [group._id]: current === option.name ? null : option.name };
      }
      const list = Array.isArray(current) ? current : [];
      const exists = list.includes(option.name);
      return {
        ...prev,
        [group._id]: exists ? list.filter((n) => n !== option.name) : [...list, option.name],
      };
    });
  }

  function isSelected(group, option) {
    const current = selected[group._id];
    if (group.selectionType === "single") return current === option.name;
    return Array.isArray(current) && current.includes(option.name);
  }

  function buildSelectedOptions() {
    const result = [];
    for (const group of groups) {
      const current = selected[group._id];
      const names = Array.isArray(current) ? current : current ? [current] : [];
      for (const name of names) {
        const opt = group.options.find((o) => o.name === name);
        if (opt) result.push({ groupName: group.name, optionName: opt.name, priceDelta: opt.priceDelta });
      }
    }
    return result;
  }

  function confirm() {
    onConfirm({
      productId: product._id,
      quantity,
      note,
      selectedOptions: buildSelectedOptions(),
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name} size="md">
      <div className="flex flex-col gap-5">
        {(product.description || product.calories || product.proteinGrams) && (
          <div className="rounded-xl2 bg-ink-soft border border-ink-border p-3">
            {product.description && (
              <p className="text-white/60 text-sm mb-1">{product.description}</p>
            )}
            {(product.calories || product.proteinGrams) && (
              <p className="text-white/30 text-xs">
                {product.calories ? `${product.calories} kcal` : ""}
                {product.calories && product.proteinGrams ? " · " : ""}
                {product.proteinGrams ? `Protein: ${product.proteinGrams}g` : ""}
              </p>
            )}
          </div>
        )}

        {groups.map((group) => (
          <div key={group._id}>
            <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">
              {group.name} {group.isRequired && <span className="text-gold">*</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <button
                  key={option.name}
                  onClick={() => toggleOption(group, option)}
                  className={`tap-target rounded-xl2 px-4 text-sm border font-medium ${
                    isSelected(group, option)
                      ? "bg-gold text-ink border-gold"
                      : "bg-ink-soft border-ink-border text-white/70"
                  }`}
                >
                  {option.name}
                  {option.priceDelta > 0 && ` (+${option.priceDelta})`}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="text-white/60 text-xs font-semibold mb-2 uppercase tracking-wide">Not</div>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="Örn: az pişmiş, sossuz…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wide">Adet</div>
          <div className="flex items-center gap-3">
            <button
              className="tap-target w-12 rounded-xl2 bg-ink-soft border border-ink-border text-white text-xl"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="text-white font-bold text-lg w-8 text-center">{quantity}</span>
            <button
              className="tap-target w-12 rounded-xl2 bg-ink-soft border border-ink-border text-white text-xl disabled:opacity-30"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
            >
              +
            </button>
          </div>
        </div>

        {typeof product.stockQuantity === "number" && (
          <p className="text-white/30 text-xs -mt-3">Kalan stok: {product.stockQuantity}</p>
        )}

        <Button variant="gold" onClick={confirm}>
          Adisyona Ekle · {CURRENCY_SYMBOL}
          {lineTotal.toFixed(0)}
        </Button>
      </div>
    </Modal>
  );
}
