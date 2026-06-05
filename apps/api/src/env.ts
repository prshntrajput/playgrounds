import { z } from "zod";

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  AI_DEFAULT_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),
  CACHE: z.any(),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(raw: unknown): Env {
  return EnvSchema.parse(raw);
}
