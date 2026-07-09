CREATE SCHEMA IF NOT EXISTS usage;

COMMENT ON SCHEMA usage IS 'AI usage and token tracking';

CREATE TABLE IF NOT EXISTS usage.ai_usage_log (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email text,
    feature text NOT NULL,
    edge_function text NOT NULL,
    vendor text NOT NULL,
    model text NOT NULL,
    input_tokens integer NOT NULL,
    output_tokens integer NOT NULL DEFAULT 0,
    total_tokens integer NOT NULL,
    is_system_triggered boolean NOT NULL DEFAULT false,
    cache_read boolean NOT NULL DEFAULT false,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_user_identifier CHECK (user_id IS NOT NULL OR user_email IS NOT NULL),
    CONSTRAINT chk_tokens_positive CHECK (input_tokens >= 0 AND output_tokens >= 0)
);

COMMENT ON TABLE usage.ai_usage_log IS 'Immutable log of AI API calls and token usage';
COMMENT ON COLUMN usage.ai_usage_log.id IS 'Unique identifier';
COMMENT ON COLUMN usage.ai_usage_log.user_id IS 'User who spent the tokens';
COMMENT ON COLUMN usage.ai_usage_log.user_email IS 'Fallback identifier when user_id unavailable';
COMMENT ON COLUMN usage.ai_usage_log.feature IS 'Feature that triggered the call (e.g., document_embedding)';
COMMENT ON COLUMN usage.ai_usage_log.edge_function IS 'Edge function that made the call (e.g., embed-chunks)';
COMMENT ON COLUMN usage.ai_usage_log.vendor IS 'AI provider (e.g., openai, deepseek)';
COMMENT ON COLUMN usage.ai_usage_log.model IS 'Model name (e.g., text-embedding-3-small)';
COMMENT ON COLUMN usage.ai_usage_log.input_tokens IS 'Prompt/input tokens consumed';
COMMENT ON COLUMN usage.ai_usage_log.output_tokens IS 'Completion/output tokens consumed';
COMMENT ON COLUMN usage.ai_usage_log.total_tokens IS 'Total tokens (input + output)';
COMMENT ON COLUMN usage.ai_usage_log.is_system_triggered IS 'True if triggered by system pipeline, false if user request';
COMMENT ON COLUMN usage.ai_usage_log.cache_read IS 'True if prompt caching was used';
COMMENT ON COLUMN usage.ai_usage_log.metadata IS 'Additional context (document_id, collection_id, chunk_count, etc.)';
COMMENT ON COLUMN usage.ai_usage_log.created_at IS 'When the API call occurred';

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_created ON usage.ai_usage_log (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature_created ON usage.ai_usage_log (feature, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_system_created ON usage.ai_usage_log (is_system_triggered, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created ON usage.ai_usage_log (created_at);

ALTER TABLE usage.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_select_own_usage" ON usage.ai_usage_log
    FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));

CREATE POLICY "service_role_insert_usage" ON usage.ai_usage_log
    FOR INSERT TO service_role
    WITH CHECK (true);

GRANT SELECT ON usage.ai_usage_log TO authenticated;
