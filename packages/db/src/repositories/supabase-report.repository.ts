import { SupabaseClient } from "@supabase/supabase-js";
import { ReportEntity, ReportRepository } from "@playgrounds/core";
import { rowToReport, reportToRow, ReportRow } from "../mappers/report.mapper";

export class SupabaseReportRepository implements ReportRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByVenueId(venueId: string, limit = 50): Promise<ReportEntity[]> {
    const { data, error } = await this.db
      .from("venue_reports")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((row) => rowToReport(row as ReportRow));
  }

  async findById(id: string): Promise<ReportEntity | null> {
    const { data, error } = await this.db
      .from("venue_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return rowToReport(data as ReportRow);
  }

  async save(report: ReportEntity): Promise<ReportEntity> {
    const row = reportToRow(report);
    const { data, error } = await this.db
      .from("venue_reports")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return rowToReport(data as ReportRow);
  }
}
