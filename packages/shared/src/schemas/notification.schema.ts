import { z } from "zod";

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    "VENUE_REOPENED",
    "STATUS_CHANGED",
    "NEW_REVIEW",
    "RELIABILITY_DROP",
  ]),
  payload: z.record(z.string(), z.unknown()),
  read: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;
