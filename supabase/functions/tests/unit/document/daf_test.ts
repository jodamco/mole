import { assertEquals } from "@std/assert";
import { SupabaseContext } from "@supabase/server";
import { Database } from "_shared/types/database.types.ts";
import {
  createMockSupabase,
  createRequest,
  mockError,
  mockResult,
} from "../../utils/test_utils.ts";
import {
  completeUpload,
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
} from "../../../document/daf.ts";
import { BroadcastService } from "_shared/services/broadcast/service.ts";
import type {
  PublishMessage,
  PubSubService,
  ReceivedMessage,
} from "_shared/services/broadcast/types.ts";

function createMockBroadcastService(): BroadcastService {
  const mockPubSub: PubSubService = {
    signatureHeader: "X-Mock",
    async publish(_message: PublishMessage) {},
    async verifyAndParse(
      _body: string,
      _signature: string,
    ): Promise<ReceivedMessage> {
      return await Promise.resolve({ type: "", data: {} });
    },
  };
  return new BroadcastService(mockPubSub);
}

function ctx(
  supabase: ReturnType<typeof createMockSupabase>,
): SupabaseContext<Database> {
  return { supabase } as unknown as SupabaseContext<Database>;
}

const validDocBody = {
  name: "report.pdf",
  collectionId: 1,
  chunkStrategyId: 1,
  size: 1024,
  contentType: "application/pdf",
};

// ── getDocuments ──────────────────────────────────────────

Deno.test("getDocuments returns documents on success", async () => {
  const data = [{ id: 1, name: "doc.pdf", status_id: 1 }];
  const supabase = createMockSupabase({ documents: mockResult(data) });
  const res = await getDocuments(ctx(supabase));

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { documents: data });
});

Deno.test("getDocuments returns empty array when none exist", async () => {
  const supabase = createMockSupabase({ documents: mockResult([]) });
  const res = await getDocuments(ctx(supabase));

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { documents: [] });
});

Deno.test("getDocuments returns 500 on db error", async () => {
  const supabase = createMockSupabase({ documents: mockError() });
  const res = await getDocuments(ctx(supabase));

  assertEquals(res.status, 500);
});

// ── getDocument ───────────────────────────────────────────

Deno.test("getDocument returns document on success", async () => {
  const data = { id: 1, name: "doc.pdf", status_id: 1 };
  const supabase = createMockSupabase({ documents: mockResult(data) });
  const res = await getDocument(ctx(supabase), 1);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { document: data });
});

Deno.test("getDocument returns 404 when not found", async () => {
  const supabase = createMockSupabase({ documents: mockResult(null) });
  const res = await getDocument(ctx(supabase), 999);

  assertEquals(res.status, 404);
});

Deno.test("getDocument returns 500 on db error", async () => {
  const supabase = createMockSupabase({ documents: mockError() });
  const res = await getDocument(ctx(supabase), 1);

  assertEquals(res.status, 500);
});

Deno.test("getDocument returns 400 for invalid id", async () => {
  const supabase = createMockSupabase();
  const res = await getDocument(ctx(supabase), null);

  assertEquals(res.status, 400);
});

// ── createDocument ────────────────────────────────────────

Deno.test("createDocument succeeds with valid body", async () => {
  const userData = { storage_path: "user-abc" };
  const storageData = { signedUrl: "https://upload.url", token: "tok" };
  const docData = { id: 1, name: "report.pdf", status_id: 1 };

  const supabase = createMockSupabase({
    users: mockResult(userData),
    documents: mockResult(docData),
    storage: mockResult(storageData),
  });

  const req = createRequest("POST", "/", validDocBody);
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.document, docData);
  assertEquals(body.upload_url, storageData.signedUrl);
  assertEquals(body.token, storageData.token);
});

Deno.test("createDocument returns 400 when name is missing", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", { ...validDocBody, name: undefined });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.message, "Missing file name.");
});

Deno.test("createDocument returns 400 when collectionId is missing", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", {
    ...validDocBody,
    collectionId: undefined,
  });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
  assertEquals((await res.json()).message, "Missing collectionId.");
});

Deno.test("createDocument returns 400 when chunkStrategyId is missing", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", {
    ...validDocBody,
    chunkStrategyId: undefined,
  });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
  assertEquals((await res.json()).message, "Missing chunkStrategyId.");
});

Deno.test("createDocument returns 400 when size is missing", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", { ...validDocBody, size: undefined });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
  assertEquals((await res.json()).message, "Missing file size.");
});

Deno.test("createDocument returns 400 when contentType is missing", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", {
    ...validDocBody,
    contentType: undefined,
  });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
  assertEquals((await res.json()).message, "Missing file content type.");
});

Deno.test("createDocument returns 400 for non-positive size", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", { ...validDocBody, size: 0 });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
});

Deno.test("createDocument returns 400 for negative size", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", { ...validDocBody, size: -100 });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
});

Deno.test("createDocument returns 400 for NaN size", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", { ...validDocBody, size: "abc" });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
});

Deno.test("createDocument returns 400 when file exceeds max size", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", {
    ...validDocBody,
    size: 51 * 1024 * 1024,
  });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
});

Deno.test("createDocument returns 400 for unsupported content type", async () => {
  const supabase = createMockSupabase();
  const req = createRequest("POST", "/", {
    ...validDocBody,
    contentType: "image/png",
  });
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 400);
});

Deno.test("createDocument returns 500 when user lookup fails", async () => {
  const supabase = createMockSupabase({ users: mockError() });
  const req = createRequest("POST", "/", validDocBody);
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 500);
});

Deno.test("createDocument returns 500 when user has no storage_path", async () => {
  const supabase = createMockSupabase({ users: mockResult(null) });
  const req = createRequest("POST", "/", validDocBody);
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 500);
});

Deno.test("createDocument returns 500 when signed url generation fails", async () => {
  const supabase = createMockSupabase({
    users: mockResult({ storage_path: "user-abc" }),
    storage: mockError(),
    documents: mockResult({}),
  });
  const req = createRequest("POST", "/", validDocBody);
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 500);
});

Deno.test("createDocument returns 500 when insert fails", async () => {
  const supabase = createMockSupabase({
    users: mockResult({ storage_path: "user-abc" }),
    storage: mockResult({ signedUrl: "url", token: "tok" }),
    documents: mockError(),
  });
  const req = createRequest("POST", "/", validDocBody);
  const res = await createDocument(req, ctx(supabase), "user-abc");

  assertEquals(res.status, 500);
});

// ── completeUpload ────────────────────────────────────────

Deno.test("completeUpload succeeds when status is uploading", async () => {
  const supabase = createMockSupabase({
    documents: mockResult({ id: 1, name: "report.pdf", status_id: 1 }),
  });
  const res = await completeUpload(
    ctx(supabase),
    1,
    createMockBroadcastService(),
  );

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.document.status_id, 1);
});

Deno.test("completeUpload returns 400 for null id", async () => {
  const supabase = createMockSupabase();
  const res = await completeUpload(ctx(supabase), null);

  assertEquals(res.status, 400);
});

Deno.test("completeUpload returns 404 when document not found", async () => {
  const supabase = createMockSupabase({ documents: mockResult(null) });
  const res = await completeUpload(ctx(supabase), 999);

  assertEquals(res.status, 404);
});

Deno.test("completeUpload returns 400 when not in uploading status", async () => {
  const supabase = createMockSupabase({
    documents: mockResult({ status_id: 2 }),
  });
  const res = await completeUpload(ctx(supabase), 1);

  assertEquals(res.status, 400);
});

Deno.test("completeUpload returns 500 when fetch fails", async () => {
  const supabase = createMockSupabase({ documents: mockError() });
  const res = await completeUpload(ctx(supabase), 1);

  assertEquals(res.status, 500);
});

// ── deleteDocument ────────────────────────────────────────

Deno.test("deleteDocument deletes from storage and db on success", async () => {
  const docData = { path: "user-abc/1/doc.pdf" };
  const supabase = createMockSupabase({
    documents: mockResult(docData),
    storage: mockResult(null),
  });
  const res = await deleteDocument(ctx(supabase), 1);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, { deleted: true });
});

Deno.test("deleteDocument returns 400 for null id", async () => {
  const supabase = createMockSupabase();
  const res = await deleteDocument(ctx(supabase), null);

  assertEquals(res.status, 400);
});

Deno.test("deleteDocument returns 404 when document not found", async () => {
  const supabase = createMockSupabase({ documents: mockResult(null) });
  const res = await deleteDocument(ctx(supabase), 999);

  assertEquals(res.status, 404);
});

Deno.test("deleteDocument returns 500 when doc fetch fails", async () => {
  const supabase = createMockSupabase({ documents: mockError() });
  const res = await deleteDocument(ctx(supabase), 1);

  assertEquals(res.status, 500);
});

Deno.test("deleteDocument returns 500 when storage removal fails", async () => {
  const supabase = createMockSupabase({
    documents: mockResult({ path: "user-abc/1/doc.pdf" }),
    storage: mockError(),
  });
  const res = await deleteDocument(ctx(supabase), 1);

  assertEquals(res.status, 500);
});

Deno.test("deleteDocument returns 500 when db delete fails", async () => {
  const supabase = createMockSupabase({
    documents: [mockResult({ path: "user-abc/1/doc.pdf" }), mockError()],
    storage: mockResult(null),
  });
  const res = await deleteDocument(ctx(supabase), 1);

  assertEquals(res.status, 500);
});
