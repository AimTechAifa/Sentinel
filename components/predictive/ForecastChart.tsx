"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ForecastTrendPoint } from "@/lib/types";

export function ForecastChart({ data }: { data: ForecastTrendPoint[] }) {
  const forecastStart = data.findIndex((d) => d.isForecast);

  return (
    <div className="bg-white ta-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Predictive Readiness Model</h3>
          <p className="text-xs text-gray-500 mt-1">
            sentinel-rm-v1.2 · 8 weeks actual + 4 week forecast
          </p>
        </div>
        <span className="text-[10px] bg-violet-50 text-ai px-2 py-1 rounded-full font-medium">ML Forecast</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#94A3B8" />
          <YAxis yAxisId="left" domain={[50, 100]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94A3B8" />
          <Tooltip />
          {forecastStart >= 0 && (
            <ReferenceLine
              x={data[forecastStart]?.week}
              stroke="#8B5CF6"
              strokeDasharray="4 4"
              label={{ value: "Forecast →", position: "top", fontSize: 10, fill: "#8B5CF6" }}
            />
          )}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="actualReadiness"
            fill="#2563EB15"
            stroke="#2563EB"
            name="Actual readiness %"
            connectNulls={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="predictedReadiness"
            stroke="#8B5CF6"
            strokeDasharray="6 4"
            name="Predicted readiness %"
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="predictedRollbacks"
            stroke="#EF4444"
            name="Predicted rollbacks"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
