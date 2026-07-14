"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { listRoutines, createRoutine, deleteRoutine, type Routine } from "@/lib/routines";

export default function RoutinesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    setRoutines(await listRoutines(user.id));
    setLoading(false);
  }

  useEffect(() => {
    // refresh() es async; setState ocurre tras el await, no de forma sincrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // Se ejecuta solo cuando cambia el usuario; refresh() no necesita estar en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const id = await createRoutine(user.id, name.trim());
      router.push(`/rutinas/${id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((curr) => (curr === id ? null : curr)), 3000);
      return;
    }
    setConfirmDeleteId(null);
    await deleteRoutine(id);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Rutinas
      </p>

      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="NUEVA RUTINA"
          className="flex-1 bg-transparent py-2 font-mono text-xs uppercase tracking-[0.04em] outline-none placeholder:text-[var(--text-disabled)]"
          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.06em] disabled:opacity-40"
          style={{ background: "var(--text-display)", color: "var(--black)" }}
        >
          {creating ? "···" : "Crear"}
        </button>
      </form>

      {!loading && routines.length === 0 && (
        <p className="py-16 text-center font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
          Aún no tienes rutinas. Crea una arriba.
        </p>
      )}

      <ul>
        {routines.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <Link href={`/rutinas/${r.id}`} className="min-w-0 flex-1">
              <p className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                {r.name}
              </p>
              <p className="font-mono text-[10px] uppercase" style={{ color: "var(--text-disabled)" }}>
                {new Date(r.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em]"
              style={{ color: confirmDeleteId === r.id ? "var(--accent)" : "var(--text-disabled)" }}
            >
              {confirmDeleteId === r.id ? "¿Seguro?" : "Borrar"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
