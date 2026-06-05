import { SupabaseClient } from "@supabase/supabase-js";
import { CrowdRepository, CrowdReportData } from "@playgrounds/core";
import { CrowdLevel } from "@playgrounds/shared";

export class SupabaseCrowdRepository implements CrowdRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findRecentByVenueId(venueId: string, hours: number): Promise<CrowdReportData[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await this.db
      .from("crowd_reports")
      .select("*")
      .eq("venue_id", venueId)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      venueId: row.venue_id as string,
      userId: row.user_id as string,
      level: row.level as CrowdLevel,
      createdAt: new Date(row.created_at as string),
    }));
  }

  async save(data: Omit<CrowdReportData, "id" | "createdAt">): Promise<CrowdReportData> {
    const { data: row, error } = await this.db
      .from("crowd_reports")
      .insert({
        id: crypto.randomUUID(),
        venue_id: data.venueId,
        user_id: data.userId,
        level: data.level,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: row.id as string,
      venueId: row.venue_id as string,
      userId: row.user_id as string,
      level: row.level as CrowdLevel,
      createdAt: new Date(row.created_at as string),
    };
  }
}
