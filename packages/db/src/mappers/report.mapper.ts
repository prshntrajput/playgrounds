import { ReportEntity } from "@playgrounds/core";
import { ReportType } from "@playgrounds/shared";

export interface ReportRow {
  id: string;
  venue_id: string;
  user_id: string;
  report_type: string;
  ai_classification: string | null;
  created_at: string;
}

export function rowToReport(row: ReportRow): ReportEntity {
  return ReportEntity.create({
    id: row.id,
    venueId: row.venue_id,
    userId: row.user_id,
    reportType: row.report_type as ReportType,
    aiClassification: row.ai_classification ?? undefined,
    createdAt: new Date(row.created_at),
  });
}

export function reportToRow(report: ReportEntity): ReportRow {
  return {
    id: report.id,
    venue_id: report.venueId,
    user_id: report.userId,
    report_type: report.reportType,
    ai_classification: report.aiClassification ?? null,
    created_at: report.createdAt.toISOString(),
  };
}
