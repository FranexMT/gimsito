"use client";

import { useWorkoutData } from "@/context/DataContext";
import { computeExerciseRank } from "@/lib/ranking";
import type { Exercise } from "@/types/exercise";
import ExerciseGif from "@/components/ExerciseGif";
import TierBadge from "@/components/TierBadge";
import LogSetForm from "@/components/LogSetForm";
import { CATEGORY_LABEL_ES } from "@/lib/exercises";

export default function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const { logs: allLogs, profile } = useWorkoutData();
  const logs = allLogs.filter((l) => l.exerciseId === exercise.id).sort((a, b) => b.date.localeCompare(a.date));

  const rank = computeExerciseRank(exercise, allLogs, profile.bodyWeightKg);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <ExerciseGif src={exercise.gif ?? exercise.image} alt={exercise.name} size={76} />
        <div>
          <h1 className="text-lg capitalize leading-tight" style={{ color: "var(--text-display)" }}>
            {exercise.name}
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--text-secondary)" }}>
            {CATEGORY_LABEL_ES[exercise.category] ?? exercise.category} · {exercise.equipment}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge tier={rank.tier} size="sm" />
            {rank.currentValue > 0 && (
              <span className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {rank.isStandardLift && rank.nextTierValue ? `1RM ${rank.currentValue}kg` : `Récord ${rank.currentValue}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Músculo principal
          </p>
          <p className="mt-0.5 text-sm capitalize" style={{ color: "var(--text-primary)" }}>
            {exercise.target}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Sinergistas
          </p>
          <p className="mt-0.5 text-sm capitalize" style={{ color: "var(--text-primary)" }}>
            {exercise.secondaryMuscles.join(", ") || "—"}
          </p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }}>
        <LogSetForm exerciseId={exercise.id} />
      </div>

      {logs.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
            Historial
          </p>
          <ul>
            {logs.slice(0, 8).map((log) => (
              <li
                key={log.id}
                className="flex justify-between py-2 font-mono text-[11px]"
                style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <span>{new Date(log.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
                <span>{log.weight > 0 ? `${log.weight}kg × ${log.reps}` : `${log.reps} rep · peso corporal`}</span>
                {log.weight > 0 && <span style={{ color: "var(--text-primary)" }}>1RM {log.oneRepMax}kg</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {exercise.instructions.es.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
            Instrucciones
          </p>
          <ol className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-primary)" }}>
            {exercise.instructions.es.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 font-mono" style={{ color: "var(--text-disabled)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
