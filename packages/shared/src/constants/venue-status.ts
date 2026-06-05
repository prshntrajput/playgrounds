export const VENUE_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  RENOVATION: "RENOVATION",
  UNKNOWN: "UNKNOWN",
} as const;

export type VenueStatus = (typeof VENUE_STATUS)[keyof typeof VENUE_STATUS];
