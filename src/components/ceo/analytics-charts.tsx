"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";

const axisStyle = { fill: "rgba(248,250,252,0.45)", fontSize: 11 };
const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(6,182,212,0.35)",
  borderRadius: 12,
  color: "#f8fafc",
};

export function CeoAnalyticsCharts(props: {
  signupsByDay: Array<{ day: string; count: number }>;
  businessesByDay: Array<{ day: string; count: number }>;
  viewsByDay: Array<{ day: string; count: number }>;
  topCities: Array<{ name: string; count: number }>;
  topCategories: Array<{ name: string; count: number }>;
}) {
  const trimDay = (d: string) => d.slice(5);

  const signups = props.signupsByDay.map((r) => ({ ...r, dayShort: trimDay(r.day) }));
  const biz = props.businessesByDay.map((r) => ({ ...r, dayShort: trimDay(r.day) }));
  const views = props.viewsByDay.map((r) => ({ ...r, dayShort: trimDay(r.day) }));

  return (
    <motion.div
      id="analytics"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="grid min-w-0 gap-4 lg:grid-cols-2"
    >
      <DashboardGlassCard className="min-w-0 p-4">
        <h3 className="text-sm font-bold text-white">Inscriptions (30 j.)</h3>
        <p className="text-xs text-white/55">Nouveaux comptes utilisateurs</p>
        <div className="mt-3 h-64 min-h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={signups}>
              <defs>
                <linearGradient id="gSign" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="dayShort" tick={axisStyle} />
              <YAxis tick={axisStyle} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="rgb(6,182,212)" fill="url(#gSign)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardGlassCard>

      <DashboardGlassCard className="min-w-0 p-4">
        <h3 className="text-sm font-bold text-white">Nouveaux business (30 j.)</h3>
        <p className="text-xs text-white/55">Croissance des fiches publiées</p>
        <div className="mt-3 h-64 min-h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={biz}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="dayShort" tick={axisStyle} />
              <YAxis tick={axisStyle} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="rgba(124,58,237,0.75)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardGlassCard>

      <DashboardGlassCard className="min-w-0 p-4">
        <h3 className="text-sm font-bold text-white">Vues marketplace (30 j.)</h3>
        <p className="text-xs text-white/55">Volume d’affichages business</p>
        <div className="mt-3 h-64 min-h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={views}>
              <defs>
                <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="dayShort" tick={axisStyle} />
              <YAxis tick={axisStyle} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="rgb(34,211,238)" fill="url(#gView)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardGlassCard>

      <DashboardGlassCard className="min-w-0 p-4">
        <h3 className="text-sm font-bold text-white">Top villes & catégories</h3>
        <p className="text-xs text-white/55">Répartition des business</p>
        <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="h-64 min-h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={props.topCities} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={axisStyle} />
                <YAxis type="category" dataKey="name" width={72} tick={{ ...axisStyle, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="rgba(6,182,212,0.65)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64 min-h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={props.topCategories} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={axisStyle} />
                <YAxis type="category" dataKey="name" width={72} tick={{ ...axisStyle, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="rgba(124,58,237,0.65)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DashboardGlassCard>
    </motion.div>
  );
}
