import type {
  VenueSearchRequest,
  VenueSearchResponse,
  SubmitReviewRequest,
  Review,
  SubmitReportRequest,
  Report,
  ReportCrowdRequest,
} from "@playgrounds/shared";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }

  const body = await res.json();
  return (body as { data: T }).data;
}

export const apiClient = {
  venues: {
    search: (params: VenueSearchRequest) => {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return apiFetch<VenueSearchResponse>(`/venues/search?${qs}`);
    },

    getById: (id: string) =>
      apiFetch<{
        venue: import("@playgrounds/shared").Venue;
        reviewCount: number;
        crowdLevel: string | null;
        aiSummary: string | null;
      }>(`/venues/${id}`),
  },

  reviews: {
    submit: (venueId: string, data: SubmitReviewRequest, token: string) =>
      apiFetch<Review>(`/venues/${venueId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
  },

  reports: {
    submit: (venueId: string, data: SubmitReportRequest, token: string) =>
      apiFetch<Report>(`/venues/${venueId}/reports`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
  },

  crowd: {
    report: (venueId: string, data: ReportCrowdRequest, token: string) =>
      apiFetch<{ ok: boolean }>(`/venues/${venueId}/crowd`, {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }),
  },

  favorites: {
    toggle: (venueId: string, token: string) =>
      apiFetch<{ isFavorite: boolean }>(`/venues/${venueId}/favorites`, {
        method: "POST",
        token,
      }),
  },

  statusVotes: {
    get: (venueId: string) =>
      apiFetch<{ openCount: number; closedCount: number; total: number; consensus: "OPEN" | "CLOSED" | null; lastVote: string | null }>(
        `/venues/${venueId}/status-votes`
      ),
    submit: (venueId: string, vote: "OPEN" | "CLOSED") =>
      apiFetch<{ ok: boolean }>(`/venues/${venueId}/status-votes`, {
        method: "POST",
        body: JSON.stringify({ vote }),
      }),
  },

  me: (token: string) => apiFetch<{ id: string; email: string; role: string }>("/me", { token }),

  admin: {
    submissions: (status: "PENDING" | "APPROVED" | "REJECTED", token: string) =>
      apiFetch<{ submissions: Record<string, unknown>[] }>(`/venues/submissions?status=${status}`, { token }),

    review: (id: string, status: "APPROVED" | "REJECTED", adminNotes: string, token: string) =>
      apiFetch<{ ok: boolean; status: string }>(`/venues/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
        token,
      }),
  },

  qa: {
    list: (venueId: string) =>
      apiFetch<Array<{
        id: string; question: string; user_id: string | null; created_at: string;
        venue_answers: Array<{ id: string; answer: string; helpful_count: number; created_at: string }>;
      }>>(`/venues/${venueId}/questions`),
    ask: (venueId: string, question: string) =>
      apiFetch<{ id: string; question: string; created_at: string; venue_answers: [] }>(
        `/venues/${venueId}/questions`,
        { method: "POST", body: JSON.stringify({ question }) }
      ),
    answer: (questionId: string, answer: string) =>
      apiFetch<{ id: string; answer: string; helpful_count: number; created_at: string }>(
        `/questions/${questionId}/answers`,
        { method: "POST", body: JSON.stringify({ answer }) }
      ),
    helpful: (answerId: string) =>
      apiFetch<{ ok: boolean }>(`/answers/${answerId}/helpful`, { method: "POST" }),
  },
};
