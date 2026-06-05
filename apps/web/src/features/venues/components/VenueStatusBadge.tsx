import type { VenueStatus } from "@playgrounds/shared";

interface VenueStatusBadgeProps { status: VenueStatus }

const CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:       { label: "Open",       color: "#22c55e", bg: "#22c55e15" },
  CLOSED:     { label: "Closed",     color: "#ef4444", bg: "#ef444415" },
  RENOVATION: { label: "Renovation", color: "#f59e0b", bg: "#f59e0b15" },
  UNKNOWN:    { label: "Unknown",    color: "#94a3b8", bg: "#94a3b815" },
};

export function VenueStatusBadge({ status }: VenueStatusBadgeProps) {
  const { label, color, bg } = CONFIG[status] ?? CONFIG.UNKNOWN;
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border"
      style={{ color, background: bg, borderColor: color + "30" }}
    >
      {label}
    </span>
  );
}
