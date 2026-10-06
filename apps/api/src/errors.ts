export type ErrorCode =
  | 'SESSION_EXPIRED'
  | 'SESSION_CAPACITY'
  | 'REVISION_CONFLICT'
  | 'INVALID_REQUEST'
  | 'BODY_TOO_LARGE'
  | 'NOT_FOUND'
  | 'AI_UNAVAILABLE'
  | 'PROVIDER_INVALID'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_BUSY'
  | 'REQUEST_CANCELLED'
  | 'INTERNAL_ERROR';
const statuses: Record<ErrorCode, number> = {
  SESSION_EXPIRED: 410,
  SESSION_CAPACITY: 429,
  REVISION_CONFLICT: 409,
  INVALID_REQUEST: 400,
  BODY_TOO_LARGE: 413,
  NOT_FOUND: 404,
  AI_UNAVAILABLE: 503,
  PROVIDER_INVALID: 502,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_BUSY: 429,
  REQUEST_CANCELLED: 499,
  INTERNAL_ERROR: 500,
};
const messages: Record<ErrorCode, string> = {
  SESSION_EXPIRED: 'The document session is unavailable or expired.',
  SESSION_CAPACITY: 'Document capacity is temporarily unavailable.',
  REVISION_CONFLICT: 'The document revision changed. Refresh before asking.',
  INVALID_REQUEST: 'Check the question and selected mode.',
  BODY_TOO_LARGE: 'The request is too large.',
  NOT_FOUND: 'The requested resource was not found.',
  AI_UNAVAILABLE: 'AI mode is not configured.',
  PROVIDER_INVALID: 'AI mode could not produce a valid answer. Please retry.',
  PROVIDER_TIMEOUT: 'AI mode exceeded the request deadline. Please retry.',
  PROVIDER_BUSY: 'AI mode is busy. Please retry shortly.',
  REQUEST_CANCELLED: 'The request was cancelled.',
  INTERNAL_ERROR: 'The request could not be completed.',
};
export class PublicError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode) {
    super(messages[code]);
    this.status = statuses[code];
  }
}
