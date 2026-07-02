## General

1. **Avoid comments at all costs.** Only comment when:
   - Explicitly requested by the user.
   - Explaining a genuinely hard-to-catch edge case.

2. **Always double-check code before reporting done.**
   - Run lint and tests (when available) before reporting completion.

3. **Long tasks** (big refactors, entire features/screens, cross-cutting changes):
   - Use the coding pipeline.
   - The pipeline may be requested by the user directly.

4. **Never commit to `main`.**
   - Check the current branch before starting any work. If on `main`, stop and ask the user to switch branches.

5. **Git operations affecting history** (stash, merge, rebase, etc.) must be handled by the user, not by the coding tool.
   - If you think a history-affecting git operation is needed, refer back to the user.
   - **Prioritize repository safety over task execution.**

## DB — Migrations

1. **Always write idempotent SQL.** Use:
   - `CREATE TABLE IF NOT EXISTS` instead of `CREATE TABLE`
   - `CREATE OR REPLACE VIEW` instead of `CREATE VIEW`
   - `DROP FUNCTION IF EXISTS <name>()` before `CREATE FUNCTION` (cover both old and new signatures)
   - `DROP POLICY IF EXISTS <name> ON <table>` before `CREATE POLICY`

2. **All tables, columns, views, and functions must have `COMMENT ON`** explaining their purpose.
   - Keep comments brief — one line is ideal.

3. **Primary keys** must use `id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY` unless stated otherwise.

## Backend — Edge Functions

1. All edge functions must follow this structure:

```ts
export default {
  fetch: customFetchWrapper(handler),
};
```

Handlers should be as thin as possible — only route requests to different methods when needed.

2. Data access logic (DB/storage access) must live in **DAF (Data Access Functions)** files, not in handlers.

3. Any DB read (`select`) must use the **user-authenticated Supabase instance** from the request context to enforce RLS.
   - If a request requires bypassing RLS, an explicit override must be provided using a **new high-privilege Supabase instance**.
   - Whenever a high-privilege Supabase instance is created, a comment must explain why it's needed and mark it as unsafe.
