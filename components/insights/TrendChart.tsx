"use client";

import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from "recharts";
import type { HistoricalTrendPoint } from "@/lib/types";

export function TrendChart({ data }: { data: HistoricalTrendPoint[] }) {
  const chartData = data.map((d) => ({
    week: d.week.slice(5),
    readiness: Math.round(d.avgReadiness),
    rollbacks: d.rollbackCount,
  }));

  return (
    <div className="bg-white ta-card p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Readiness & Rollback Trends (26 weeks)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94A3B8" domain={[50, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <Tooltip />
          <Area yAxisId="left" type="monotone" dataKey="readiness" fill="#2563EB20" stroke="#2563EB" name="Avg Readiness %" />
          <Line yAxisId="right" type="monotone" dataKey="rollbacks" stroke="#EF4444" name="Rollbacks" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
