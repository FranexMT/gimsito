"use client";

import { useState } from "react";
import { useWorkoutData } from "@/context/DataContext";

export default function LogSetForm({ exerciseId }: { exerciseId: string }) {
  const { addLog } = useWorkoutData();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weightNum = Number(weight);
    const repsNum = Number(reps);
    if (!repsNum || repsNum <= 0) return;
    if (weightNum < 0) return;

    setPending(true);
    setError(null);
    try {
      await addLog(exerciseId, weightNum, repsNum);
      setWeight("");
      setReps("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Registrar serie
      </p>
      <div className="flex gap-4">
        <label className="flex-1">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Peso (kg)
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent py-2 font-mono text-sm outline-none placeholder:text-[var(--text-disabled)]"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>
        <label className="flex-1">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Repeticiones
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full bg-transparent py-2 font-mono text-sm outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>
      </div>
      {error && (
        <p className="font-mono text-[11px]" style={{ color: "var(--accent)" }}>
          [ ERROR ] {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em] disabled:opacity-40"
        style={{ background: "var(--text-display)", color: "var(--black)" }}
      >
        {saved ? "[ Guardado ]" : pending ? "···" : "Guardar serie"}
      </button>
    </form>
  );
}
