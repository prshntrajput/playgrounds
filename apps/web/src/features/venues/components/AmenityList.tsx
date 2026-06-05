import type { Amenity } from "@playgrounds/shared";

const ICONS: Record<string, string> = {
  PARKING: "P",
  WASHROOM: "WC",
  WATER: "W",
  FLOODLIGHTS: "FL",
  LOCKER_ROOM: "LR",
  SEATING: "S",
  CANTEEN: "C",
  FIRST_AID: "+",
  WHEELCHAIR_ACCESS: "♿",
  WIFI: "Wi-Fi",
};

interface AmenityListProps {
  amenities: Amenity[];
}

export function AmenityList({ amenities }: AmenityListProps) {
  if (amenities.length === 0) {
    return <p className="text-sm text-muted-foreground">No amenities listed</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((a) => (
        <span
          key={a}
          className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-foreground"
          title={a}
        >
          {ICONS[a] ?? a}
        </span>
      ))}
    </div>
  );
}
