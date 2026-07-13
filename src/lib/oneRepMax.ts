/** Estimación de 1RM con la fórmula de Epley: peso * (1 + reps/30). */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
