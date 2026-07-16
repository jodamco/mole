import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database as Usage } from "_shared/types/usage.ts";
import { createUsageServiceClient } from "_shared/utils/supabase_utils.ts";
import type { UsageLogEntry } from "./types.ts";

export type { UsageLogEntry };

export class UsageTrackingService {
  private supabase: SupabaseClient<Usage>;

  constructor(supabase?: SupabaseClient<Usage>) {
    this.supabase = supabase ?? createUsageServiceClient();
  }

  trackUsage(entry: UsageLogEntry): void {
    const promise = this.supabase.from("ai_usage_log").insert({
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
    }).select().then(({ error }: { error: { message?: string } | null }) => {
      if (error) console.error("Usage tracking failed:", error?.message);
    });

    const edgeRuntime = (globalThis as Record<string, unknown>)
      .EdgeRuntime as { waitUntil: (p: Promise<void>) => void } | undefined;

    if (edgeRuntime?.waitUntil) {
      edgeRuntime.waitUntil(promise as Promise<void>);
    } else {
      promise;
    }
  }
}
