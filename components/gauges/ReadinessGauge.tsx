"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function ReadinessGauge({ value, size = 160 }: { value: number; size?: number }) {
  const color = value >= 80 ? "#12B76A" : value >= 50 ? "#F79009" : "#F04438";
  const data = [
    { value },
    { value: 100 - value },
  ];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={size * 0.35} outerRadius={size * 0.45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
            <Cell fill={color} />
            <Cell fill="#E2E8F0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-800">{value}%</span>
        <span className="text-xs text-gray-500">Ready</span>
      </div>
    </div>
  );
}
