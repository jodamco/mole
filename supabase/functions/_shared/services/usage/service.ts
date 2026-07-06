import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types.ts";
import { createServiceClient } from "../../utils/supabase_utils.ts";
import type { UsageLogEntry } from "./types.ts";

export type { UsageLogEntry };

export class UsageTrackingService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase ?? createServiceClient();
  }

  trackUsage(entry: UsageLogEntry): void {
    const promise = this.supabase.schema("usage").from("ai_usage_log").insert({
      user_id: entry.userId,
      user_email: entry.userEmail,
      feature: entry.feature,
      edge_function: entry.edgeFunction,
      vendor: entry.vendor,
      model: entry.model,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      total_tokens: entry.inputTokens + entry.outputTokens,
      is_system_triggered: entry.isSystemTriggered,
      cache_read: entry.cacheRead,
      metadata: entry.metadata,
    }).then((error: { message?: string }) => {
      if (error) console.error("Usage tracking failed:", error?.message);
    }).catch((err: unknown) => {
      console.error("Usage tracking failed:", err);
    });

    const edgeRuntime = (globalThis as Record<string, unknown>)
      .EdgeRuntime as { waitUntil: (p: Promise<unknown>) => void } | undefined;

    if (edgeRuntime?.waitUntil) {
      edgeRuntime.waitUntil(promise);
    } else {
      promise.catch(() => {});
    }
  }
}
