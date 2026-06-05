import { z } from "zod";
import { REPORT_TYPE } from "../constants/report-type";

export const ReportSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  userId: z.string().uuid(),
  reportType: z.enum(Object.values(REPORT_TYPE) as [string, ...string[]]),
  aiClassification: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const SubmitReportRequestSchema = z.object({
  reportType: z.enum(Object.values(REPORT_TYPE) as [string, ...string[]]),
  description: z.string().max(500).optional(),
});

export type Report = z.infer<typeof ReportSchema>;
export type SubmitReportRequest = z.infer<typeof SubmitReportRequestSchema>;
