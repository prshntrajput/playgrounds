import { Notification } from "@playgrounds/shared";

export interface NotificationRepository {
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<void>;
  create(notification: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification>;
  findSubscribersForVenue(venueId: string): Promise<string[]>;
}
