"use client";

import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from "recharts";
import { AdvancedCard } from "@/components/ui/advanced-card";
import type { HistoricalTrendPoint } from "@/lib/types";
import { LineChart } from "lucide-react";

export function TrendChart({ data }: { data: HistoricalTrendPoint[] }) {
  const chartData = data.map((d) => ({
    week: d.week.slice(5),
    readiness: Math.round(d.avgReadiness),
    rollbacks: d.rollbackCount,
  }));

  return (
    <AdvancedCard title="Readiness & Rollback Trends (26 weeks)" icon={LineChart} variant="glass">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94A3B8" domain={[50, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94A3B8" />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4E7EC", boxShadow: "0 4px 8px rgba(16,24,40,0.1)" }} />
          <Area yAxisId="left" type="monotone" dataKey="readiness" fill="#465fff20" stroke="#465fff" name="Avg Readiness %" />
          <Line yAxisId="right" type="monotone" dataKey="rollbacks" stroke="#F04438" name="Rollbacks" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </AdvancedCard>
  );
}
