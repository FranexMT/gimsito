"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { exercises } from "@/lib/exercises";
import { computeExerciseRank, tierScore } from "@/lib/ranking";
import TierBadge from "@/components/TierBadge";
import ExerciseGif from "@/components/ExerciseGif";

const SEGMENTS = 10;

function SegmentedBar({ progress }: { progress: number }) {
  const filled = Math.round(progress * SEGMENTS);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1"
          style={{ background: i < filled ? "var(--text-display)" : "var(--border)" }}
        />
      ))}
    </div>
  );
}

export default function RankingPage() {
  const logs = useLiveQuery(() => db.logs.toArray(), []);
  const bodyWeight = useLiveQuery(async () => (await db.settings.get("bodyWeight"))?.bodyWeightKg ?? 70, []);

  if (!logs || bodyWeight === undefined) {
    return (
      <p className="font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
        [ Cargando ]
      </p>
    );
  }

  const loggedExerciseIds = new Set(logs.map((l) => l.exerciseId));
  const rankedExercises = exercises
    .filter((e) => loggedExerciseIds.has(e.id))
    .map((e) => ({ exercise: e, rank: computeExerciseRank(e, logs, bodyWeight) }))
    .sort((a, b) => {
      const tierDiff = tierScore(b.rank.tier) - tierScore(a.rank.tier);
      if (tierDiff !== 0) return tierDiff;
      return b.rank.progressToNextTier - a.rank.progressToNextTier;
    });

  const totalScore = rankedExercises.reduce((sum, r) => sum + tierScore(r.rank.tier), 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Ranking personal
      </p>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Puntaje total
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 48, color: "var(--text-display)", lineHeight: 1 }}>
            {totalScore}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Rankeados
          </p>
          <p className="font-mono text-lg" style={{ color: "var(--text-primary)" }}>
            {String(rankedExercises.length).padStart(2, "0")}
          </p>
        </div>
      </div>

      {rankedExercises.length === 0 && (
        <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
          Aún no registras series. Ve a un ejercicio y registra tu primera serie.
        </p>
      )}

      <ul>
        {rankedExercises.map(({ exercise, rank }, i) => (
          <li key={exercise.id} style={{ borderTop: "1px solid var(--border)" }}>
            <Link href={`/ejercicios/${exercise.id}`} className="flex items-center gap-3 py-3">
              <span className="w-4 shrink-0 font-mono text-[11px]" style={{ color: "var(--text-disabled)" }}>
                {i + 1}
              </span>
              <ExerciseGif src={exercise.image} alt={exercise.name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                  {exercise.name}
                </p>
                <div className="mt-1.5">
                  <SegmentedBar progress={rank.progressToNextTier} />
                </div>
              </div>
              <TierBadge tier={rank.tier} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
