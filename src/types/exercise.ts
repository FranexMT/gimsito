export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  instructions: {
    es: string[];
    en: string[];
  };
  image: string | null;
  gif: string | null;
}

export interface WorkoutLog {
  id?: number;
  exerciseId: string;
  weight: number;
  reps: number;
  date: string; // ISO date
  oneRepMax: number;
}

export type Tier = "sin_rango" | "bronce" | "plata" | "oro" | "platino" | "diamante";

export interface ExerciseRankInfo {
  exerciseId: string;
  tier: Tier;
  progressToNextTier: number; // 0-1
  currentValue: number; // best 1RM
  nextTierValue: number | null;
  isStandardLift: boolean;
}
