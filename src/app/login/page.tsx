"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Cuenta creada. Revisa tu correo para confirmar tu dirección antes de iniciar sesión.");
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Si ese correo tiene una cuenta, te enviamos un enlace para restablecer tu contraseña.");
      }
    }

    setPending(false);
  }

  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Recuperar acceso";

  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-secondary)" }}>
          Gym Rankeds
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--text-display)" }}>{title}</p>
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

        {mode !== "forgot" && (
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
        )}

        {mode === "login" && (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="self-start font-mono text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--text-disabled)" }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

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
          {pending ? "···" : mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}
        </button>
      </form>

      {mode === "forgot" ? (
        <button
          onClick={() => switchMode("login")}
          className="font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ color: "var(--text-secondary)" }}
        >
          Volver a entrar
        </button>
      ) : (
        <button
          onClick={() => switchMode(mode === "login" ? "signup" : "login")}
          className="font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {mode === "login" ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Entrar"}
        </button>
      )}
    </div>
  );
}
