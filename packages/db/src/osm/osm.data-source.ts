import { VenueEntity } from "@playgrounds/core";
import { DataSourcePort } from "@playgrounds/core";
import { Amenity, SPORT_TYPE, SportType, VENUE_SOURCE, VENUE_STATUS } from "@playgrounds/shared";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OSM_SPORT_MAP: Record<string, SportType> = {
  basketball:   SPORT_TYPE.BASKETBALL,
  soccer:       SPORT_TYPE.FOOTBALL,
  football:     SPORT_TYPE.FOOTBALL,
  cricket:      SPORT_TYPE.CRICKET,
  tennis:       SPORT_TYPE.TENNIS,
  badminton:    SPORT_TYPE.BADMINTON,
  volleyball:   SPORT_TYPE.VOLLEYBALL,
  table_tennis: SPORT_TYPE.TABLE_TENNIS,
  swimming:     SPORT_TYPE.SWIMMING,
  athletics:    SPORT_TYPE.ATHLETICS,
};

export class OsmDataSource implements DataSourcePort {
  readonly name = "osm";

  async fetchVenues(region: { lat: number; lng: number; radiusKm: number }): Promise<VenueEntity[]> {
    const radiusM = Math.round(region.radiusKm * 1000);
    const query = this.buildQuery(region.lat, region.lng, radiusM);

    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "PlaygroundsAI/1.0 (https://playgrounds.ai; contact@playgrounds.ai)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(55_000),
    });

    if (!res.ok) throw new Error(`Overpass API ${res.status}: ${await res.text()}`);

    const json = (await res.json()) as { elements: OsmElement[] };
    return this.parseElements(json.elements);
  }

  private buildQuery(lat: number, lng: number, radiusM: number): string {
    return `[out:json][timeout:50];
(
  node["sport"~"^(basketball|soccer|football|cricket|tennis|badminton|volleyball|table_tennis|swimming|athletics)$"](around:${radiusM},${lat},${lng});
  way["sport"~"^(basketball|soccer|football|cricket|tennis|badminton|volleyball|table_tennis|swimming|athletics)$"](around:${radiusM},${lat},${lng});
  node["leisure"~"^(pitch|sports_centre|stadium|track)$"](around:${radiusM},${lat},${lng});
  way["leisure"~"^(pitch|sports_centre|stadium|track)$"](around:${radiusM},${lat},${lng});
);
out center tags;`;
  }

  private parseElements(elements: OsmElement[]): VenueEntity[] {
    const seen = new Set<string>();
    const venues: VenueEntity[] = [];

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) continue;

      const tags = el.tags ?? {};
      const sport = this.detectSport(tags);
      if (!sport) continue;

      const externalRef = `osm:${el.type}:${el.id}`;
      if (seen.has(externalRef)) continue;
      seen.add(externalRef);

      venues.push(
        VenueEntity.create({
          id: crypto.randomUUID(),
          name: this.extractName(tags, sport),
          type: sport,
          latitude: lat,
          longitude: lng,
          address: tags["addr:street"] ?? undefined,
          city: tags["addr:city"] ?? tags["addr:district"] ?? tags["addr:state_district"] ?? undefined,
          country: tags["addr:country"] ?? "India",
          description: tags["description"] ?? undefined,
          status: VENUE_STATUS.UNKNOWN,
          reliabilityScore: 0.5,
          source: VENUE_SOURCE.OSM,
          externalRef,
          amenities: this.extractAmenities(tags),
          createdAt: new Date(),
        })
      );
    }

    return venues;
  }

  private detectSport(tags: Record<string, string>): SportType | null {
    const sportTag = tags.sport;
    if (sportTag && OSM_SPORT_MAP[sportTag]) return OSM_SPORT_MAP[sportTag];

    // Infer from leisure when no sport tag
    if (tags.leisure === "stadium" || tags.leisure === "sports_centre") return SPORT_TYPE.MULTI;
    if (tags.leisure === "pitch") return SPORT_TYPE.FOOTBALL;
    if (tags.leisure === "track") return SPORT_TYPE.ATHLETICS;

    return null;
  }

  private extractName(tags: Record<string, string>, sport: SportType): string {
    if (tags.name) return tags.name;
    if (tags["name:en"]) return tags["name:en"];

    const city = tags["addr:city"] ?? tags["addr:district"] ?? "";
    const label = sport.charAt(0) + sport.slice(1).toLowerCase().replace(/_/g, " ");
    return city ? `${city} ${label} Ground` : `${label} Ground`;
  }

  private extractAmenities(tags: Record<string, string>): Amenity[] {
    const amenities: Amenity[] = [];
    if (tags.lit === "yes") amenities.push("FLOODLIGHTS");
    if (tags.toilets === "yes" || tags["toilets:disposal"] === "flush") amenities.push("WASHROOM");
    if (tags.drinking_water === "yes") amenities.push("WATER");
    if (tags.changing_rooms === "yes" || tags.locker_rooms === "yes") amenities.push("LOCKER_ROOM");
    if (tags.seats || tags.capacity) amenities.push("SEATING");
    if (tags.wheelchair === "yes") amenities.push("WHEELCHAIR_ACCESS");
    if (tags.parking === "yes" || tags["parking:lane"] === "yes") amenities.push("PARKING");
    return amenities;
  }
}
