import { ReportType } from "@playgrounds/shared";

export interface ReportProps {
  id: string;
  venueId: string;
  userId: string;
  reportType: ReportType;
  aiClassification?: string;
  createdAt: Date;
}

export class ReportEntity {
  private constructor(private readonly props: ReportProps) {}

  static create(props: ReportProps): ReportEntity {
    return new ReportEntity(props);
  }

  get id() { return this.props.id; }
  get venueId() { return this.props.venueId; }
  get userId() { return this.props.userId; }
  get reportType() { return this.props.reportType; }
  get aiClassification() { return this.props.aiClassification; }
  get createdAt() { return this.props.createdAt; }
}
