import Link from "next/link";
import type { Venue } from "@playgrounds/shared";
import { ReliabilityBadge } from "../../venues/components/ReliabilityBadge";

interface VenueCardProps {
  venue: Venue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const statusColor =
    venue.status === "OPEN"
      ? "text-green-600"
      : venue.status === "CLOSED"
        ? "text-red-500"
        : venue.status === "RENOVATION"
          ? "text-yellow-600"
          : "text-muted-foreground";

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-card-foreground truncate">{venue.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {venue.type.replace(/_/g, " ")} · {venue.city ?? venue.address ?? "Location unknown"}
          </p>
        </div>
        <ReliabilityBadge score={venue.reliabilityScore} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className={`text-xs font-medium ${statusColor}`}>{venue.status}</span>
        {venue.amenities.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {venue.amenities.slice(0, 3).join(" · ")}
          </span>
        )}
      </div>
    </Link>
  );
}
