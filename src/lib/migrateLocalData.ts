import { db } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";

const MIGRATION_FLAG = "gym-rankeds:migrated";

/** Sube los datos que existan en el Dexie local de este navegador (de antes de
 * tener cuentas) a la cuenta recién iniciada, una sola vez por navegador. */
export async function migrateLocalDataIfNeeded(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  try {
    const logs = await db.logs.toArray();
    const bodyWeightSetting = await db.settings.get("bodyWeight");
    const profileSetting = await db.settings.get("profile");

    if (logs.length > 0) {
      const rows = logs.map((l) => ({
        user_id: userId,
        exercise_id: l.exerciseId,
        weight: l.weight,
        reps: l.reps,
        one_rep_max: l.oneRepMax,
        performed_at: l.date,
      }));
      const { error } = await supabase.from("workout_logs").insert(rows);
      if (error) throw error;
    }

    if (bodyWeightSetting?.bodyWeightKg || profileSetting?.name || profileSetting?.heightCm) {
      const { error } = await supabase
        .from("profiles")
        .update({
          body_weight_kg: bodyWeightSetting?.bodyWeightKg,
          display_name: profileSetting?.name || undefined,
          height_cm: profileSetting?.heightCm ?? undefined,
        })
        .eq("id", userId);
      if (error) throw error;
    }

    localStorage.setItem(MIGRATION_FLAG, "done");
    await db.delete();
  } catch (err) {
    console.error("Migración de datos locales falló", err);
  }
}
