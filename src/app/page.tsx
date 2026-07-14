"use client";

import Link from "next/link";
import { Dumbbell, Trophy } from "lucide-react";
import { useWorkoutData } from "@/context/DataContext";
import { exercises, getExerciseById } from "@/lib/exercises";
import { computeExerciseRank, tierScore, globalLevel } from "@/lib/ranking";
import { countUnlocked, ACHIEVEMENTS } from "@/lib/achievements";
import ExerciseGif from "@/components/ExerciseGif";

export default function Home() {
  const { logs, profile, loading } = useWorkoutData();
  const bodyWeight = profile.bodyWeightKg;

  const loggedExerciseIds = loading ? [] : Array.from(new Set(logs.map((l) => l.exerciseId)));
  const ranks = loading ? [] : loggedExerciseIds.map((id) => computeExerciseRank(getExerciseById(id)!, logs, bodyWeight));
  const avgTier = ranks.length > 0 ? ranks.reduce((s, r) => s + tierScore(r.tier), 0) / ranks.length : 0;
  const unlockedCount = loading ? 0 : countUnlocked({ logs, bodyWeightKg: bodyWeight });

  const recentLogs = loading ? [] : [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const initial = profile.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Gym Rankeds / {exercises.length} ejercicios
        </p>
        <Link
          href="/perfil"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs"
          style={{ border: "1px solid var(--border-visible)", color: "var(--text-primary)" }}
        >
          {initial}
        </Link>
      </div>

      <div className="dot-grid-subtle -mx-4 flex flex-col gap-1 px-4 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Tu nivel
        </p>
        <p
          className="leading-none"
          style={{ fontFamily: "var(--font-display)", fontSize: 56, color: "var(--text-display)" }}
        >
          {loading ? "···" : globalLevel(avgTier)}
        </p>
        <p className="mt-1 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
          {loading
            ? ""
            : `${String(loggedExerciseIds.length).padStart(2, "0")} RANKEADOS · ${unlockedCount}/${ACHIEVEMENTS.length} LOGROS`}
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/ejercicios"
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ background: "var(--text-display)", color: "var(--black)" }}
        >
          <Dumbbell size={16} strokeWidth={1.5} />
          Registrar serie
        </Link>
        <Link
          href="/ranking"
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ border: "1px solid var(--border-visible)", color: "var(--text-primary)" }}
        >
          <Trophy size={16} strokeWidth={1.5} />
          Ver ranking
        </Link>
      </div>

      <div>
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Actividad reciente
        </p>

        {!loading && recentLogs.length === 0 && (
          <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
            Sin registros. Ve a Ejercicios y registra tu primera serie.
          </p>
        )}

        <ul>
          {recentLogs.map((log) => {
            const ex = getExerciseById(log.exerciseId);
            if (!ex) return null;
            return (
              <li key={log.id} style={{ borderTop: "1px solid var(--border)" }}>
                <Link href={`/ejercicios/${ex.id}`} className="flex items-center gap-3 py-3">
                  <ExerciseGif src={ex.image} alt={ex.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                      {ex.name}
                    </p>
                    <p className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {log.weight > 0 ? `${log.weight}kg × ${log.reps} · 1RM ${log.oneRepMax}kg` : `${log.reps} rep`}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase" style={{ color: "var(--text-disabled)" }}>
                    {new Date(log.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
