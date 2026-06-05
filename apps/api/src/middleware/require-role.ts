import { Context, Next } from "hono";
import { UserRole } from "@playgrounds/shared";
import { errorResponse } from "../lib/responses";

export function requireRole(...roles: UserRole[]) {
  return (c: Context, next: Next) => {
    const user = c.get("user") as { id: string; role: UserRole } | null;

    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return errorResponse("Forbidden", 403);
    }

    return next();
  };
}
