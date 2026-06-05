export const CROWD_LEVEL = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type CrowdLevel = (typeof CROWD_LEVEL)[keyof typeof CROWD_LEVEL];
