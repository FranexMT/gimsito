"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useWorkoutData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { ACHIEVEMENTS, CATEGORY_LABEL, type AchievementCategory } from "@/lib/achievements";
import AchievementRow from "@/components/AchievementRow";

const CATEGORIES: AchievementCategory[] = ["constancia", "fuerza", "exploracion", "volumen"];

export default function ProfilePage() {
  const { logs, profile, unlockedAchievementIds, updateProfile, uploadAvatar, clearAllData } = useWorkoutData();
  const { signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string | null>(null);
  const [bodyWeight, setBodyWeightInput] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [clearState, setClearState] = useState<"idle" | "confirm" | "done">("idle");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayName = name ?? profile.name;
  const displayWeight = bodyWeight ?? String(profile.bodyWeightKg);
  const displayHeight = height ?? (profile.heightCm != null ? String(profile.heightCm) : "");

  const ctx = useMemo(() => ({ logs, bodyWeightKg: profile.bodyWeightKg }), [logs, profile.bodyWeightKg]);
  const unlockedCount = unlockedAchievementIds.size;

  async function handleSave() {
    await updateProfile({
      name: displayName.trim(),
      heightCm: height !== null && height !== "" ? Number(height) : profile.heightCm,
      bodyWeightKg: bodyWeight !== null && Number(bodyWeight) > 0 ? Number(bodyWeight) : profile.bodyWeightKg,
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
    } catch {
      setAvatarError("No se pudo subir la imagen.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ border: "1px solid var(--border-visible)", fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text-display)" }}
        >
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="Avatar" fill unoptimized className="object-cover" />
          ) : (
            initial
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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
            {uploadingAvatar ? "Subiendo foto..." : `${unlockedCount}/${ACHIEVEMENTS.length} logros desbloqueados`}
          </p>
          {avatarError && (
            <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--accent)" }}>
              [ ERROR ] {avatarError}
            </p>
          )}
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
                <AchievementRow
                  key={a.id}
                  achievement={a}
                  progress={a.progress(ctx)}
                  unlocked={unlockedAchievementIds.has(a.id)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
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
        <button
          onClick={() => signOut()}
          className="w-full rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ color: "var(--text-disabled)" }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
