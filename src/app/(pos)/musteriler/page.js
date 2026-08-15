"use client";

import { useState, useEffect } from "react";
import { CURRENCY_SYMBOL, ORDER_TYPE_LABELS } from "@/lib/constants";

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export default function MusterilerPage() {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});

  useEffect(() => {
    fetchJson("/api/customers?limit=200").then((d) => setCustomers(d.customers));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.phone.includes(query) ||
      (c.name || "").toLowerCase().includes(query.toLowerCase())
  );

  async function toggleExpand(customer) {
    if (expanded === customer._id) {
      setExpanded(null);
      return;
    }
    setExpanded(customer._id);
    if (!history[customer._id]) {
      const d = await fetchJson(`/api/customers/search?phone=${encodeURIComponent(customer.phone)}`);
      const match = d.customers.find((c) => c._id === customer._id);
      setHistory((prev) => ({ ...prev, [customer._id]: match?.orderHistory || [] }));
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <input
        className="input-field"
        placeholder="Telefon veya isme göre ara…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        {filtered.map((c) => (
          <div key={c._id} className="card p-4">
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => toggleExpand(c)}
            >
              <div>
                <div className="text-white font-semibold">{c.name || "İsimsiz"}</div>
                <div className="text-white/40 text-sm">{c.phone}</div>
              </div>
              <div className="text-white/30 text-xs">
                {c.addresses?.length || 0} adres
              </div>
            </button>

            {expanded === c._id && (
              <div className="mt-3 pt-3 border-t border-ink-border flex flex-col gap-2">
                {c.addresses?.map((a, i) => (
                  <div key={i} className="text-white/60 text-sm">
                    📍 {a.addressText} {a.note && `(${a.note})`}
                  </div>
                ))}
                <div className="text-white/40 text-xs uppercase font-semibold mt-2">
                  Sipariş Geçmişi
                </div>
                {(history[c._id] || []).map((t) => (
                  <div key={t._id} className="flex justify-between text-sm text-white/60">
                    <span>
                      #{t.ticketNo} · {ORDER_TYPE_LABELS[t.orderType]}
                    </span>
                    <span>
                      {CURRENCY_SYMBOL}
                      {t.grandTotal?.toFixed(2)}
                    </span>
                  </div>
                ))}
                {(history[c._id] || []).length === 0 && (
                  <p className="text-white/30 text-sm">Sipariş geçmişi yok.</p>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-white/30 text-center py-16">Müşteri bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
