"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { exercises, CATEGORIES, CATEGORY_LABEL_ES } from "@/lib/exercises";
import ExerciseGif from "@/components/ExerciseGif";

const PAGE_SIZE = 30;

export default function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (category && e.category !== category) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.target.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
        Ejercicios
      </p>

      <div className="flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-visible)" }}>
        <Search size={16} strokeWidth={1.5} style={{ color: "var(--text-disabled)" }} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="BUSCAR EJERCICIO O MÚSCULO"
          className="w-full bg-transparent py-2.5 font-mono text-xs uppercase tracking-[0.04em] outline-none placeholder:text-[var(--text-disabled)]"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          onClick={() => {
            setCategory(null);
            setVisible(PAGE_SIZE);
          }}
          className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em]"
          style={
            category === null
              ? { background: "var(--text-display)", color: "var(--black)" }
              : { border: "1px solid var(--border-visible)", color: "var(--text-secondary)" }
          }
        >
          Todos
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setVisible(PAGE_SIZE);
            }}
            className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em]"
            style={
              category === c
                ? { background: "var(--text-display)", color: "var(--black)" }
                : { border: "1px solid var(--border-visible)", color: "var(--text-secondary)" }
            }
          >
            {CATEGORY_LABEL_ES[c] ?? c}
          </button>
        ))}
      </div>

      <p className="font-mono text-[11px]" style={{ color: "var(--text-disabled)" }}>
        {String(filtered.length).padStart(4, "0")} encontrados
      </p>

      <ul>
        {shown.map((ex) => (
          <li key={ex.id} style={{ borderTop: "1px solid var(--border)" }}>
            <Link href={`/ejercicios/${ex.id}`} className="flex items-center gap-3 py-3">
              <ExerciseGif src={ex.image} alt={ex.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                  {ex.name}
                </p>
                <p className="truncate font-mono text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                  {ex.target} · {ex.equipment}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {visible < filtered.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ border: "1px solid var(--border-visible)", color: "var(--text-primary)" }}
        >
          Cargar más
        </button>
      )}
    </div>
  );
}
