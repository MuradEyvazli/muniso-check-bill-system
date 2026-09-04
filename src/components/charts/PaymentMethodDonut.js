"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#C9A227", "#7B1E2B", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

// Ödeme yöntemine göre ciro dağılımını donut grafik olarak çizer.
// data: [{ name, value }]
export default function PaymentMethodDonut({ data }) {
  const filtered = (data || []).filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-white/30 text-sm">
        Bu görünümde ödeme kaydı yok.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={3}
            stroke="#1D1719"
            strokeWidth={2}
          >
            {filtered.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1D1719",
              border: "1px solid #2B2325",
              borderRadius: 12,
              color: "#F4EDE4",
            }}
            formatter={(value, name) => [formatCurrency(value), name]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: "#F4EDE4", fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
