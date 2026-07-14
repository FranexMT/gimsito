"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.replace("/"), 1500);
  }

  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Gym Rankeds
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--text-display)" }}>
          Nueva contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Contraseña nueva
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>
        <label>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Confirmar contraseña
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>

        {error && (
          <p className="font-mono text-[11px]" style={{ color: "var(--accent)" }}>
            [ ERROR ] {error}
          </p>
        )}
        {done && (
          <p className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
            [ Contraseña actualizada ] Redirigiendo...
          </p>
        )}

        <button
          type="submit"
          disabled={pending || done}
          className="rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em] disabled:opacity-40"
          style={{ background: "var(--text-display)", color: "var(--black)" }}
        >
          {pending ? "···" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
