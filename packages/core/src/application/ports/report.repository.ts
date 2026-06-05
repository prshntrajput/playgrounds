import { ReportEntity } from "../../domain/report/report.entity";

export interface ReportRepository {
  findByVenueId(venueId: string, limit?: number): Promise<ReportEntity[]>;
  findById(id: string): Promise<ReportEntity | null>;
  save(report: ReportEntity): Promise<ReportEntity>;
}
