import { Amenity, SportType, VenueSource, VenueStatus } from "@playgrounds/shared";
import { VenueEntity, VenueProps } from "@playgrounds/core";

export interface VenueRow {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  status: string;
  reliability_score: number;
  last_verified_at: string | null;
  source: string;
  external_ref: string | null;
  created_at: string;
  venue_amenities?: { amenity: string }[];
}

export function rowToVenue(row: VenueRow): VenueEntity {
  const props: VenueProps = {
    id: row.id,
    name: row.name,
    type: row.type as SportType,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    description: row.description ?? undefined,
    status: row.status as VenueStatus,
    reliabilityScore: row.reliability_score,
    lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at) : undefined,
    source: row.source as VenueSource,
    externalRef: row.external_ref ?? undefined,
    amenities: (row.venue_amenities ?? []).map((a) => a.amenity as Amenity),
    createdAt: new Date(row.created_at),
  };
  return VenueEntity.create(props);
}

export function venueToRow(venue: VenueEntity): Omit<VenueRow, "venue_amenities"> {
  return {
    id: venue.id,
    name: venue.name,
    type: venue.type,
    latitude: venue.latitude,
    longitude: venue.longitude,
    address: venue.address ?? null,
    city: venue.city ?? null,
    country: venue.country ?? null,
    description: venue.description ?? null,
    status: venue.status,
    reliability_score: venue.reliabilityScore,
    last_verified_at: venue.lastVerifiedAt?.toISOString() ?? null,
    source: venue.source,
    external_ref: venue.externalRef ?? null,
    created_at: venue.createdAt.toISOString(),
  };
}
