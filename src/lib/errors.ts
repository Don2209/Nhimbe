/** User-facing errors thrown from services. */
export class ActionError extends Error {}

/** Thrown by action guards when the caller isn't allowed. */
export class UnauthorizedError extends Error {}
