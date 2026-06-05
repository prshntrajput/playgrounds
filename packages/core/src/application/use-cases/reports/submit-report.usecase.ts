import { ReportType } from "@playgrounds/shared";
import { VenueNotFoundError } from "../../../domain/errors";
import { ReportEntity } from "../../../domain/report/report.entity";
import { AIProvider } from "../../ports/ai.provider";
import { ReportRepository } from "../../ports/report.repository";
import { VenueRepository } from "../../ports/venue.repository";
import { RecomputeReliabilityUseCase } from "../venues/recompute-reliability.usecase";

export interface SubmitReportInput {
  venueId: string;
  userId: string;
  reportType: ReportType;
  description?: string;
}

export class SubmitReportUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly reportRepository: ReportRepository,
    private readonly aiProvider: AIProvider,
    private readonly recomputeReliability: RecomputeReliabilityUseCase
  ) {}

  async execute(input: SubmitReportInput): Promise<ReportEntity> {
    const venue = await this.venueRepository.findById(input.venueId);
    if (!venue) throw new VenueNotFoundError(input.venueId);

    let aiClassification: string | undefined;
    if (input.description) {
      try {
        const classification = await this.aiProvider.classifyReport(input.description);
        aiClassification = classification.reportType;
      } catch {
        // AI classification is non-critical
      }
    }

    const report = ReportEntity.create({
      id: crypto.randomUUID(),
      venueId: input.venueId,
      userId: input.userId,
      reportType: input.reportType,
      aiClassification,
      createdAt: new Date(),
    });

    const saved = await this.reportRepository.save(report);
    await this.recomputeReliability.execute(input.venueId);

    return saved;
  }
}
