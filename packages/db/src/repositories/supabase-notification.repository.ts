import { SupabaseClient } from "@supabase/supabase-js";
import { NotificationRepository } from "@playgrounds/core";
import { Notification } from "@playgrounds/shared";

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await this.db
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as Notification["type"],
      payload: row.payload as Record<string, unknown>,
      read: row.read as boolean,
      createdAt: row.created_at as string,
    }));
  }

  async markRead(id: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }

  async create(notification: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    const { data, error } = await this.db
      .from("notifications")
      .insert({
        id: crypto.randomUUID(),
        user_id: notification.userId,
        type: notification.type,
        payload: notification.payload,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id as string,
      userId: data.user_id as string,
      type: data.type as Notification["type"],
      payload: data.payload as Record<string, unknown>,
      read: data.read as boolean,
      createdAt: data.created_at as string,
    };
  }

  async findSubscribersForVenue(venueId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from("favorites")
      .select("user_id")
      .eq("venue_id", venueId);

    if (error) throw error;
    return (data ?? []).map((row) => row.user_id as string);
  }
}
