"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Trophy, LineChart, User } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/progreso", label: "Progreso", icon: LineChart },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black pb-[env(safe-area-inset-bottom)]"
      style={{ borderTop: "1px solid var(--border-visible)" }}
    >
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1.5 py-3 transition-colors"
                style={{ color: active ? "var(--text-display)" : "var(--text-disabled)" }}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase">{label}</span>
                <span
                  className="h-[3px] w-[3px] rounded-full"
                  style={{ background: active ? "var(--text-display)" : "transparent" }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
