import raw from "@/data/exercises.json";
import type { Exercise } from "@/types/exercise";

export const exercises = raw as Exercise[];

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export const CATEGORIES = Array.from(new Set(exercises.map((e) => e.category))).sort();
export const EQUIPMENT = Array.from(new Set(exercises.map((e) => e.equipment))).sort();

export const CATEGORY_LABEL_ES: Record<string, string> = {
  back: "Espalda",
  cardio: "Cardio",
  chest: "Pecho",
  "lower arms": "Antebrazos",
  "lower legs": "Piernas (inferior)",
  neck: "Cuello",
  shoulders: "Hombros",
  "upper arms": "Brazos",
  "upper legs": "Piernas (superior)",
  waist: "Abdomen",
};
