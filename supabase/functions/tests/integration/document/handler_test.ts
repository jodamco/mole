import { assertEquals } from "@std/assert";
import { SupabaseContext } from "@supabase/server";
import { Database } from "_shared/types/database.types.ts";
import { handler } from "../../../document/index.ts";
import { BroadcastService } from "_shared/services/broadcast/service.ts";
import type {
  PublishMessage,
  PubSubService,
  ReceivedMessage,
} from "_shared/services/broadcast/types.ts";
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

// ── Authentication ────────────────────────────────────────

Deno.test("handler returns 403 when user is not authenticated", async () => {
  const ctx = createMockContext({}, { error: true });
  const req = createRequest("GET", "/document");
  const res = await handler(req, ctx);
  assertEquals(res.status, 403);
});

Deno.test("handler returns 403 when user id is missing", async () => {
  const ctx = createMockContext({}, {});
  const req = createRequest("GET", "/document");
  const res = await handler(req, ctx);
  assertEquals(res.status, 403);
});

// ── GET /document ─────────────────────────────────────────

Deno.test("GET /document returns all documents", async () => {
  const documents = [
    { id: 1, name: "doc1.pdf", status_id: 1 },
    { id: 2, name: "doc2.pdf", status_id: 2 },
  ];
  const ctx = createMockContext(
    { documents: mockResult(documents) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/document");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.documents, documents);
});

Deno.test("GET /document returns empty array when no documents", async () => {
  const ctx = createMockContext(
    { documents: mockResult([]) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/document");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.documents, []);
});

Deno.test("GET /document returns 500 on db error", async () => {
  const ctx = createMockContext(
    { documents: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/document");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── GET /document/:id ─────────────────────────────────────

Deno.test("GET /document/:id returns single document", async () => {
  const document = { id: 1, name: "doc1.pdf", status_id: 1 };
  const ctx = createMockContext(
    { documents: mockResult(document) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/document/1");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.document, document);
});

Deno.test("GET /document/:id returns 404 when not found", async () => {
  const ctx = createMockContext(
    { documents: mockResult(null) },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/document/999");
  const res = await handler(req, ctx);
  assertEquals(res.status, 404);
});

Deno.test("GET /document/:id returns 500 on db error", async () => {
  const ctx = createMockContext(
    { documents: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("GET", "/document/1");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── POST /document ────────────────────────────────────────

Deno.test("POST /document creates document with valid body", async () => {
  const userData = { storage_path: "user-1" };
  const storageData = { signedUrl: "https://upload.url", token: "tok" };
  const docData = { id: 1, name: "report.pdf", status_id: 1 };

  const ctx = createMockContext(
    {
      users: mockResult(userData),
      storage: mockResult(storageData),
      documents: mockResult(docData),
    },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.document, docData);
  assertEquals(body.upload_url, storageData.signedUrl);
  assertEquals(body.token, storageData.token);
});

Deno.test("POST /document returns 400 when name is missing", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 when collectionId is missing", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    chunkStrategyId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 when chunkStrategyId is missing", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 when size is missing", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 when contentType is missing", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 for non-positive size", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 0,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 when file exceeds max size", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 51 * 1024 * 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 400 for unsupported content type", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
    contentType: "image/png",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("POST /document returns 500 when user lookup fails", async () => {
  const ctx = createMockContext(
    { users: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

Deno.test("POST /document returns 500 when signed url generation fails", async () => {
  const ctx = createMockContext(
    {
      users: mockResult({ storage_path: "user-1" }),
      storage: mockError(),
    },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

Deno.test("POST /document returns 500 when insert fails", async () => {
  const ctx = createMockContext(
    {
      users: mockResult({ storage_path: "user-1" }),
      storage: mockResult({ signedUrl: "url", token: "tok" }),
      documents: mockError(),
    },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document", {
    name: "report.pdf",
    collectionId: 1,
    chunkStrategyId: 1,
    size: 1024,
    contentType: "application/pdf",
  });
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── POST /document/:id/complete_upload ────────────────────

Deno.test("POST /document/:id/complete_upload succeeds", async () => {
  const ctx = createMockContext(
    { documents: mockResult({ id: 1, name: "doc.pdf", status_id: 1 }) },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document/1/complete_upload");
  const res = await handler(req, ctx, createMockBroadcastService());

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.document.status_id, 1);
});

Deno.test("POST /document/:id/complete_upload returns 404 for invalid id", async () => {
  const ctx = createMockContext(
    { documents: mockResult(null) },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document/abc/complete_upload");
  const res = await handler(req, ctx, createMockBroadcastService());
  assertEquals(res.status, 404);
});

Deno.test("POST /document/:id/complete_upload returns 404 when not found", async () => {
  const ctx = createMockContext(
    { documents: mockResult(null) },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document/999/complete_upload");
  const res = await handler(req, ctx, createMockBroadcastService());
  assertEquals(res.status, 404);
});

Deno.test("POST /document/:id/complete_upload returns 400 when not uploading", async () => {
  const ctx = createMockContext(
    { documents: mockResult({ status_id: 2 }) },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document/1/complete_upload");
  const res = await handler(req, ctx, createMockBroadcastService());
  assertEquals(res.status, 400);
});

Deno.test("POST /document/:id/complete_upload returns 500 on db error", async () => {
  const ctx = createMockContext(
    { documents: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("POST", "/document/1/complete_upload");
  const res = await handler(req, ctx, createMockBroadcastService());
  assertEquals(res.status, 500);
});

// ── DELETE /document/:id ──────────────────────────────────

Deno.test("DELETE /document/:id deletes document", async () => {
  const ctx = createMockContext(
    {
      documents: mockResult({ path: "user-1/1/doc.pdf" }),
      storage: mockResult(null),
    },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/document/1");
  const res = await handler(req, ctx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.deleted, true);
});

Deno.test("DELETE /document/:id returns 400 for invalid id", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("DELETE", "/document");
  const res = await handler(req, ctx);
  assertEquals(res.status, 400);
});

Deno.test("DELETE /document/:id returns 404 when not found", async () => {
  const ctx = createMockContext(
    { documents: mockResult(null) },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/document/999");
  const res = await handler(req, ctx);
  assertEquals(res.status, 404);
});

Deno.test("DELETE /document/:id returns 500 when fetch fails", async () => {
  const ctx = createMockContext(
    { documents: mockError() },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/document/1");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

Deno.test("DELETE /document/:id returns 500 when storage removal fails", async () => {
  const ctx = createMockContext(
    {
      documents: mockResult({ path: "user-1/1/doc.pdf" }),
      storage: mockError(),
    },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/document/1");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

Deno.test("DELETE /document/:id returns 500 when db delete fails", async () => {
  const ctx = createMockContext(
    {
      documents: [mockResult({ path: "user-1/1/doc.pdf" }), mockError()],
      storage: mockResult(null),
    },
    { userId: "user-1" },
  );
  const req = createRequest("DELETE", "/document/1");
  const res = await handler(req, ctx);
  assertEquals(res.status, 500);
});

// ── Method Not Allowed ────────────────────────────────────

Deno.test("PUT /document returns 405", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("PUT", "/document");
  const res = await handler(req, ctx);
  assertEquals(res.status, 405);
});

Deno.test("PATCH /document returns 405", async () => {
  const ctx = createMockContext({}, { userId: "user-1" });
  const req = createRequest("PATCH", "/document");
  const res = await handler(req, ctx);
  assertEquals(res.status, 405);
});
