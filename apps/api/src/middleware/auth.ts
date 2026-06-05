import { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";
import { USER_ROLE } from "@playgrounds/shared";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    c.set("user", null);
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      c.set("user", null);
      return next();
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    c.set("user", {
      id: data.user.id,
      email: data.user.email ?? "",
      role: (profile?.role as string) ?? USER_ROLE.USER,
    });
  } catch {
    c.set("user", null);
  }

  return next();
}
