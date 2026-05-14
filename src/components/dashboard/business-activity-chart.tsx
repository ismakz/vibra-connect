"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisStyle = { fill: "rgba(248,250,252,0.45)", fontSize: 11 };
const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(6,182,212,0.35)",
  borderRadius: 12,
  color: "#f8fafc",
};

export function BusinessActivityChart({
  series,
}: {
  series: Array<{ label: string; vues: number; clics: number }>;
}) {
  return (
    <div className="h-64 min-h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillVues" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillClics" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="vues" name="Vues" stroke="#22d3ee" fill="url(#fillVues)" strokeWidth={2} />
          <Area type="monotone" dataKey="clics" name="Contacts" stroke="#a78bfa" fill="url(#fillClics)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
