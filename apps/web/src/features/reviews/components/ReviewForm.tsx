"use client";

import { useState } from "react";
import { apiClient } from "../../../lib/api-client";
import { useSession } from "../../auth/hooks/useSession";

interface ReviewFormProps {
  venueId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ venueId, onSubmitted }: ReviewFormProps) {
  const { session } = useSession();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to leave a review.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = session.access_token;
      await apiClient.reviews.submit(venueId, { rating, review: text }, token);
      setText("");
      setRating(5);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-xl ${n <= rating ? "text-yellow-400" : "text-muted"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Review</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={2000}
          required
          placeholder="Share your experience at this venue..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading || text.length < 10}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
