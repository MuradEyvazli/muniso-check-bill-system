"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";

// Aylık ciro trendini altın renkli alan grafiği olarak çizer. data: [{ label, total }]
// kronolojik sırada (en eski solda) verilmeli.
export default function RevenueTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-white/30 text-sm">
        Henüz grafik için yeterli veri yok.
      </div>
    );
  }

  return (
    <div className="h-56 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A227" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2B2325" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#7A7275"
            tick={{ fill: "#7A7275", fontSize: 11 }}
            axisLine={{ stroke: "#2B2325" }}
            tickLine={false}
          />
          <YAxis
            stroke="#7A7275"
            tick={{ fill: "#7A7275", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}b` : v)}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "#1D1719",
              border: "1px solid #2B2325",
              borderRadius: 12,
              color: "#F4EDE4",
            }}
            labelStyle={{ color: "#C9A227", fontWeight: 600, marginBottom: 4 }}
            formatter={(value) => [formatCurrency(value), "Ciro"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#C9A227"
            strokeWidth={2.5}
            fill="url(#revenueGold)"
            dot={{ r: 3, fill: "#C9A227", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
