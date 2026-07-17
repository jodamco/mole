import { assertEquals } from "@std/assert";
import { SupabaseContext } from "@supabase/server";
import { Database } from "_shared/types/database.types.ts";
import {
  createMockSupabase,
  mockResult,
  mockError,
  createRequest,
} from "../../utils/test_utils.ts";
import {
  getAllCollections,
  getCollection,
  createCollection,
  patchCollection,
  deleteCollection,
} from "../../../collection/daf.ts";

function ctx(supabase: ReturnType<typeof createMockSupabase>): SupabaseContext<Database> {
  return { supabase } as unknown as SupabaseContext<Database>;
}

Deno.test("getAllCollections returns collections on success", async () => {
  const data = [{ id: 1, name: "Test", deleted_at: null }];
  const supabase = createMockSupabase({ collections: mockResult(data) });
  const res = await getAllCollections(ctx(supabase));

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { collections: data });
});

Deno.test("getAllCollections returns empty array when no collections", async () => {
  const supabase = createMockSupabase({ collections: mockResult([]) });
  const res = await getAllCollections(ctx(supabase));

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { collections: [] });
});

Deno.test("getAllCollections returns 500 on db error", async () => {
  const supabase = createMockSupabase({ collections: mockError() });
  const res = await getAllCollections(ctx(supabase));

  assertEquals(res.status, 500);
});

Deno.test("getCollection returns collection on success", async () => {
  const data = { id: 1, name: "Test", deleted_at: null };
  const supabase = createMockSupabase({ collections: mockResult(data) });
  const res = await getCollection(ctx(supabase), 1);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { collection: data });
});

Deno.test("getCollection returns 404 when not found", async () => {
  const supabase = createMockSupabase({ collections: mockResult(null) });
  const res = await getCollection(ctx(supabase), 999);

  assertEquals(res.status, 404);
});

Deno.test("getCollection returns 500 on db error", async () => {
  const supabase = createMockSupabase({ collections: mockError() });
  const res = await getCollection(ctx(supabase), 1);

  assertEquals(res.status, 500);
});

Deno.test("getCollection returns 400 for invalid id", async () => {
  const supabase = createMockSupabase();
  const res = await getCollection(ctx(supabase), null as unknown as number);

  assertEquals(res.status, 400);
});

Deno.test("createCollection returns created collection", async () => {
  const data = { id: 1, name: "New Collection", description: null, metadata: null };
  const supabase = createMockSupabase({ collections: mockResult(data) });
  const req = createRequest("POST", "/", { name: "New Collection" });
  const res = await createCollection(req, ctx(supabase), "user-123");

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, data);
});

Deno.test("createCollection returns 400 when name is missing", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", {});
  const res = await createCollection(req, ctx(supabase), "user-123");

  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.message, "Name is required.");
});

Deno.test("createCollection returns 400 when userId is empty", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", { name: "Test" });
  const res = await createCollection(req, ctx(supabase), "");

  assertEquals(res.status, 400);
});

Deno.test("createCollection returns 500 on db error", async () => {
  const supabase = createMockSupabase({ collections: mockError() });
  const req = createRequest("POST", "/", { name: "Test" });
  const res = await createCollection(req, ctx(supabase), "user-123");

  assertEquals(res.status, 500);
});

Deno.test("patchCollection updates collection on success", async () => {
  const data = { id: 1, name: "Updated", description: null };
  const supabase = createMockSupabase({ collections: mockResult(data) });
  const req = createRequest("PATCH", "/1", { name: "Updated" });
  const res = await patchCollection(req, ctx(supabase), 1);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, data);
});

Deno.test("patchCollection returns 400 for null id", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("PATCH", "/", { name: "Updated" });
  const res = await patchCollection(req, ctx(supabase), null);

  assertEquals(res.status, 400);
});

Deno.test("patchCollection returns 404 when collection not found", async () => {
  const supabase = createMockSupabase({ collections: mockResult(null) });
  const req = createRequest("PATCH", "/999", { name: "Updated" });
  const res = await patchCollection(req, ctx(supabase), 999);

  assertEquals(res.status, 404);
});

Deno.test("patchCollection returns 500 on db error", async () => {
  const supabase = createMockSupabase({ collections: mockError() });
  const req = createRequest("PATCH", "/1", { name: "Updated" });
  const res = await patchCollection(req, ctx(supabase), 1);

  assertEquals(res.status, 500);
});

Deno.test("deleteCollection soft-deletes on success", async () => {
  const supabase = createMockSupabase({
    collections: mockResult(null),
  });
  const res = await deleteCollection(ctx(supabase), 1);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { deleted: true });
});

Deno.test("deleteCollection returns 400 for null id", async () => {
  const supabase = createMockSupabase();
  const res = await deleteCollection(ctx(supabase), null);

  assertEquals(res.status, 400);
});

Deno.test("deleteCollection returns 500 on db error", async () => {
  const supabase = createMockSupabase({
    collections: mockError(new Error("DB error")),
  });
  const res = await deleteCollection(ctx(supabase), 1);

  assertEquals(res.status, 500);
});
