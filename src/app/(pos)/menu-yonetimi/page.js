"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { PREP_STATION_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

const TABS = [
  { key: "products", label: "Ürünler" },
  { key: "categories", label: "Kategoriler" },
  { key: "optionGroups", label: "Opsiyon Grupları" },
];

export default function MenuYonetimiPage() {
  const [tab, setTab] = useState("products");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [optionGroups, setOptionGroups] = useState([]);

  const reload = useCallback(async () => {
    const [c, p, o] = await Promise.all([
      fetchJson("/api/categories").then((d) => d.categories),
      fetchJson("/api/products").then((d) => d.products),
      fetchJson("/api/option-groups").then((d) => d.optionGroups),
    ]);
    setCategories(c);
    setProducts(p);
    setOptionGroups(o);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Yönetim" title="Menü Yönetimi" />

      <div className="flex gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tap-target relative rounded-xl2 px-5 text-sm font-semibold border transition-colors ${
                active ? "border-burgundy text-white" : "border-ink-border text-white/60 bg-ink-card"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="menu-tab-pill"
                  className="absolute inset-0 rounded-xl2 bg-burgundy -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "categories" && <CategoriesTab categories={categories} reload={reload} />}
      {tab === "optionGroups" && (
        <OptionGroupsTab optionGroups={optionGroups} reload={reload} />
      )}
      {tab === "products" && (
        <ProductsTab
          products={products}
          categories={categories}
          optionGroups={optionGroups}
          reload={reload}
        />
      )}
    </div>
  );
}

function CategoriesTab({ categories, reload }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function add() {
    if (!name) return;
    setLoading(true);
    try {
      await fetchJson("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, order: categories.length }),
      });
      setName("");
      setDescription("");
      reload();
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`"${cat.name}" kategorisi silinsin mi?`)) return;
    setDeletingId(cat._id);
    try {
      await fetchJson(`/api/categories/${cat._id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-xl flex flex-col gap-4">
      <div className="card p-4 flex flex-col gap-2">
        <input
          className="input-field"
          placeholder="Yeni kategori adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Alt başlık (opsiyonel, ör. 'Soğuk, sıcak ve taze içecek seçenekleri')"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button variant="gold" onClick={add} disabled={loading || !name}>
          Ekle
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((c) =>
          editingId === c._id ? (
            <CategoryEditRow
              key={c._id}
              category={c}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                reload();
              }}
            />
          ) : (
            <div key={c._id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-white font-semibold">{c.name}</span>
                {c.description && (
                  <p className="text-white/40 text-xs mt-0.5 truncate">{c.description}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" className="text-xs" onClick={() => setEditingId(c._id)}>
                  Düzenle
                </Button>
                <Button
                  variant="ghost"
                  className="text-xs !text-red-300 !border-red-900/40"
                  disabled={deletingId === c._id}
                  onClick={() => deleteCategory(c)}
                >
                  Sil
                </Button>
              </div>
            </div>
          )
        )}
        {categories.length === 0 && (
          <p className="text-white/30 text-center py-8 text-sm">Henüz kategori yok.</p>
        )}
      </div>
    </div>
  );
}

function CategoryEditRow({ category, onCancel, onSaved }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetchJson(`/api/categories/${category._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 flex flex-col gap-2">
      <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className="input-field"
        placeholder="Alt başlık (opsiyonel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <Button variant="gold" className="flex-1" disabled={loading || !name.trim()} onClick={save}>
          {loading ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}

function OptionGroupsTab({ optionGroups, reload }) {
  const [name, setName] = useState("");
  const [selectionType, setSelectionType] = useState("single");
  const [options, setOptions] = useState([{ name: "", priceDelta: 0 }]);
  const [loading, setLoading] = useState(false);

  function updateOption(i, field, value) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [field]: value } : o)));
  }

  async function add() {
    const cleanOptions = options.filter((o) => o.name.trim());
    if (!name || cleanOptions.length === 0) return;
    setLoading(true);
    try {
      await fetchJson("/api/option-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          selectionType,
          options: cleanOptions.map((o) => ({ ...o, priceDelta: Number(o.priceDelta) || 0 })),
        }),
      });
      setName("");
      setOptions([{ name: "", priceDelta: 0 }]);
      reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl flex flex-col gap-4">
      <div className="card p-4 flex flex-col gap-3">
        <input
          className="input-field"
          placeholder="Grup adı (ör. Sos)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectionType("single")}
            className={`tap-target rounded-xl2 text-sm border ${
              selectionType === "single" ? "bg-gold text-ink border-gold" : "bg-ink-soft border-ink-border text-white/60"
            }`}
          >
            Tekli Seçim
          </button>
          <button
            onClick={() => setSelectionType("multiple")}
            className={`tap-target rounded-xl2 text-sm border ${
              selectionType === "multiple" ? "bg-gold text-ink border-gold" : "bg-ink-soft border-ink-border text-white/60"
            }`}
          >
            Çoklu Seçim
          </button>
        </div>
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input-field"
              placeholder="Opsiyon adı"
              value={o.name}
              onChange={(e) => updateOption(i, "name", e.target.value)}
            />
            <input
              className="input-field w-28"
              type="number"
              placeholder="+₺"
              value={o.priceDelta}
              onChange={(e) => updateOption(i, "priceDelta", e.target.value)}
            />
          </div>
        ))}
        <Button variant="ghost" onClick={() => setOptions((p) => [...p, { name: "", priceDelta: 0 }])}>
          + Opsiyon Ekle
        </Button>
        <Button variant="gold" onClick={add} disabled={loading}>
          Grubu Kaydet
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {optionGroups.map((g) => (
          <div key={g._id} className="card px-4 py-3">
            <div className="text-white font-semibold">{g.name}</div>
            <div className="text-white/40 text-xs">
              {g.options.map((o) => o.name).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsTab({ products, categories, optionGroups, reload }) {
  const [editing, setEditing] = useState(null); // product or "new"
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  async function toggleStock(product) {
    const opening = product.stockStatus !== "acik";
    await fetchJson(`/api/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stockStatus: opening ? "acik" : "kapali",
        // Stok açılırken her zaman sınırsıza dönsün — kapatmadan önce adedi
        // 0'a inmiş bir ürün, tekrar açıldığında eski (0) adette takılı kalıp
        // menüde görünmez halde kalmasın diye.
        ...(opening ? { stockQuantity: null } : {}),
      }),
    });
    reload();
  }

  async function deleteProduct(product) {
    if (!window.confirm(`"${product.name}" kalıcı olarak silinsin mi?`)) return;
    setDeleting(product._id);
    try {
      await fetchJson(`/api/products/${product._id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLocaleLowerCase("tr").includes(search.trim().toLocaleLowerCase("tr"))
      )
    : products;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="gold" onClick={() => setEditing("new")}>
          + Yeni Ürün
        </Button>
        <input
          className="input-field flex-1 min-w-[200px] sm:max-w-xs"
          placeholder="Ürün ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p._id} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white font-semibold">{p.name}</span>
              <Badge tone={p.stockStatus === "acik" ? "success" : "danger"}>
                {p.stockStatus === "acik" ? "Stokta" : "Tükendi"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              {p.compareAtPrice > p.prices.salon && (
                <span className="text-white/30 text-xs line-through">
                  {formatCurrency(p.compareAtPrice)}
                </span>
              )}
              <span className="text-gold font-bold">{formatCurrency(p.prices.salon)}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/30 text-xs">{PREP_STATION_LABELS[p.prepStation]}</span>
              {typeof p.stockQuantity === "number" && (
                <span className="badge bg-white/10 text-white/50 text-[10px]">
                  Kalan: {p.stockQuantity}
                </span>
              )}
              {p.badge && <span className="badge bg-gold/20 text-gold text-[10px]">{p.badge}</span>}
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" className="text-xs flex-1" onClick={() => toggleStock(p)}>
                {p.stockStatus === "acik" ? "Stok Kapat" : "Stok Aç"}
              </Button>
              <Button variant="ghost" className="text-xs flex-1" onClick={() => setEditing(p)}>
                Düzenle
              </Button>
              <Button
                variant="ghost"
                className="text-xs !text-red-300 !border-red-900/40"
                disabled={deleting === p._id}
                onClick={() => deleteProduct(p)}
              >
                Sil
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-white/30 col-span-full text-center py-8 text-sm">
            {search ? "Aramanla eşleşen ürün yok." : "Henüz ürün yok."}
          </p>
        )}
      </div>

      {editing && (
        <ProductEditModal
          product={editing === "new" ? null : editing}
          categories={categories}
          optionGroups={optionGroups}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function ProductEditModal({ product, categories, optionGroups, onClose, onSaved }) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?._id || "");
  const [prepStation, setPrepStation] = useState(product?.prepStation || "mutfak");
  const [prices, setPrices] = useState(
    product?.prices || { salon: 0, paket: 0, gelAl: 0, marketplace: 0 }
  );
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice || "");
  const [calories, setCalories] = useState(product?.calories || "");
  const [proteinGrams, setProteinGrams] = useState(product?.proteinGrams || "");
  const [badge, setBadge] = useState(product?.badge || "");
  const [stockQuantity, setStockQuantity] = useState(
    product?.stockQuantity === null || product?.stockQuantity === undefined
      ? ""
      : product.stockQuantity
  );
  const [selectedGroups, setSelectedGroups] = useState(product?.optionGroupIds || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function applySalonToAll() {
    setPrices((p) => ({ ...p, paket: p.salon, gelAl: p.salon, marketplace: p.salon }));
  }

  function toggleGroup(id) {
    setSelectedGroups((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!name || !categoryId) {
      setError("Ürün adı ve kategori gerekli");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name,
        description,
        categoryId,
        prepStation,
        prices: {
          salon: Number(prices.salon) || 0,
          paket: Number(prices.paket) || 0,
          gelAl: Number(prices.gelAl) || 0,
          marketplace: Number(prices.marketplace) || 0,
        },
        compareAtPrice: compareAtPrice === "" ? null : Number(compareAtPrice),
        calories: calories === "" ? null : Number(calories),
        proteinGrams: proteinGrams === "" ? null : Number(proteinGrams),
        badge,
        stockQuantity: stockQuantity === "" ? null : Number(stockQuantity),
        optionGroupIds: selectedGroups,
      };
      if (product) {
        await fetchJson(`/api/products/${product._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={product ? "Ürünü Düzenle" : "Yeni Ürün"} size="lg">
      <div className="flex flex-col gap-3">
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <input className="input-field" placeholder="Ürün adı" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="input-field resize-none"
          rows={2}
          placeholder="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select
          className="input-field"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={prepStation}
          onChange={(e) => setPrepStation(e.target.value)}
        >
          <option value="mutfak">Mutfak</option>
          <option value="bar">Bar</option>
          <option value="tatli">Tatlı</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          {["salon", "paket", "gelAl", "marketplace"].map((field) => (
            <div key={field}>
              <div className="text-white/40 text-xs mb-1 capitalize">{field}</div>
              <input
                type="number"
                className="input-field"
                value={prices[field]}
                onChange={(e) => setPrices((p) => ({ ...p, [field]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Button variant="ghost" className="text-xs self-start" onClick={applySalonToAll}>
          Salon fiyatını tüm listelere uygula
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-white/40 text-xs mb-1">Eski Fiyat (indirim için, opsiyonel)</div>
            <input
              type="number"
              className="input-field"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
            />
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Rozet (ör. Öne Çıkan)</div>
            <input
              className="input-field"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Kalori (kcal)</div>
            <input
              type="number"
              className="input-field"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div>
            <div className="text-white/40 text-xs mb-1">Protein (g)</div>
            <input
              type="number"
              className="input-field"
              value={proteinGrams}
              onChange={(e) => setProteinGrams(e.target.value)}
            />
          </div>
        </div>
        <div>
          <div className="text-white/40 text-xs mb-1">
            Günlük stok adedi (boş = sınırsız/takip yok)
          </div>
          <input
            type="number"
            className="input-field"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
          />
        </div>

        <div className="text-white/60 text-xs font-semibold uppercase">Opsiyon Grupları</div>
        <div className="flex flex-wrap gap-2">
          {optionGroups.map((g) => (
            <button
              key={g._id}
              onClick={() => toggleGroup(g._id)}
              className={`tap-target rounded-xl2 px-3 text-sm border ${
                selectedGroups.includes(g._id)
                  ? "bg-gold text-ink border-gold"
                  : "bg-ink-soft border-ink-border text-white/60"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <Button variant="gold" disabled={loading} onClick={submit}>
          {loading ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </Modal>
  );
}
