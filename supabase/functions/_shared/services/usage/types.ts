export interface UsageLogEntry {
  userId?: string;
  userEmail?: string;
  feature: string;
  edgeFunction: string;
  vendor: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  isSystemTriggered: boolean;
  cacheRead: boolean;
  metadata?: Record<string, unknown>;
}
