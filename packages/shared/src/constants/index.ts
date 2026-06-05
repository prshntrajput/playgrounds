export * from "./amenity";
export * from "./crowd-level";
export * from "./report-type";
export * from "./sport-type";
export * from "./user-role";
export * from "./venue-source";
export * from "./venue-status";

export const SIGNAL_WEIGHTS = {
  RECENT_REVIEWS: 0.2,
  RECENT_PHOTOS: 0.15,
  RECENT_REPORTS: 0.25,
  COMMUNITY_VERIFICATION: 0.15,
  OFFICIAL_DATA: 0.15,
  AI_CONFIDENCE: 0.1,
} as const;

export const CROWD_DECAY_HOURS = 3;
export const RELIABILITY_STALE_HOURS = 24;
export const SEARCH_RADIUS_DEFAULT_KM = 5;
export const SEARCH_RADIUS_MAX_KM = 50;
export const CACHE_TTL_SECONDS = 300;
