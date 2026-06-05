import { z } from "zod";
import { CROWD_LEVEL } from "../constants/crowd-level";

export const CrowdReportSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  userId: z.string().uuid(),
  level: z.enum(Object.values(CROWD_LEVEL) as [string, ...string[]]),
  createdAt: z.string().datetime(),
});

export const ReportCrowdRequestSchema = z.object({
  level: z.enum(Object.values(CROWD_LEVEL) as [string, ...string[]]),
});

export const CrowdStatusSchema = z.object({
  level: z.enum(Object.values(CROWD_LEVEL) as [string, ...string[]]).nullable(),
  reportCount: z.number(),
  updatedAt: z.string().datetime().nullable(),
});

export type CrowdReport = z.infer<typeof CrowdReportSchema>;
export type ReportCrowdRequest = z.infer<typeof ReportCrowdRequestSchema>;
export type CrowdStatus = z.infer<typeof CrowdStatusSchema>;
