interface CrowdLevelBadgeProps { level: string | null }

const CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: "Not crowded",  color: "#3b82f6", bg: "#3b82f615" },
  MEDIUM: { label: "Moderate",     color: "#f59e0b", bg: "#f59e0b15" },
  HIGH:   { label: "Very crowded", color: "#ef4444", bg: "#ef444415" },
};

export function CrowdLevelBadge({ level }: CrowdLevelBadgeProps) {
  if (!level) {
    return <span className="text-sm text-muted-foreground">No crowd reports yet</span>;
  }

  const { label, color, bg } = CONFIG[level] ?? { label: level, color: "#94a3b8", bg: "#94a3b815" };

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border"
      style={{ color, background: bg, borderColor: color + "30" }}
    >
      {label}
    </span>
  );
}
