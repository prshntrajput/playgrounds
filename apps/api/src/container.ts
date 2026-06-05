import { createSupabaseClient } from "@playgrounds/db";
import {
  SupabaseVenueRepository,
  SupabaseReviewRepository,
  SupabaseReportRepository,
  SupabaseCrowdRepository,
  SupabaseFavoriteRepository,
  SupabaseNotificationRepository,
} from "@playgrounds/db";
import { GeminiProvider, OpenAIProvider, ResilientAIProvider } from "@playgrounds/ai";
import type { AIProvider } from "@playgrounds/core";
import {
  ReliabilityEngine,
  AiConfidenceSignal,
  CommunityVerificationSignal,
  OfficialDataSignal,
  RecentPhotosSignal,
  RecentReportsSignal,
  RecentReviewsSignal,
  SearchVenuesUseCase,
  GetVenueDetailsUseCase,
  RecomputeReliabilityUseCase,
  SubmitReviewUseCase,
  SubmitReportUseCase,
  ReportCrowdUseCase,
  ToggleFavoriteUseCase,
  ImportFromSourceUseCase,
} from "@playgrounds/core";
import type { VenueRepository, CachePort } from "@playgrounds/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { KVCache } from "./lib/kv-cache";
import type { Env } from "./env";

export interface Container {
  // Exposed primitives — used by cron jobs and admin routes
  db: SupabaseClient;
  venueRepository: VenueRepository;
  cache: CachePort;
  // Use cases
  searchVenues: SearchVenuesUseCase;
  getVenueDetails: GetVenueDetailsUseCase;
  recomputeReliability: RecomputeReliabilityUseCase;
  submitReview: SubmitReviewUseCase;
  submitReport: SubmitReportUseCase;
  reportCrowd: ReportCrowdUseCase;
  toggleFavorite: ToggleFavoriteUseCase;
}

export function buildContainer(env: Env): Container {
  // Infrastructure
  const db = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const cache = new KVCache(env.CACHE as KVNamespace);

  // Repositories
  const venueRepository = new SupabaseVenueRepository(db);
  const reviewRepository = new SupabaseReviewRepository(db);
  const reportRepository = new SupabaseReportRepository(db);
  const crowdRepository = new SupabaseCrowdRepository(db);
  const favoriteRepository = new SupabaseFavoriteRepository(db);

  // AI Provider chain: Gemini → OpenAI
  const providers: AIProvider[] = [new GeminiProvider(env.GEMINI_API_KEY)];
  if (env.OPENAI_API_KEY) {
    providers.push(new OpenAIProvider(env.OPENAI_API_KEY));
  }
  const aiProvider = new ResilientAIProvider(providers);

  // Venue Health Engine — all signals registered here
  const engine = new ReliabilityEngine([
    new RecentReviewsSignal(),
    new RecentPhotosSignal(),
    new RecentReportsSignal(),
    new CommunityVerificationSignal(),
    new OfficialDataSignal(),
    new AiConfidenceSignal(),
  ]);

  // Use Cases
  const recomputeReliability = new RecomputeReliabilityUseCase(
    venueRepository,
    reviewRepository,
    reportRepository,
    crowdRepository,
    engine,
    cache
  );

  return {
    db,
    venueRepository,
    cache,
    searchVenues: new SearchVenuesUseCase(venueRepository, cache),
    getVenueDetails: new GetVenueDetailsUseCase(
      venueRepository,
      reviewRepository,
      crowdRepository,
      aiProvider,
      cache
    ),
    recomputeReliability,
    submitReview: new SubmitReviewUseCase(
      venueRepository,
      reviewRepository,
      aiProvider,
      recomputeReliability
    ),
    submitReport: new SubmitReportUseCase(
      venueRepository,
      reportRepository,
      aiProvider,
      recomputeReliability
    ),
    reportCrowd: new ReportCrowdUseCase(venueRepository, crowdRepository, cache),
    toggleFavorite: new ToggleFavoriteUseCase(venueRepository, favoriteRepository),
  };
}
