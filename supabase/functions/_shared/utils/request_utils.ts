export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

import { isRetryableError, ServerError } from "../types/error_types.ts";

export async function requestWithRetry(
  url: string | URL | Request,
  init?: RequestInit,
  options?: RetryOptions,
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  for (let attempt = 0;; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.status >= 500) {
        throw new ServerError(response.status, response.statusText);
      }
      return response;
    } catch (error) {
      if (attempt >= opts.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        opts.maxDelayMs,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
