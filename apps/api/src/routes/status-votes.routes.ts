import { Hono } from "hono";
import { z } from "zod";
import { jsonResponse, errorResponse } from "../lib/responses";
import type { AppEnv } from "../types";

const VoteBodySchema = z.object({ vote: z.enum(["OPEN", "CLOSED"]) });

const VOTE_WINDOW_HOURS = 4; // only count votes from last 4 hours

export function statusVotesRoutes(app: Hono<AppEnv>) {
  // GET /venues/:id/status-votes  — get recent vote counts (public)
  app.get("/venues/:id/status-votes", async (c) => {
    const { id } = c.req.param();
    const since = new Date(Date.now() - VOTE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    const { data, error } = await c.get("container").db
      .from("venue_status_votes")
      .select("vote, created_at")
      .eq("venue_id", id)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (error) return errorResponse(error.message, 500);

    const votes = data ?? [];
    const openCount   = votes.filter((v) => v.vote === "OPEN").length;
    const closedCount = votes.filter((v) => v.vote === "CLOSED").length;
    const total       = votes.length;
    const consensus   = total === 0 ? null : openCount > closedCount ? "OPEN" : "CLOSED";
    const lastVote    = votes[0]?.created_at ?? null;

    return jsonResponse({ openCount, closedCount, total, consensus, lastVote });
  });

  // POST /venues/:id/status-votes  — submit a vote (no auth required — anyone can vote)
  app.post("/venues/:id/status-votes", async (c) => {
    const { id } = c.req.param();

    let body: unknown;
    try { body = await c.req.json(); } catch { return errorResponse("Invalid JSON", 400); }

    const parsed = VoteBodySchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.message, 400);

    const user = c.get("user");

    const { error } = await c.get("container").db
      .from("venue_status_votes")
      .insert({ venue_id: id, user_id: user?.id ?? null, vote: parsed.data.vote });

    if (error) return errorResponse(error.message, 500);

    return jsonResponse({ ok: true }, 201);
  });
}
