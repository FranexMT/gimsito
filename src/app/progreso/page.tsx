"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { db } from "@/lib/db";
import { getExerciseById } from "@/lib/exercises";

export default function ProgressPage() {
  const logs = useLiveQuery(() => db.logs.toArray(), []);
  const [selected, setSelected] = useState<string | null>(null);

  const exerciseOptions = useMemo(() => {
    if (!logs) return [];
    const ids = Array.from(new Set(logs.map((l) => l.exerciseId)));
    return ids
      .map((id) => getExerciseById(id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [logs]);

  const activeId = selected ?? exerciseOptions[0]?.id ?? null;

  const activeLogs = useMemo(
    () => (logs && activeId ? logs.filter((l) => l.exerciseId === activeId).sort((a, b) => a.date.localeCompare(b.date)) : []),
    [logs, activeId]
  );

  const usesWeight = activeLogs.some((l) => l.weight > 0);

  const chartData = useMemo(
    () =>
      activeLogs.map((l) => ({
        date: new Date(l.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
        value: usesWeight ? l.oneRepMax : l.reps,
      })),
    [activeLogs, usesWeight]
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Progreso
      </p>

      {exerciseOptions.length === 0 && (
        <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
          Registra series en algún ejercicio para ver tu progreso aquí.
        </p>
      )}

      {exerciseOptions.length > 0 && (
        <>
          <select
            value={activeId ?? ""}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-transparent py-2.5 font-mono text-xs uppercase tracking-[0.04em] outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          >
            {exerciseOptions.map((e) => (
              <option key={e.id} value={e.id} style={{ background: "var(--surface)" }}>
                {e.name}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
              {usesWeight ? "1RM estimado (kg)" : "Repeticiones"}
            </p>
            {chartData.length > 0 && (
              <p style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text-display)" }}>
                {chartData[chartData.length - 1].value}
              </p>
            )}
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "var(--border-visible)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-visible)",
                    borderRadius: 0,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                  itemStyle={{ color: "var(--text-display)" }}
                />
                <Line
                  type="linear"
                  dataKey="value"
                  name={usesWeight ? "1RM (kg)" : "Repeticiones"}
                  stroke="var(--text-display)"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: "var(--text-display)", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
