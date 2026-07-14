import { supabase } from "@/lib/supabaseClient";

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface RoutineExerciseItem {
  id: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
}

interface RoutineRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface RoutineExerciseRow {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
}

function rowToRoutine(row: RoutineRow): Routine {
  return { id: row.id, name: row.name, description: row.description, createdAt: row.created_at };
}

function rowToRoutineExercise(row: RoutineExerciseRow): RoutineExerciseItem {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    orderIndex: row.order_index,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeight: row.target_weight,
  };
}

export async function listRoutines(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as RoutineRow[] | null) ?? []).map(rowToRoutine);
}

export async function createRoutine(userId: string, name: string): Promise<string> {
  const { data, error } = await supabase.from("routines").insert({ user_id: userId, name }).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateRoutine(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("routines").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) throw error;
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const { data, error } = await supabase.from("routines").select("*").eq("id", id).single();
  if (error) return null;
  return rowToRoutine(data as RoutineRow);
}

export async function listRoutineExercises(routineId: string): Promise<RoutineExerciseItem[]> {
  const { data, error } = await supabase
    .from("routine_exercises")
    .select("*")
    .eq("routine_id", routineId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return ((data as RoutineExerciseRow[] | null) ?? []).map(rowToRoutineExercise);
}

export async function addRoutineExercise(
  routineId: string,
  exerciseId: string,
  nextOrderIndex: number,
  targets: { sets: number | null; reps: number | null; weight: number | null }
): Promise<void> {
  const { error } = await supabase.from("routine_exercises").insert({
    routine_id: routineId,
    exercise_id: exerciseId,
    order_index: nextOrderIndex,
    target_sets: targets.sets,
    target_reps: targets.reps,
    target_weight: targets.weight,
  });
  if (error) throw error;
}

export async function updateRoutineExerciseTargets(
  id: string,
  targets: { sets: number | null; reps: number | null; weight: number | null }
): Promise<void> {
  const { error } = await supabase
    .from("routine_exercises")
    .update({ target_sets: targets.sets, target_reps: targets.reps, target_weight: targets.weight })
    .eq("id", id);
  if (error) throw error;
}

export async function removeRoutineExercise(id: string): Promise<void> {
  const { error } = await supabase.from("routine_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderRoutineExercises(items: { id: string; orderIndex: number }[]): Promise<void> {
  await Promise.all(
    items.map((item) => supabase.from("routine_exercises").update({ order_index: item.orderIndex }).eq("id", item.id))
  );
}
