interface ReliabilityBadgeProps { score: number }

export function ReliabilityBadge({ score }: ReliabilityBadgeProps) {
  const pct = Math.round(score * 100);
  const [color, bg] =
    pct >= 70 ? ["#22c55e", "#22c55e18"] :
    pct >= 45 ? ["#f59e0b", "#f59e0b18"] :
                ["#ef4444", "#ef444418"];

  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold border"
      style={{ color, background: bg, borderColor: color + "30" }}
    >
      {pct}%
    </span>
  );
}
