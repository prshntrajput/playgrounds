import { Hono } from "hono";
import { z } from "zod";
import { jsonResponse, errorResponse } from "../lib/responses";
import type { AppEnv } from "../types";

const QuestionSchema = z.object({ question: z.string().min(5).max(300) });
const AnswerSchema   = z.object({ answer:   z.string().min(2).max(1000) });

export function qaRoutes(app: Hono<AppEnv>) {
  // GET /venues/:id/questions  — list all Q&A for a venue (public)
  app.get("/venues/:id/questions", async (c) => {
    const { id } = c.req.param();

    const { data, error } = await c.get("container").db
      .from("venue_questions")
      .select("id, question, user_id, created_at, venue_answers(id, answer, user_id, helpful_count, created_at)")
      .eq("venue_id", id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) return errorResponse(error.message, 500);
    return jsonResponse(data ?? []);
  });

  // POST /venues/:id/questions  — ask a question (no auth required)
  app.post("/venues/:id/questions", async (c) => {
    const { id } = c.req.param();

    let body: unknown;
    try { body = await c.req.json(); } catch { return errorResponse("Invalid JSON", 400); }

    const parsed = QuestionSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.message, 400);

    const user = c.get("user");

    const { data, error } = await c.get("container").db
      .from("venue_questions")
      .insert({ venue_id: id, user_id: user?.id ?? null, question: parsed.data.question })
      .select("id, question, user_id, created_at")
      .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse({ ...data, venue_answers: [] }, 201);
  });

  // POST /questions/:qid/answers  — answer a question (no auth required)
  app.post("/questions/:qid/answers", async (c) => {
    const { qid } = c.req.param();

    let body: unknown;
    try { body = await c.req.json(); } catch { return errorResponse("Invalid JSON", 400); }

    const parsed = AnswerSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.message, 400);

    const user = c.get("user");

    const { data, error } = await c.get("container").db
      .from("venue_answers")
      .insert({ question_id: qid, user_id: user?.id ?? null, answer: parsed.data.answer })
      .select("id, answer, user_id, helpful_count, created_at")
      .single();

    if (error) return errorResponse(error.message, 500);
    return jsonResponse(data, 201);
  });

  // POST /answers/:aid/helpful  — mark an answer as helpful
  app.post("/answers/:aid/helpful", async (c) => {
    const { aid } = c.req.param();

    const { error } = await c.get("container").db.rpc("increment_helpful", { answer_id: aid });

    // Fallback if RPC doesn't exist: manual increment
    if (error) {
      const { data: current } = await c.get("container").db
        .from("venue_answers").select("helpful_count").eq("id", aid).single();
      await c.get("container").db
        .from("venue_answers")
        .update({ helpful_count: ((current as { helpful_count: number } | null)?.helpful_count ?? 0) + 1 })
        .eq("id", aid);
    }

    return jsonResponse({ ok: true });
  });
}
