export class ServerError extends Error {
  constructor(
    public status: number,
    message?: string,
  ) {
    super(message ?? `Server error: ${status}`);
    this.name = "ServerError";
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ServerError) return true;
  if (error instanceof TypeError) return true;
  return false;
}
