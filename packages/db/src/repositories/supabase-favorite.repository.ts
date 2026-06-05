import { SupabaseClient } from "@supabase/supabase-js";
import { FavoriteRepository } from "@playgrounds/core";

export class SupabaseFavoriteRepository implements FavoriteRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from("favorites")
      .select("venue_id")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).map((row) => row.venue_id as string);
  }

  async isFavorite(userId: string, venueId: string): Promise<boolean> {
    const { count, error } = await this.db
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("venue_id", venueId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async add(userId: string, venueId: string): Promise<void> {
    const { error } = await this.db
      .from("favorites")
      .insert({ id: crypto.randomUUID(), user_id: userId, venue_id: venueId });

    if (error) throw error;
  }

  async remove(userId: string, venueId: string): Promise<void> {
    const { error } = await this.db
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("venue_id", venueId);

    if (error) throw error;
  }
}
