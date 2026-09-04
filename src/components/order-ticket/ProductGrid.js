"use client";

import { useState, useMemo } from "react";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export default function ProductGrid({ categories, products, orderType, onSelect }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const catId = activeCategory || categories[0]?._id;
  const activeCat = categories.find((c) => c._id === catId);

  const priceField = orderType === "masa" ? "salon" : orderType === "paket" ? "paket" : "gelAl";

  const visible = useMemo(
    () => products.filter((p) => p.categoryId === catId),
    [products, catId]
  );

  // Kategoriden bağımsız olarak rozetli (Şefin Spesiyali / Yeni) ürünleri üstte
  // dönen bir şeritte öne çıkarıyoruz — garson kategoriye girmeden de görsün.
  const featured = useMemo(
    () =>
      products
        .filter((p) => p.badge && p.stockStatus !== "kapali")
        .slice(0, 10),
    [products]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {featured.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-3 mb-1 -mx-1 px-1">
          {featured.map((product) => {
            const price = product.prices?.[priceField] ?? product.prices?.salon ?? 0;
            return (
              <button
                key={product._id}
                onClick={() => onSelect(product)}
                className="tap-target shrink-0 relative flex items-center gap-2.5 rounded-xl2 border border-gold/30 bg-gradient-to-r from-burgundy/40 via-burgundy-dark/30 to-transparent px-4 pr-5 overflow-hidden hover:border-gold/60 transition-colors"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent pointer-events-none" />
                <span className="badge bg-gold text-ink text-[9px] font-bold relative z-10 shrink-0">
                  {product.badge}
                </span>
                <span className="text-white text-xs font-semibold relative z-10 whitespace-nowrap">
                  {product.name}
                </span>
                <span className="text-gold text-xs font-bold relative z-10 whitespace-nowrap">
                  {CURRENCY_SYMBOL}
                  {price.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-1 px-1">
        {categories.map((cat) => {
          const catActive = catId === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`tap-target shrink-0 relative rounded-xl2 px-5 text-sm font-semibold border transition-all duration-200 ${
                catActive
                  ? "bg-gradient-to-b from-burgundy-light to-burgundy border-burgundy text-white shadow-glow -translate-y-0.5"
                  : "bg-ink-card border-ink-border text-white/55 hover:border-gold/30 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {activeCat?.description && (
        <p className="text-white/35 text-xs italic mb-3 px-1">{activeCat.description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 overflow-y-auto flex-1 content-start pb-4">
        {visible.map((product) => {
          const price = product.prices?.[priceField] ?? product.prices?.salon ?? 0;
          const outOfStock =
            product.stockStatus === "kapali" ||
            !price ||
            (typeof product.stockQuantity === "number" && product.stockQuantity <= 0);
          const lowStock =
            !outOfStock &&
            typeof product.stockQuantity === "number" &&
            product.stockQuantity <= 5;
          const hasDiscount = product.compareAtPrice && product.compareAtPrice > price;

          return (
            <button
              key={product._id}
              disabled={outOfStock}
              onClick={() => onSelect(product)}
              className="tap-target group relative flex flex-col justify-between rounded-xl2 border border-ink-border bg-gradient-to-b from-ink-card to-ink-card/80 p-3.5 h-40 text-left overflow-hidden hover:border-gold/50 hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 disabled:opacity-35 disabled:hover:border-ink-border disabled:hover:translate-y-0"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold/0 via-gold/60 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
                {hasDiscount && (
                  <span className="badge bg-burgundy text-white text-[10px]">İndirim</span>
                )}
                {product.badge && (
                  <span className="badge bg-gold/20 text-gold text-[10px]">{product.badge}</span>
                )}
              </div>

              <div>
                <span className="text-white text-sm font-semibold leading-tight line-clamp-2 pr-12">
                  {product.name}
                </span>
                {product.description && (
                  <p className="text-white/35 text-[11px] leading-snug line-clamp-2 mt-1">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="flex flex-col">
                  {(product.calories || product.proteinGrams) && (
                    <span className="text-white/30 text-[10px]">
                      {product.calories ? `${product.calories} kcal` : ""}
                      {product.calories && product.proteinGrams ? " · " : ""}
                      {product.proteinGrams ? `P: ${product.proteinGrams}g` : ""}
                    </span>
                  )}
                  {outOfStock ? (
                    <span className="text-red-300 text-xs font-bold">Tükendi</span>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      {hasDiscount && (
                        <span className="text-white/30 text-xs line-through">
                          {CURRENCY_SYMBOL}
                          {product.compareAtPrice.toFixed(0)}
                        </span>
                      )}
                      <span className="text-gold font-bold text-base tracking-tight">
                        {CURRENCY_SYMBOL}
                        {price.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>
                {lowStock && (
                  <span className="badge bg-red-500/15 text-red-300 text-[10px] shrink-0">
                    Son {product.stockQuantity}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="text-white/30 col-span-full text-center py-8 text-sm">
            Bu kategoride ürün yok.
          </p>
        )}
      </div>
    </div>
  );
}
