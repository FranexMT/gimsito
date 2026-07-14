import type { WorkoutLog } from "@/types/exercise";

export interface DayGroup {
  dateKey: string; // YYYY-MM-DD
  logs: WorkoutLog[];
  exerciseCount: number;
}

/** Agrupa logs por dia calendario (mas reciente primero), sin depender de una tabla de "sesiones". */
export function groupLogsByDay(logs: WorkoutLog[]): DayGroup[] {
  const groups = new Map<string, WorkoutLog[]>();

  for (const log of [...logs].sort((a, b) => b.date.localeCompare(a.date))) {
    const dateKey = log.date.slice(0, 10);
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(log);
    } else {
      groups.set(dateKey, [log]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, dayLogs]) => ({
    dateKey,
    logs: dayLogs,
    exerciseCount: new Set(dayLogs.map((l) => l.exerciseId)).size,
  }));
}
