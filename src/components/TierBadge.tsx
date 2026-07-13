import type { Tier } from "@/types/exercise";
import { TIER_LABEL, tierScore, TIER_ORDER } from "@/lib/ranking";

const TIER_COLOR: Record<Tier, string> = {
  sin_rango: "var(--text-disabled)",
  bronce: "var(--text-secondary)",
  plata: "var(--text-secondary)",
  oro: "var(--text-primary)",
  platino: "var(--text-display)",
  diamante: "var(--accent)",
};

export default function TierBadge({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" }) {
  const color = TIER_COLOR[tier];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.08em]"
      style={{
        color,
        border: `1px solid ${color}`,
        padding: size === "sm" ? "3px 8px" : "4px 10px",
        fontSize: size === "sm" ? "10px" : "11px",
      }}
    >
      {tier === "diamante" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {TIER_LABEL[tier]}
    </span>
  );
}

export function TierDots({ tier }: { tier: Tier }) {
  const score = tierScore(tier);
  return (
    <span className="inline-flex items-center gap-[3px]">
      {TIER_ORDER.slice(1).map((t, i) => (
        <span
          key={t}
          className="h-1 w-1 rounded-full"
          style={{ background: i < score ? (t === "diamante" ? "var(--accent)" : "var(--text-display)") : "var(--border-visible)" }}
        />
      ))}
    </span>
  );
}
