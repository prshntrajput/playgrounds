import { z } from "zod";
import { USER_ROLE } from "../constants/user-role";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
  role: z.enum(Object.values(USER_ROLE) as [string, ...string[]]),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
