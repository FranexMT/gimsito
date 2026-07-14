"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { estimateOneRepMax } from "@/lib/oneRepMax";
import { ACHIEVEMENTS, isUnlocked, type AchievementContext } from "@/lib/achievements";
import type { WorkoutLog } from "@/types/exercise";

interface ProfileData {
  name: string;
  heightCm: number | null;
  bodyWeightKg: number;
  avatarUrl: string | null;
}

interface WorkoutLogRow {
  id: number;
  exercise_id: string;
  weight: number;
  reps: number;
  one_rep_max: number;
  performed_at: string;
}

interface ProfileRow {
  display_name: string | null;
  height_cm: number | null;
  body_weight_kg: number | null;
  avatar_url: string | null;
}

interface DataContextValue {
  logs: WorkoutLog[];
  profile: ProfileData;
  unlockedAchievementIds: Set<string>;
  loading: boolean;
  addLog: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  updateProfile: (partial: Partial<{ name: string; heightCm: number | null; bodyWeightKg: number }>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const DEFAULT_PROFILE: ProfileData = { name: "", heightCm: null, bodyWeightKg: 70, avatarUrl: null };

function rowToLog(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    weight: Number(row.weight),
    reps: row.reps,
    date: row.performed_at,
    oneRepMax: Number(row.one_rep_max),
  };
}

function rowToProfile(row: ProfileRow): ProfileData {
  return {
    name: row.display_name ?? "",
    heightCm: row.height_cm,
    bodyWeightKg: Number(row.body_weight_kg ?? 70),
    avatarUrl: row.avatar_url,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setProfile(DEFAULT_PROFILE);
      setUnlockedAchievementIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);

    const [logsRes, profileRes, achievementsRes] = await Promise.all([
      supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("performed_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("achievements_unlocked").select("achievement_id").eq("user_id", user.id),
    ]);

    setLogs(((logsRes.data as WorkoutLogRow[] | null) ?? []).map(rowToLog));
    if (profileRes.data) {
      setProfile(rowToProfile(profileRes.data as ProfileRow));
    }
    setUnlockedAchievementIds(
      new Set(((achievementsRes.data as { achievement_id: string }[] | null) ?? []).map((r) => r.achievement_id))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // refresh() es async; setState ocurre tras el await, no de forma sincrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Detecta logros recién desbloqueados y los persiste en segundo plano.
  useEffect(() => {
    if (!user || loading) return;
    const ctx: AchievementContext = { logs, bodyWeightKg: profile.bodyWeightKg };
    const newlyUnlocked = ACHIEVEMENTS.filter((a) => !unlockedAchievementIds.has(a.id) && isUnlocked(a, ctx));
    if (newlyUnlocked.length === 0) return;

    (async () => {
      const rows = newlyUnlocked.map((a) => ({ user_id: user.id, achievement_id: a.id }));
      const { error } = await supabase
        .from("achievements_unlocked")
        .upsert(rows, { onConflict: "user_id,achievement_id" });
      if (!error) {
        setUnlockedAchievementIds((prev) => {
          const next = new Set(prev);
          newlyUnlocked.forEach((a) => next.add(a.id));
          return next;
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, profile.bodyWeightKg, user, loading]);

  async function addLog(exerciseId: string, weight: number, reps: number) {
    if (!user) return;
    const oneRepMax = estimateOneRepMax(weight, reps);
    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      exercise_id: exerciseId,
      weight,
      reps,
      one_rep_max: oneRepMax,
      performed_at: new Date().toISOString(),
    });
    if (error) throw error;
    await refresh();
  }

  async function updateProfile(partial: Partial<{ name: string; heightCm: number | null; bodyWeightKg: number }>) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: partial.name,
        height_cm: partial.heightCm,
        body_weight_kg: partial.bodyWeightKg,
      })
      .eq("id", user.id);
    if (error) throw error;
    await refresh();
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    if (error) throw error;
    await refresh();
  }

  async function clearAllData() {
    if (!user) return;
    const { error } = await supabase.from("workout_logs").delete().eq("user_id", user.id);
    if (error) throw error;
    await refresh();
  }

  return (
    <DataContext.Provider
      value={{ logs, profile, unlockedAchievementIds, loading, addLog, updateProfile, uploadAvatar, clearAllData }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useWorkoutData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useWorkoutData debe usarse dentro de DataProvider");
  return ctx;
}
