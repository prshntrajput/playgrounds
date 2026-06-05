import { SupabaseClient } from "@supabase/supabase-js";
import { VenueEntity } from "@playgrounds/core";
import { FindNearbyParams, VenueRepository } from "@playgrounds/core";
import { rowToVenue, venueToRow, VenueRow } from "../mappers/venue.mapper";

export class SupabaseVenueRepository implements VenueRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string): Promise<VenueEntity | null> {
    const { data, error } = await this.db
      .from("venues")
      .select("*, venue_amenities(amenity)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return rowToVenue(data as VenueRow);
  }

  async findNearby(params: FindNearbyParams): Promise<{ venues: VenueEntity[]; total: number }> {
    // Run the paginated results and a count query in parallel
    const [pageResult, countResult] = await Promise.all([
      this.db.rpc("find_venues_nearby", {
        p_lat:       params.lat,
        p_lng:       params.lng,
        p_radius_km: params.radiusKm,
        p_sport:     params.sport  ?? null,
        p_status:    params.status ?? null,
        p_limit:     params.limit,
        p_offset:    params.offset,
      }),
      // count_venues_nearby is defined in migration 005 — falls back to page size if not yet deployed
      this.db.rpc("count_venues_nearby", {
        p_lat:       params.lat,
        p_lng:       params.lng,
        p_radius_km: params.radiusKm,
        p_sport:     params.sport  ?? null,
        p_status:    params.status ?? null,
      }),
    ]);

    if (pageResult.error) throw pageResult.error;

    const rows   = (pageResult.data ?? []) as VenueRow[];
    const venues = rows.map(rowToVenue);
    // Use real count when available, fall back to page length
    const total  = countResult.error ? venues.length : (countResult.data as number);
    return { venues, total };
  }

  async findByExternalRef(externalRef: string): Promise<VenueEntity | null> {
    const { data, error } = await this.db
      .from("venues")
      .select("*, venue_amenities(amenity)")
      .eq("external_ref", externalRef)
      .maybeSingle();

    if (error || !data) return null;
    return rowToVenue(data as VenueRow);
  }

  async findByExternalRefs(refs: string[]): Promise<Map<string, VenueEntity>> {
    if (refs.length === 0) return new Map();

    const { data, error } = await this.db
      .from("venues")
      .select("external_ref, id, name, type, latitude, longitude, status, reliability_score, source, created_at")
      .in("external_ref", refs);

    if (error) throw error;

    const result = new Map<string, VenueEntity>();
    for (const row of data ?? []) {
      const entity = rowToVenue({
        ...(row as VenueRow),
        address: null,
        city: null,
        country: null,
        description: null,
        last_verified_at: null,
        venue_amenities: [],
      });
      result.set(row.external_ref as string, entity);
    }
    return result;
  }

  async save(venue: VenueEntity): Promise<VenueEntity> {
    const row = venueToRow(venue);
    const { data, error } = await this.db
      .from("venues")
      .insert(row)
      .select("*, venue_amenities(amenity)")
      .single();

    if (error) throw error;

    if (venue.amenities.length > 0) {
      await this.db.from("venue_amenities").insert(
        venue.amenities.map((a) => ({ venue_id: venue.id, amenity: a }))
      );
    }

    return rowToVenue(data as VenueRow);
  }

  async update(venue: VenueEntity): Promise<VenueEntity> {
    const row = venueToRow(venue);
    const { data, error } = await this.db
      .from("venues")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", venue.id)
      .select("*, venue_amenities(amenity)")
      .single();

    if (error) throw error;
    return rowToVenue(data as VenueRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from("venues").delete().eq("id", id);
    if (error) throw error;
  }

  async findStaleForRecompute(staleBefore: Date, limit: number): Promise<VenueEntity[]> {
    const { data, error } = await this.db
      .from("venues")
      .select("*, venue_amenities(amenity)")
      .lt("last_verified_at", staleBefore.toISOString())
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((row) => rowToVenue(row as VenueRow));
  }
}
