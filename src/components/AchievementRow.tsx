import { Award } from "lucide-react";
import type { Achievement } from "@/lib/achievements";

export default function AchievementRow({
  achievement,
  progress,
  unlocked,
}: {
  achievement: Achievement;
  progress: number;
  unlocked: boolean;
}) {
  const color = unlocked ? "var(--text-display)" : "var(--text-disabled)";

  return (
    <li className="flex items-center gap-3 py-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ border: `1px solid ${unlocked ? "var(--border-visible)" : "var(--border)"}` }}
      >
        <Award size={18} strokeWidth={1.5} style={{ color }} />
        {achievement.rare && unlocked && (
          <span
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm" style={{ color }}>
          {achievement.name}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--text-secondary)" }}>
          {achievement.description}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px]" style={{ color: unlocked ? "var(--text-primary)" : "var(--text-disabled)" }}>
        {Math.min(progress, achievement.target)}/{achievement.target}
      </span>
    </li>
  );
}
