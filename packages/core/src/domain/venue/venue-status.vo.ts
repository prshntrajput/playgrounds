import { VENUE_STATUS, VenueStatus } from "@playgrounds/shared";

export type { VenueStatus };

export class VenueStatusVO {
  private constructor(readonly value: VenueStatus) {}

  static open() {
    return new VenueStatusVO(VENUE_STATUS.OPEN);
  }

  static closed() {
    return new VenueStatusVO(VENUE_STATUS.CLOSED);
  }

  static renovation() {
    return new VenueStatusVO(VENUE_STATUS.RENOVATION);
  }

  static unknown() {
    return new VenueStatusVO(VENUE_STATUS.UNKNOWN);
  }

  static from(value: VenueStatus) {
    return new VenueStatusVO(value);
  }

  isOpen() {
    return this.value === VENUE_STATUS.OPEN;
  }

  isClosed() {
    return this.value === VENUE_STATUS.CLOSED;
  }
}
