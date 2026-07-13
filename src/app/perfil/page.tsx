"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, setBodyWeight, setProfile, clearAllData } from "@/lib/db";
import { ACHIEVEMENTS, CATEGORY_LABEL, isUnlocked, countUnlocked, type AchievementCategory } from "@/lib/achievements";
import AchievementRow from "@/components/AchievementRow";

const CATEGORIES: AchievementCategory[] = ["constancia", "fuerza", "exploracion", "volumen"];

export default function ProfilePage() {
  const logs = useLiveQuery(() => db.logs.toArray(), []);
  const settings = useLiveQuery(() => db.settings.get("bodyWeight"), []);
  const profileSettings = useLiveQuery(() => db.settings.get("profile"), []);

  const [name, setName] = useState<string | null>(null);
  const [bodyWeight, setBodyWeightInput] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [clearState, setClearState] = useState<"idle" | "confirm" | "done">("idle");

  const displayName = name ?? profileSettings?.name ?? "";
  const displayWeight = bodyWeight ?? String(settings?.bodyWeightKg ?? 70);
  const displayHeight = height ?? (profileSettings?.heightCm != null ? String(profileSettings.heightCm) : "");

  const ctx = useMemo(
    () => ({ logs: logs ?? [], bodyWeightKg: settings?.bodyWeightKg ?? 70 }),
    [logs, settings]
  );

  const unlockedCount = logs ? countUnlocked(ctx) : 0;

  async function handleSave() {
    if (bodyWeight !== null) {
      const n = Number(bodyWeight);
      if (n > 0) await setBodyWeight(n);
    }
    await setProfile({ name: displayName.trim(), heightCm: height !== null && height !== "" ? Number(height) : (profileSettings?.heightCm ?? null) });
  }

  async function handleClear() {
    if (clearState === "idle") {
      setClearState("confirm");
      setTimeout(() => setClearState((s) => (s === "confirm" ? "idle" : s)), 4000);
      return;
    }
    if (clearState === "confirm") {
      await clearAllData();
      setClearState("done");
      setTimeout(() => setClearState("idle"), 2000);
    }
  }

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Perfil
      </p>

      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
          style={{ border: "1px solid var(--border-visible)", fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text-display)" }}
        >
          {initial}
        </div>
        <div className="flex-1">
          <input
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            placeholder="TU NOMBRE"
            className="w-full bg-transparent py-1.5 text-lg outline-none placeholder:text-[var(--text-disabled)]"
            style={{ color: "var(--text-display)", borderBottom: "1px solid var(--border-visible)" }}
          />
          <p className="mt-1.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {unlockedCount}/{ACHIEVEMENTS.length} logros desbloqueados
          </p>
        </div>
      </div>

      <div className="flex gap-4" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <label className="flex-1">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Peso corporal (kg)
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={displayWeight}
            onChange={(e) => setBodyWeightInput(e.target.value)}
            onBlur={handleSave}
            className="w-full bg-transparent py-2 font-mono text-sm outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>
        <label className="flex-1">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Altura (cm)
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={displayHeight}
            onChange={(e) => setHeight(e.target.value)}
            onBlur={handleSave}
            placeholder="—"
            className="w-full bg-transparent py-2 font-mono text-sm outline-none placeholder:text-[var(--text-disabled)]"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>
      </div>

      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Logros
        </p>
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="pt-3 font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-disabled)" }}>
              {CATEGORY_LABEL[cat]}
            </p>
            <ul>
              {ACHIEVEMENTS.filter((a) => a.category === cat).map((a) => (
                <AchievementRow key={a.id} achievement={a} progress={logs ? a.progress(ctx) : 0} unlocked={logs ? isUnlocked(a, ctx) : false} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <button
          onClick={handleClear}
          className="w-full rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{
            border: `1px solid ${clearState === "idle" ? "var(--border-visible)" : "var(--accent)"}`,
            color: clearState === "idle" ? "var(--text-secondary)" : "var(--accent)",
          }}
        >
          {clearState === "idle" && "Borrar todos los datos"}
          {clearState === "confirm" && "¿Seguro? Toca de nuevo"}
          {clearState === "done" && "[ Borrado ]"}
        </button>
      </div>
    </div>
  );
}
