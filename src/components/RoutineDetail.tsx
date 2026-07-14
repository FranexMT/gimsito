"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { exercises, getExerciseById } from "@/lib/exercises";
import ExerciseGif from "@/components/ExerciseGif";
import {
  getRoutine,
  listRoutineExercises,
  updateRoutine,
  addRoutineExercise,
  removeRoutineExercise,
  updateRoutineExerciseTargets,
  reorderRoutineExercises,
  type Routine,
  type RoutineExerciseItem,
} from "@/lib/routines";

interface Targets {
  sets: string;
  reps: string;
  weight: string;
}

/** Controla sus propios inputs para que un blur no pise el valor recien
 * tecleado en otro campo con datos obsoletos (evita condiciones de carrera). */
function RoutineExerciseRow({
  item,
  index,
  total,
  onMove,
  onRemove,
  onSaveTargets,
}: {
  item: RoutineExerciseItem;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSaveTargets: (id: string, targets: Targets) => void;
}) {
  const ex = getExerciseById(item.exerciseId);
  const [targets, setTargets] = useState<Targets>({
    sets: item.targetSets != null ? String(item.targetSets) : "",
    reps: item.targetReps != null ? String(item.targetReps) : "",
    weight: item.targetWeight != null ? String(item.targetWeight) : "",
  });

  if (!ex) return null;

  return (
    <li className="flex flex-col gap-2 py-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        <ExerciseGif src={ex.image} alt={ex.name} size={40} />
        <Link href={`/ejercicios/${ex.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm capitalize" style={{ color: "var(--text-primary)" }}>
            {ex.name}
          </p>
        </Link>
        <div className="flex shrink-0 flex-col">
          <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} style={{ color: "var(--text-secondary)" }}>
            <ChevronUp size={14} strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} style={{ color: "var(--text-secondary)" }}>
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.06em]"
          style={{ color: "var(--text-disabled)" }}
        >
          Quitar
        </button>
      </div>
      <div className="ml-[52px] flex gap-3">
        <input
          type="number"
          value={targets.sets}
          onChange={(e) => setTargets((t) => ({ ...t, sets: e.target.value }))}
          onBlur={() => onSaveTargets(item.id, targets)}
          placeholder="SETS"
          className="w-16 bg-transparent py-1 font-mono text-[11px] outline-none placeholder:text-[var(--text-disabled)]"
          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}
        />
        <input
          type="number"
          value={targets.reps}
          onChange={(e) => setTargets((t) => ({ ...t, reps: e.target.value }))}
          onBlur={() => onSaveTargets(item.id, targets)}
          placeholder="REPS"
          className="w-16 bg-transparent py-1 font-mono text-[11px] outline-none placeholder:text-[var(--text-disabled)]"
          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}
        />
        <input
          type="number"
          value={targets.weight}
          onChange={(e) => setTargets((t) => ({ ...t, weight: e.target.value }))}
          onBlur={() => onSaveTargets(item.id, targets)}
          placeholder="KG"
          className="w-16 bg-transparent py-1 font-mono text-[11px] outline-none placeholder:text-[var(--text-disabled)]"
          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}
        />
      </div>
    </li>
  );
}

export default function RoutineDetail({ routineId }: { routineId: string }) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function refresh() {
    setLoading(true);
    const [r, i] = await Promise.all([getRoutine(routineId), listRoutineExercises(routineId)]);
    setRoutine(r);
    setItems(i);
    setLoading(false);
  }

  useEffect(() => {
    // refresh() es async; setState ocurre tras el await, no de forma sincrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // Se ejecuta solo cuando cambia routineId; refresh() no necesita estar en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return exercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  async function handleNameBlur() {
    if (name === null || !routine || name.trim() === routine.name) return;
    await updateRoutine(routineId, name.trim());
    await refresh();
  }

  async function handleAddExercise(exerciseId: string) {
    await addRoutineExercise(routineId, exerciseId, items.length, { sets: null, reps: null, weight: null });
    setQuery("");
    await refresh();
  }

  async function handleRemove(itemId: string) {
    await removeRoutineExercise(itemId);
    await refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const a = items[index];
    const b = items[targetIndex];
    await reorderRoutineExercises([
      { id: a.id, orderIndex: b.orderIndex },
      { id: b.id, orderIndex: a.orderIndex },
    ]);
    await refresh();
  }

  async function handleSaveTargets(itemId: string, targets: Targets) {
    await updateRoutineExerciseTargets(itemId, {
      sets: targets.sets === "" ? null : Number(targets.sets),
      reps: targets.reps === "" ? null : Number(targets.reps),
      weight: targets.weight === "" ? null : Number(targets.weight),
    });
  }

  if (loading) {
    return (
      <p className="font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
        [ Cargando ]
      </p>
    );
  }

  if (!routine) {
    return (
      <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
        Rutina no encontrada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        value={name ?? routine.name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        className="w-full bg-transparent py-1.5 text-lg outline-none"
        style={{ color: "var(--text-display)", borderBottom: "1px solid var(--border-visible)" }}
      />

      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Ejercicios
        </p>

        {items.length === 0 && (
          <p className="py-8 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
            Agrega ejercicios abajo para armar tu rutina.
          </p>
        )}

        <ul>
          {items.map((item, index) => (
            <RoutineExerciseRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onMove={handleMove}
              onRemove={handleRemove}
              onSaveTargets={handleSaveTargets}
            />
          ))}
        </ul>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Agregar ejercicio
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="BUSCAR EJERCICIO"
          className="w-full bg-transparent py-2 font-mono text-xs uppercase tracking-[0.04em] outline-none placeholder:text-[var(--text-disabled)]"
          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
        />
        {searchResults.length > 0 && (
          <ul className="mt-2">
            {searchResults.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => handleAddExercise(ex.id)}
                  className="flex w-full items-center gap-3 py-2.5 text-left"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <ExerciseGif src={ex.image} alt={ex.name} size={32} />
                  <span className="truncate text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                    {ex.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
