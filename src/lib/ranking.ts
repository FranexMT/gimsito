import type { Exercise, ExerciseRankInfo, Tier, WorkoutLog } from "@/types/exercise";

export const TIER_ORDER: Tier[] = ["sin_rango", "bronce", "plata", "oro", "platino", "diamante"];

export const TIER_LABEL: Record<Tier, string> = {
  sin_rango: "Sin rango",
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
  diamante: "Diamante",
};

/** Estándares de fuerza aproximados (múltiplo del peso corporal para 1RM),
 *  inspirados en tablas públicas de fuerza (ej. strengthlevel.com), promediados
 *  y simplificados. Son orientativos, no una prescripción médica. */
interface WeightStandard {
  match: RegExp;
  thresholds: [number, number, number, number]; // bronce, plata, oro, platino (diamante = *1.3 del ultimo)
}

const WEIGHT_STANDARDS: WeightStandard[] = [
  { match: /deadlift|peso muerto/i, thresholds: [0.75, 1.0, 1.5, 2.0] },
  { match: /squat|sentadilla/i, thresholds: [0.5, 0.75, 1.25, 1.75] },
  { match: /bench press|press de banca/i, thresholds: [0.4, 0.6, 1.0, 1.35] },
  { match: /overhead press|shoulder press|military press|press militar/i, thresholds: [0.25, 0.4, 0.6, 0.8] },
  { match: /barbell row|bent over row|remo con barra/i, thresholds: [0.4, 0.6, 0.9, 1.2] },
  { match: /front squat/i, thresholds: [0.4, 0.6, 1.0, 1.4] },
  { match: /hip thrust/i, thresholds: [0.75, 1.1, 1.6, 2.1] },
];

/** Ejercicios de peso corporal donde se rankea por repeticiones en vez de kg. */
interface RepStandard {
  match: RegExp;
  thresholds: [number, number, number, number];
}

const REP_STANDARDS: RepStandard[] = [
  { match: /pull-?up|chin-?up|dominada/i, thresholds: [1, 5, 10, 15] },
  { match: /push-?up|flexion|lagartija/i, thresholds: [5, 15, 30, 50] },
  { match: /\bdip\b/i, thresholds: [3, 8, 15, 25] },
  { match: /plank|plancha/i, thresholds: [15, 30, 60, 120] }, // segundos (usa reps como campo genérico)
];

function tierFromThresholds(value: number, thresholds: [number, number, number, number]): { tier: Tier; progress: number; next: number | null } {
  const [bronze, silver, gold, platinum] = thresholds;
  const diamond = platinum * 1.3;
  if (value < bronze) return { tier: "sin_rango", progress: value / bronze, next: bronze };
  if (value < silver) return { tier: "bronce", progress: (value - bronze) / (silver - bronze), next: silver };
  if (value < gold) return { tier: "plata", progress: (value - silver) / (gold - silver), next: gold };
  if (value < platinum) return { tier: "oro", progress: (value - gold) / (platinum - gold), next: platinum };
  if (value < diamond) return { tier: "platino", progress: (value - platinum) / (diamond - platinum), next: diamond };
  return { tier: "diamante", progress: 1, next: null };
}

/** Tiers "personales" para ejercicios sin estándar público: se basan en cuántas
 *  veces superaste tu propio récord anterior. */
function personalProgressTier(prBeats: number): { tier: Tier; progress: number; next: number | null } {
  const thresholds: [number, number, number, number] = [1, 3, 6, 10];
  return tierFromThresholds(prBeats, thresholds);
}

export function computeExerciseRank(
  exercise: Exercise,
  logs: WorkoutLog[],
  bodyWeightKg: number
): ExerciseRankInfo {
  const exerciseLogs = logs
    .filter((l) => l.exerciseId === exercise.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (exerciseLogs.length === 0) {
    return {
      exerciseId: exercise.id,
      tier: "sin_rango",
      progressToNextTier: 0,
      currentValue: 0,
      nextTierValue: null,
      isStandardLift: false,
    };
  }

  const repStandard = REP_STANDARDS.find((s) => s.match.test(exercise.name));
  if (repStandard) {
    const bestReps = Math.max(...exerciseLogs.map((l) => l.reps));
    const { tier, progress, next } = tierFromThresholds(bestReps, repStandard.thresholds);
    return { exerciseId: exercise.id, tier, progressToNextTier: progress, currentValue: bestReps, nextTierValue: next, isStandardLift: true };
  }

  const weightStandard = WEIGHT_STANDARDS.find((s) => s.match.test(exercise.name));
  const best1RM = Math.max(...exerciseLogs.map((l) => l.oneRepMax));

  if (weightStandard) {
    const ratio = bodyWeightKg > 0 ? best1RM / bodyWeightKg : 0;
    const { tier, progress, next } = tierFromThresholds(ratio, weightStandard.thresholds);
    return {
      exerciseId: exercise.id,
      tier,
      progressToNextTier: progress,
      currentValue: best1RM,
      nextTierValue: next ? Math.round(next * bodyWeightKg) : null,
      isStandardLift: true,
    };
  }

  // Sin estándar público: contar cuántas veces se superó el récord anterior.
  // Si el ejercicio se hace sin peso (peso corporal), se compara por repeticiones.
  const usesWeight = exerciseLogs.some((l) => l.weight > 0);
  const metric = (l: WorkoutLog) => (usesWeight ? l.oneRepMax : l.reps);

  let prBeats = 0;
  let runningBest = 0;
  for (const log of exerciseLogs) {
    const value = metric(log);
    if (value > runningBest) {
      if (runningBest > 0) prBeats++;
      runningBest = value;
    }
  }
  const { tier, progress, next } = personalProgressTier(prBeats);
  return {
    exerciseId: exercise.id,
    tier,
    progressToNextTier: progress,
    currentValue: usesWeight ? best1RM : runningBest,
    nextTierValue: next,
    isStandardLift: false,
  };
}

export function tierScore(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

const GLOBAL_LEVELS = ["Principiante", "Intermedio", "Avanzado", "Experto", "Élite"];

export function globalLevel(averageTierScore: number): string {
  const idx = Math.min(GLOBAL_LEVELS.length - 1, Math.floor(averageTierScore));
  return GLOBAL_LEVELS[idx];
}
