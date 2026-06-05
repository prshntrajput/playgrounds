export const VENUE_SOURCE = {
  OSM: "OSM",
  COMMUNITY: "COMMUNITY",
  OFFICIAL: "OFFICIAL",
} as const;

export type VenueSource = (typeof VENUE_SOURCE)[keyof typeof VENUE_SOURCE];
