import { Context, Next } from "hono";
import { errorResponse } from "../lib/responses";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 60;

export async function rateLimitMiddleware(c: Context, next: Next) {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const key = `ratelimit:${ip}`;

  const current = await c.env.CACHE.get(key, "text");
  const count = current ? parseInt(current, 10) : 0;

  if (count >= MAX_REQUESTS) {
    return errorResponse("Rate limit exceeded", 429);
  }

  await c.env.CACHE.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });

  return next();
}
