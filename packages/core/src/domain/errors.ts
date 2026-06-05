export class VenueNotFoundError extends Error {
  constructor(id: string) {
    super(`Venue not found: ${id}`);
    this.name = "VenueNotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class SpamDetectedError extends Error {
  constructor(reason: string) {
    super(`Spam detected: ${reason}`);
    this.name = "SpamDetectedError";
  }
}
