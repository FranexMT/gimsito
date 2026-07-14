"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { estimateOneRepMax } from "@/lib/oneRepMax";
import { ACHIEVEMENTS, isUnlocked, type AchievementContext } from "@/lib/achievements";
import { computeExerciseRank, tierScore, globalLevel } from "@/lib/ranking";
import { getExerciseById } from "@/lib/exercises";
import type { WorkoutLog } from "@/types/exercise";

interface ProfileData {
  name: string;
  heightCm: number | null;
  bodyWeightKg: number;
  avatarUrl: string | null;
  globalScore: number;
  globalLevelLabel: string | null;
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
  global_score: number | null;
  global_level: string | null;
}

interface DataContextValue {
  logs: WorkoutLog[];
  profile: ProfileData;
  unlockedAchievementIds: Set<string>;
  loading: boolean;
  addLog: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  updateLog: (id: number, weight: number, reps: number) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  updateProfile: (partial: Partial<{ name: string; heightCm: number | null; bodyWeightKg: number }>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const DEFAULT_PROFILE: ProfileData = {
  name: "",
  heightCm: null,
  bodyWeightKg: 70,
  avatarUrl: null,
  globalScore: 0,
  globalLevelLabel: null,
};

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
    globalScore: row.global_score ?? 0,
    globalLevelLabel: row.global_level,
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

  // Recalcula el puntaje/nivel global y lo guarda en el propio perfil (publico
  // de solo lectura) para que el leaderboard pueda ordenar sin leer logs ajenos.
  useEffect(() => {
    if (!user || loading) return;
    const exerciseIds = Array.from(new Set(logs.map((l) => l.exerciseId)));
    const ranks = exerciseIds.map((id) => computeExerciseRank(getExerciseById(id)!, logs, profile.bodyWeightKg));
    const totalScore = ranks.reduce((sum, r) => sum + tierScore(r.tier), 0);
    const avgTier = ranks.length > 0 ? totalScore / ranks.length : 0;
    const levelLabel = ranks.length > 0 ? globalLevel(avgTier) : null;

    if (totalScore === profile.globalScore && levelLabel === profile.globalLevelLabel) return;

    (async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ global_score: totalScore, global_level: levelLabel })
        .eq("id", user.id);
      if (!error) {
        setProfile((prev) => ({ ...prev, globalScore: totalScore, globalLevelLabel: levelLabel }));
      }
    })();
  }, [logs, profile.bodyWeightKg, profile.globalScore, profile.globalLevelLabel, user, loading]);

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

  async function updateLog(id: number, weight: number, reps: number) {
    if (!user) return;
    const oneRepMax = estimateOneRepMax(weight, reps);
    const { error } = await supabase
      .from("workout_logs")
      .update({ weight, reps, one_rep_max: oneRepMax })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    await refresh();
  }

  async function deleteLog(id: number) {
    if (!user) return;
    const { error } = await supabase.from("workout_logs").delete().eq("id", id).eq("user_id", user.id);
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
      value={{
        logs,
        profile,
        unlockedAchievementIds,
        loading,
        addLog,
        updateLog,
        deleteLog,
        updateProfile,
        uploadAvatar,
        clearAllData,
      }}
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
