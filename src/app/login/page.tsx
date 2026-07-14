"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Cuenta creada. Revisa tu correo para confirmar tu dirección antes de iniciar sesión.");
      }
    }

    setPending(false);
  }

  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Gym Rankeds
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--text-display)" }}>
          {mode === "login" ? "Entrar" : "Crear cuenta"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Correo
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>
        <label>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-secondary)" }}>
            Contraseña
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none"
            style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-visible)" }}
          />
        </label>

        {error && (
          <p className="font-mono text-[11px]" style={{ color: "var(--accent)" }}>
            [ ERROR ] {error}
          </p>
        )}
        {info && (
          <p className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full py-3 font-mono text-[11px] uppercase tracking-[0.06em] disabled:opacity-40"
          style={{ background: "var(--text-display)", color: "var(--black)" }}
        >
          {pending ? "···" : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
          setInfo(null);
        }}
        className="font-mono text-[11px] uppercase tracking-[0.06em]"
        style={{ color: "var(--text-secondary)" }}
      >
        {mode === "login" ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Entrar"}
      </button>
    </div>
  );
}
