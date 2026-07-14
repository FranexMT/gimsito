"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorkoutData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { exercises } from "@/lib/exercises";
import { computeExerciseRank, tierScore } from "@/lib/ranking";
import TierBadge from "@/components/TierBadge";
import ExerciseGif from "@/components/ExerciseGif";

const SEGMENTS = 10;

function SegmentedBar({ progress }: { progress: number }) {
  const filled = Math.round(progress * SEGMENTS);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1"
          style={{ background: i < filled ? "var(--text-display)" : "var(--border)" }}
        />
      ))}
    </div>
  );
}

interface GlobalRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  global_score: number;
  global_level: string | null;
}

function GlobalLeaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<GlobalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, global_score, global_level")
        .order("global_score", { ascending: false })
        .limit(50);
      setRows((data as GlobalRow[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <p className="font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
        [ Cargando ]
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
        Nadie ha rankeado ejercicios todavía.
      </p>
    );
  }

  return (
    <ul>
      {rows.map((r, i) => {
        const isMe = r.id === user?.id;
        const initial = (r.display_name ?? "").trim().charAt(0).toUpperCase() || "?";
        return (
          <li
            key={r.id}
            className="flex items-center gap-3 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="w-4 shrink-0 font-mono text-[11px]" style={{ color: "var(--text-disabled)" }}>
              {i + 1}
            </span>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg font-mono text-xs"
              style={{ border: "1px solid var(--border-visible)", color: "var(--text-primary)" }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm" style={{ color: isMe ? "var(--text-display)" : "var(--text-primary)" }}>
                {r.display_name?.trim() || "Sin nombre"} {isMe && "(TÚ)"}
              </p>
              <p className="font-mono text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>
                {r.global_level ?? "Sin rango"}
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
              {r.global_score}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function RankingPage() {
  const { logs, profile, loading } = useWorkoutData();
  const [tab, setTab] = useState<"personal" | "global">("personal");
  const bodyWeight = profile.bodyWeightKg;

  if (loading) {
    return (
      <p className="font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
        [ Cargando ]
      </p>
    );
  }

  const loggedExerciseIds = new Set(logs.map((l) => l.exerciseId));
  const rankedExercises = exercises
    .filter((e) => loggedExerciseIds.has(e.id))
    .map((e) => ({ exercise: e, rank: computeExerciseRank(e, logs, bodyWeight) }))
    .sort((a, b) => {
      const tierDiff = tierScore(b.rank.tier) - tierScore(a.rank.tier);
      if (tierDiff !== 0) return tierDiff;
      return b.rank.progressToNextTier - a.rank.progressToNextTier;
    });

  const totalScore = rankedExercises.reduce((sum, r) => sum + tierScore(r.rank.tier), 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Ranking
      </p>

      <div className="flex rounded-full p-1" style={{ border: "1px solid var(--border-visible)" }}>
        {(["personal", "global"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 rounded-full py-2 font-mono text-[11px] uppercase tracking-[0.06em]"
            style={
              tab === t
                ? { background: "var(--text-display)", color: "var(--black)" }
                : { color: "var(--text-secondary)" }
            }
          >
            {t === "personal" ? "Personal" : "Global"}
          </button>
        ))}
      </div>

      {tab === "personal" ? (
        <>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
                Puntaje total
              </p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 48, color: "var(--text-display)", lineHeight: 1 }}>
                {totalScore}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
                Rankeados
              </p>
              <p className="font-mono text-lg" style={{ color: "var(--text-primary)" }}>
                {String(rankedExercises.length).padStart(2, "0")}
              </p>
            </div>
          </div>

          {rankedExercises.length === 0 && (
            <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
              Aún no registras series. Ve a un ejercicio y registra tu primera serie.
            </p>
          )}

          <ul>
            {rankedExercises.map(({ exercise, rank }, i) => (
              <li key={exercise.id} style={{ borderTop: "1px solid var(--border)" }}>
                <Link href={`/ejercicios/${exercise.id}`} className="flex items-center gap-3 py-3">
                  <span className="w-4 shrink-0 font-mono text-[11px]" style={{ color: "var(--text-disabled)" }}>
                    {i + 1}
                  </span>
                  <ExerciseGif src={exercise.image} alt={exercise.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                      {exercise.name}
                    </p>
                    <div className="mt-1.5">
                      <SegmentedBar progress={rank.progressToNextTier} />
                    </div>
                  </div>
                  <TierBadge tier={rank.tier} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <GlobalLeaderboard />
      )}
    </div>
  );
}
