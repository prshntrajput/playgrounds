"use client";

import { useState, useEffect } from "react";
import { apiClient } from "../../../lib/api-client";

type Answer   = { id: string; answer: string; helpful_count: number; created_at: string };
type Question = { id: string; question: string; user_id: string | null; created_at: string; venue_answers: Answer[] };

interface VenueQAProps { venueId: string }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CARD_BG    = "oklch(0.11 0.010 266)";
const BORDER_COL = "oklch(0.22 0.010 248)";
const INPUT_BG   = "oklch(0.14 0.010 265)";
const INPUT_BOR  = "oklch(0.22 0.010 248)";

export function VenueQA({ venueId }: VenueQAProps) {
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [loading, setLoading]         = useState(true);
  const [newQ, setNewQ]               = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);
  const [answerText, setAnswerText]   = useState<Record<string, string>>({});
  const [submittingA, setSubmittingA] = useState<string | null>(null);
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());
  const [expandedQ, setExpandedQ]     = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient.qa.list(venueId)
      .then((data) => { if (active) setQuestions(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [venueId]);

  const handleAsk = async () => {
    if (!newQ.trim() || newQ.length < 5) return;
    setSubmittingQ(true);
    try {
      const created = await apiClient.qa.ask(venueId, newQ.trim());
      setQuestions((prev) => [created as unknown as Question, ...prev]);
      setNewQ("");
      setExpandedQ(created.id);
    } catch { /* silent */ }
    finally { setSubmittingQ(false); }
  };

  const handleAnswer = async (qid: string) => {
    const text = answerText[qid]?.trim();
    if (!text || text.length < 2) return;
    setSubmittingA(qid);
    try {
      const ans = await apiClient.qa.answer(qid, text);
      setQuestions((prev) => prev.map((q) =>
        q.id === qid ? { ...q, venue_answers: [...q.venue_answers, ans] } : q
      ));
      setAnswerText((prev) => ({ ...prev, [qid]: "" }));
    } catch { /* silent */ }
    finally { setSubmittingA(null); }
  };

  const handleHelpful = async (aid: string, qid: string) => {
    if (helpfulVoted.has(aid)) return;
    try {
      await apiClient.qa.helpful(aid);
      setHelpfulVoted((prev) => new Set([...prev, aid]));
      setQuestions((prev) => prev.map((q) =>
        q.id === qid
          ? { ...q, venue_answers: q.venue_answers.map((a) => a.id === aid ? { ...a, helpful_count: a.helpful_count + 1 } : a) }
          : q
      ));
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-3">
      {/* Ask form */}
      <div
        className="rounded-3xl border p-4"
        style={{ background: CARD_BG, borderColor: BORDER_COL }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Ask the community
        </p>
        <div className="flex gap-2">
          <input
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="e.g. Is floodlight available after 8 PM?"
            maxLength={300}
            className="flex-1 text-sm px-4 py-2.5 rounded-2xl border text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
            style={{ background: INPUT_BG, borderColor: INPUT_BOR }}
          />
          <button
            onClick={handleAsk}
            disabled={submittingQ || newQ.trim().length < 5}
            className="px-4 py-2.5 text-sm font-bold rounded-2xl transition-all disabled:opacity-40"
            style={{
              background: "oklch(0.6692 0.1607 245)",
              color: "white",
            }}
          >
            {submittingQ ? "…" : "Ask"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">No login needed. Be specific.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-16 rounded-3xl animate-pulse border"
              style={{ background: CARD_BG, borderColor: BORDER_COL }}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2 opacity-30">💬</p>
          <p className="text-sm text-muted-foreground">No questions yet. Be the first to ask!</p>
        </div>
      )}

      {/* Questions */}
      {!loading && questions.map((q) => {
        const isOpen = expandedQ === q.id;
        return (
          <div
            key={q.id}
            className="rounded-3xl border overflow-hidden"
            style={{ background: CARD_BG, borderColor: BORDER_COL }}
          >
            {/* Question row */}
            <button
              className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3 transition-colors"
              style={{ background: "transparent" }}
              onClick={() => setExpandedQ(isOpen ? null : q.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  <span className="text-muted-foreground mr-1.5">Q.</span>{q.question}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {q.venue_answers.length} answer{q.venue_answers.length !== 1 ? "s" : ""} · {timeAgo(q.created_at)}
                </p>
              </div>
              <span className="text-muted-foreground text-xs shrink-0 mt-0.5">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Expanded */}
            {isOpen && (
              <div
                className="px-4 pb-4 pt-2 space-y-3 border-t"
                style={{ borderColor: "oklch(0.18 0.008 265)" }}
              >
                {/* Existing answers */}
                {q.venue_answers.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div
                      className="w-1 rounded-full shrink-0"
                      style={{ background: "oklch(0.6692 0.1607 245 / 0.4)" }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-foreground/85 leading-snug">{a.answer}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                        <button
                          onClick={() => handleHelpful(a.id, q.id)}
                          disabled={helpfulVoted.has(a.id)}
                          className="text-xs flex items-center gap-1 transition-colors"
                          style={{
                            color: helpfulVoted.has(a.id) ? "oklch(0.6692 0.1607 245)" : "oklch(0.40 0.008 248)",
                          }}
                        >
                          👍 {a.helpful_count > 0 && a.helpful_count} Helpful
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Answer input */}
                <div className="flex gap-2 pt-1">
                  <input
                    value={answerText[q.id] ?? ""}
                    onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAnswer(q.id)}
                    placeholder="Write an answer…"
                    maxLength={1000}
                    className="flex-1 text-xs px-3 py-2.5 rounded-2xl border text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
                    style={{ background: INPUT_BG, borderColor: INPUT_BOR }}
                  />
                  <button
                    onClick={() => handleAnswer(q.id)}
                    disabled={submittingA === q.id || (answerText[q.id]?.trim().length ?? 0) < 2}
                    className="px-3 py-2.5 text-xs font-bold rounded-2xl transition-all disabled:opacity-40 shrink-0"
                    style={{ background: "oklch(0.18 0.012 265)", color: "oklch(0.75 0.010 248)", border: `1px solid ${BORDER_COL}` }}
                  >
                    {submittingA === q.id ? "…" : "Answer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
