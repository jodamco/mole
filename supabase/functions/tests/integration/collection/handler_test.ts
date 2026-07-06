import { assertEquals } from "@std/assert";
import { SupabaseContext } from "@supabase/server";
import { Database } from "../../../_shared/types/database.types.ts";
import { handler } from "../../../collection/index.ts";
import {
  createMockSupabase,
  createRequest,
  mockError,
  mockResult,
} from "../../utils/test_utils.ts";

interface AuthConfig {
  userId?: string;
  error?: boolean;
}

function createMockContext(
  supabaseOptions: Parameters<typeof createMockSupabase>[0] = {},
  authConfig: AuthConfig = {},
): SupabaseContext<Database> {
  const supabase = createMockSupabase(supabaseOptions);
  const mockSupabaseWithAuth = {
    ...supabase,
    auth: {
      getUser: () => {
        if (authConfig.error) {
          return { data: { user: null }, error: { message: "Auth error" } };
        }
        if (authConfig.userId) {
          return { data: { user: { id: authConfig.userId } }, error: null };
        }
        return { data: { user: null }, error: null };
      },
    },
  };
  return { supabase: mockSupabaseWithAuth } as unknown as SupabaseContext<
    Database
  >;
}

// ── Authentication ────────────────────────────────────────

Deno.test("handler returns 403 when user is not authenticated", async () => {
  const ctx = createMockContext({}, { error: true });
  const req = createRequest("GET", "/collection");
  const res = await handler(req, ctx);
  assertEquals(res.status, 403);
});

Deno.test("handler returns 403 when user id is missing", async () => {
  const ctx = createMockContext({}, {});
  const req = createRequest("GET", "/collection");
  const res = await handler(req, ctx);
  assertEquals(res.status, 403);
});

// ── GET /collection ───────────────────────────────────────

Deno.test("GET /collection returns all collections", async () => {
  const collections = [
    { id: 1, name: "Collection 1", user_id: "user-1" },
    { id: 2, name: "Collection 2", user_id: "user-1" },
  ];
  const ctx = createMockContext(
    { collections: mockResult(collections) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/collection");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.collections, collections);
});

Deno.test("GET /collection returns empty array when no collections", async () => {
  const ctx = createMockContext(
    { collections: mockResult([]) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/collection");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.collections, []);
});

Deno.test("GET /collection returns 500 on db error", async () => {
  const ctx = createMockContext(
    { collections: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/collection");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── GET /collection/:id ───────────────────────────────────

Deno.test("GET /collection/:id returns single collection", async () => {
  const collection = { id: 1, name: "Collection 1", user_id: "user-1" };
  const ctx = createMockContext(
    { collections: mockResult(collection) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/collection/1");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.collection, collection);
});

Deno.test("GET /collection/:id returns 404 when not found", async () => {
  const ctx = createMockContext(
    { collections: mockResult(null) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/collection/999");
  const res = await handler(req, ctx);
  assertEquals(res.status, 404);
});

Deno.test("GET /collection/:id returns 500 on db error", async () => {
  const ctx = createMockContext(
    { collections: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/collection/1");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── POST /collection ──────────────────────────────────────

Deno.test("POST /collection creates collection with valid body", async () => {
  const newCollection = { id: 1, name: "New Collection", user_id: "user-1" };
  const ctx = createMockContext(
    { collections: mockResult(newCollection) },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/collection", { name: "New Collection" });
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.name, "New Collection");
});

Deno.test("POST /collection returns 400 when name is missing", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/collection", {});
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /collection returns 500 on db error", async () => {
  const ctx = createMockContext(
    { collections: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/collection", { name: "Test" });
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── PATCH /collection/:id ─────────────────────────────────

Deno.test("PATCH /collection/:id updates collection", async () => {
  const updated = { id: 1, name: "Updated Name", user_id: "user-1" };
  const ctx = createMockContext(
    { collections: mockResult(updated) },
    { userId: "user-1" },
  );
  const req = createRequest("PATCH", "/collection/1", { name: "Updated Name" });
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.name, "Updated Name");
});

Deno.test("PATCH /collection/:id returns 400 for invalid id", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("PATCH", "/collection", { name: "Test" });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("PATCH /collection/:id returns 404 when not found", async () => {
  const ctx = createMockContext(
    { collections: mockResult(null) },
    { userId: "user-1" },
  );
  const req = createRequest("PATCH", "/collection/999", { name: "Test" });
  const res = await handler(req, ctx);
  assertEquals(res.status, 404);
});

Deno.test("PATCH /collection/:id returns 500 on db error", async () => {
  const ctx = createMockContext(
    { collections: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("PATCH", "/collection/1", { name: "Test" });
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── DELETE /collection/:id ────────────────────────────────

Deno.test("DELETE /collection/:id soft-deletes collection", async () => {
  const ctx = createMockContext(
    { collections: mockResult({ deleted: true }) },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/collection/1");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.deleted, true);
});

Deno.test("DELETE /collection/:id returns 400 for invalid id", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("DELETE", "/collection");
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("DELETE /collection/:id returns 500 on db error", async () => {
  const ctx = createMockContext(
    { collections: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/collection/1");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── Method Not Allowed ────────────────────────────────────

Deno.test("PUT /collection returns 405", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("PUT", "/collection");
  const res = await handler(req, ctx);
  assertEquals(res.status, 405);
});
