import type { WorkoutLog } from "@/types/exercise";
import { getExerciseById } from "@/lib/exercises";
import { computeExerciseRank, tierScore } from "@/lib/ranking";

export type AchievementCategory = "constancia" | "fuerza" | "exploracion" | "volumen";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  target: number;
  progress: (ctx: AchievementContext) => number;
  rare?: boolean;
}

export interface AchievementContext {
  logs: WorkoutLog[];
  bodyWeightKg: number;
}

function longestStreakDays(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0;
  const days = Array.from(new Set(logs.map((l) => l.date.slice(0, 10)))).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    current = diff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function rankedExerciseIds(logs: WorkoutLog[]): string[] {
  return Array.from(new Set(logs.map((l) => l.exerciseId)));
}

function maxTierScore(logs: WorkoutLog[], bodyWeightKg: number): number {
  const ids = rankedExerciseIds(logs);
  let max = 0;
  for (const id of ids) {
    const ex = getExerciseById(id);
    if (!ex) continue;
    const rank = computeExerciseRank(ex, logs, bodyWeightKg);
    max = Math.max(max, tierScore(rank.tier));
  }
  return max;
}

function distinctCategories(logs: WorkoutLog[]): number {
  const ids = rankedExerciseIds(logs);
  const cats = new Set(ids.map((id) => getExerciseById(id)?.category).filter(Boolean));
  return cats.size;
}

function totalVolume(logs: WorkoutLog[]): number {
  return logs.reduce((sum, l) => sum + l.weight * l.reps, 0);
}

export const ACHIEVEMENTS: Achievement[] = [
  // Constancia
  {
    id: "primer-registro",
    category: "constancia",
    name: "Primer registro",
    description: "Registra tu primera serie",
    target: 1,
    progress: (ctx) => Math.min(ctx.logs.length, 1),
  },
  {
    id: "diez-registros",
    category: "constancia",
    name: "En marcha",
    description: "Registra 10 series",
    target: 10,
    progress: (ctx) => Math.min(ctx.logs.length, 10),
  },
  {
    id: "cincuenta-registros",
    category: "constancia",
    name: "Constante",
    description: "Registra 50 series",
    target: 50,
    progress: (ctx) => Math.min(ctx.logs.length, 50),
  },
  {
    id: "cien-cincuenta-registros",
    category: "constancia",
    name: "Veterano",
    description: "Registra 150 series",
    target: 150,
    progress: (ctx) => Math.min(ctx.logs.length, 150),
    rare: true,
  },
  {
    id: "racha-3",
    category: "constancia",
    name: "Racha de 3",
    description: "Entrena 3 días seguidos",
    target: 3,
    progress: (ctx) => Math.min(longestStreakDays(ctx.logs), 3),
  },
  {
    id: "racha-7",
    category: "constancia",
    name: "Racha de 7",
    description: "Entrena 7 días seguidos",
    target: 7,
    progress: (ctx) => Math.min(longestStreakDays(ctx.logs), 7),
    rare: true,
  },

  // Fuerza (niveles alcanzados)
  {
    id: "rango-bronce",
    category: "fuerza",
    name: "Bronce",
    description: "Alcanza rango bronce en algún ejercicio",
    target: 1,
    progress: (ctx) => Math.min(maxTierScore(ctx.logs, ctx.bodyWeightKg), 1),
  },
  {
    id: "rango-plata",
    category: "fuerza",
    name: "Plata",
    description: "Alcanza rango plata en algún ejercicio",
    target: 2,
    progress: (ctx) => Math.min(maxTierScore(ctx.logs, ctx.bodyWeightKg), 2),
  },
  {
    id: "rango-oro",
    category: "fuerza",
    name: "Oro",
    description: "Alcanza rango oro en algún ejercicio",
    target: 3,
    progress: (ctx) => Math.min(maxTierScore(ctx.logs, ctx.bodyWeightKg), 3),
  },
  {
    id: "rango-platino",
    category: "fuerza",
    name: "Platino",
    description: "Alcanza rango platino en algún ejercicio",
    target: 4,
    progress: (ctx) => Math.min(maxTierScore(ctx.logs, ctx.bodyWeightKg), 4),
    rare: true,
  },
  {
    id: "rango-diamante",
    category: "fuerza",
    name: "Diamante",
    description: "Alcanza rango diamante en algún ejercicio",
    target: 5,
    progress: (ctx) => Math.min(maxTierScore(ctx.logs, ctx.bodyWeightKg), 5),
    rare: true,
  },

  // Exploración
  {
    id: "explorador",
    category: "exploracion",
    name: "Explorador",
    description: "Registra ejercicios de 3 categorías distintas",
    target: 3,
    progress: (ctx) => Math.min(distinctCategories(ctx.logs), 3),
  },
  {
    id: "todoterreno",
    category: "exploracion",
    name: "Todoterreno",
    description: "Registra ejercicios de 6 categorías distintas",
    target: 6,
    progress: (ctx) => Math.min(distinctCategories(ctx.logs), 6),
    rare: true,
  },
  {
    id: "coleccionista",
    category: "exploracion",
    name: "Coleccionista",
    description: "Registra 10 ejercicios distintos",
    target: 10,
    progress: (ctx) => Math.min(rankedExerciseIds(ctx.logs).length, 10),
  },
  {
    id: "enciclopedia",
    category: "exploracion",
    name: "Enciclopedia",
    description: "Registra 25 ejercicios distintos",
    target: 25,
    progress: (ctx) => Math.min(rankedExerciseIds(ctx.logs).length, 25),
    rare: true,
  },

  // Volumen
  {
    id: "media-tonelada",
    category: "volumen",
    name: "Media tonelada",
    description: "Acumula 500 kg de volumen total",
    target: 500,
    progress: (ctx) => Math.min(totalVolume(ctx.logs), 500),
  },
  {
    id: "una-tonelada",
    category: "volumen",
    name: "Una tonelada",
    description: "Acumula 1,000 kg de volumen total",
    target: 1000,
    progress: (ctx) => Math.min(totalVolume(ctx.logs), 1000),
  },
  {
    id: "diez-toneladas",
    category: "volumen",
    name: "Diez toneladas",
    description: "Acumula 10,000 kg de volumen total",
    target: 10000,
    progress: (ctx) => Math.min(totalVolume(ctx.logs), 10000),
    rare: true,
  },
];

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  constancia: "Constancia",
  fuerza: "Fuerza",
  exploracion: "Exploración",
  volumen: "Volumen",
};

export function isUnlocked(achievement: Achievement, ctx: AchievementContext): boolean {
  return achievement.progress(ctx) >= achievement.target;
}

export function countUnlocked(ctx: AchievementContext): number {
  return ACHIEVEMENTS.filter((a) => isUnlocked(a, ctx)).length;
}
