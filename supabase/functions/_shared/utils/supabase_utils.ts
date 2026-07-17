import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "_shared/types/database.types.ts";
import type { Database as Usage } from "_shared/types/usage.ts";

// Unsafe: service role client bypasses RLS.
// Required when operating without an authenticated user context
// (e.g. functions triggered from external sources like Qstash).
export function createServiceClient(): SupabaseClient<Database> {
  const url = isLocalEnv() ? "http://kong:8000" : Deno.env.get("SB_URL");
  const key = Deno.env.get("SB_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createUsageServiceClient(): SupabaseClient<Usage> {
  const url = isLocalEnv() ? "http://kong:8000" : Deno.env.get("SB_URL");
  const key = Deno.env.get("SB_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createClient<Usage, 'usage'>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: 'usage' }
  });
}

export function isLocalEnv(): boolean {
  const environment = Deno.env.get("ENVIRONMENT");
  if (environment && environment.trim().toUpperCase() === "LOCAL") {
    return true;
  }
  return false;
}
