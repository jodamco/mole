import { assertEquals, assertRejects } from "@std/assert";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "_shared/types/database.types.ts";
import { DocumentStatus } from "_shared/types/document_status.ts";
import {
  claimDocument,
  downloadFile,
  linkChunks,
  saveChunks,
  updateDocumentStatus,
} from "../../../chunk/daf.ts";
import {
  createMockSupabase,
  mockError,
  mockResult,
} from "../../utils/test_utils.ts";

async function createMockStatuses(): Promise<DocumentStatus> {
  const data = [
    { name: "uploading", id: 1 },
    { name: "uploaded", id: 2 },
    { name: "chunking", id: 3 },
    { name: "chunked", id: 4 },
    { name: "embedding", id: 5 },
    { name: "ready", id: 6 },
    { name: "error", id: 7 },
    { name: "deleted", id: 8 },
  ];
  const supabase = createMockSupabase({ document_status: mockResult(data) });
  return await DocumentStatus.load(
    supabase as unknown as SupabaseClient<Database>,
  );
}

// ── claimDocument ──────────────────────────────────────────

Deno.test("claimDocument returns claimed document with strategy", async () => {
  const statuses = await createMockStatuses();
  const docData = {
    id: 1,
    path: "user-abc/1/report.pdf",
    name: "report.pdf",
    chunk_strategy: { name: "paragraph" },
  };
  const supabase = createMockSupabase({ documents: mockResult(docData) });

  const result = await claimDocument(
    supabase as unknown as SupabaseClient<Database>,
    1,
    statuses,
  );

  assertEquals(result.id, 1);
  assertEquals(result.path, "user-abc/1/report.pdf");
  assertEquals(result.name, "report.pdf");
  assertEquals(result.strategyName, "paragraph");
});

Deno.test("claimDocument throws when document not found", async () => {
  const statuses = await createMockStatuses();
  const supabase = createMockSupabase({ documents: mockResult(null) });

  await assertRejects(
    () =>
      claimDocument(
        supabase as unknown as SupabaseClient<Database>,
        999,
        statuses,
      ),
    Error,
    "Document not found",
  );
});

Deno.test("claimDocument throws when db error occurs", async () => {
  const statuses = await createMockStatuses();
  const supabase = createMockSupabase({
    documents: mockError({ message: "Connection failed" }),
  });

  await assertRejects(
    () =>
      claimDocument(
        supabase as unknown as SupabaseClient<Database>,
        1,
        statuses,
      ),
    Error,
    "Connection failed",
  );
});

Deno.test("claimDocument throws when strategy is missing", async () => {
  const statuses = await createMockStatuses();
  const docData = {
    id: 1,
    path: "user-abc/1/report.pdf",
    name: "report.pdf",
    chunk_strategy: null,
  };
  const supabase = createMockSupabase({ documents: mockResult(docData) });

  await assertRejects(
    () =>
      claimDocument(
        supabase as unknown as SupabaseClient<Database>,
        1,
        statuses,
      ),
    Error,
    "Chunking strategy not found",
  );
});

// ── downloadFile ───────────────────────────────────────────

Deno.test("downloadFile returns file data on success", async () => {
  const content = "file content here";
  const blob = new Blob([content]);
  const supabase = createMockSupabase({ storage: mockResult(blob) });

  const result = await downloadFile(
    supabase as unknown as SupabaseClient<Database>,
    "user-abc/1/report.pdf",
  );

  const decoded = new TextDecoder().decode(result);
  assertEquals(decoded, content);
});

Deno.test("downloadFile throws when download fails", async () => {
  const supabase = createMockSupabase({
    storage: mockError({ message: "File not found" }),
  });

  await assertRejects(
    () =>
      downloadFile(
        supabase as unknown as SupabaseClient<Database>,
        "user-abc/1/missing.pdf",
      ),
    Error,
    "File not found",
  );
});

Deno.test("downloadFile throws when data is null", async () => {
  const supabase = createMockSupabase({ storage: mockResult(null) });

  await assertRejects(
    () =>
      downloadFile(
        supabase as unknown as SupabaseClient<Database>,
        "user-abc/1/report.pdf",
      ),
    Error,
    "Failed to download file",
  );
});

// ── saveChunks ─────────────────────────────────────────────

Deno.test("saveChunks inserts chunks and returns ids", async () => {
  const insertedData = [{ id: 10 }, { id: 11 }, { id: 12 }];
  const supabase = createMockSupabase({ chunks: mockResult(insertedData) });

  const result = await saveChunks(
    supabase as unknown as SupabaseClient<Database>,
    1,
    ["chunk 1", "chunk 2", "chunk 3"],
  );

  assertEquals(result, insertedData);
  assertEquals(result.length, 3);
  assertEquals(result[0].id, 10);
  assertEquals(result[1].id, 11);
  assertEquals(result[2].id, 12);
});

Deno.test("saveChunks throws on db error", async () => {
  const supabase = createMockSupabase({
    chunks: mockError({ message: "Insert failed" }),
  });

  await assertRejects(
    () =>
      saveChunks(
        supabase as unknown as SupabaseClient<Database>,
        1,
        ["chunk 1"],
      ),
    Error,
    "Insert failed",
  );
});

Deno.test("saveChunks throws when data is null", async () => {
  const supabase = createMockSupabase({ chunks: mockResult(null) });

  await assertRejects(
    () =>
      saveChunks(
        supabase as unknown as SupabaseClient<Database>,
        1,
        ["chunk 1"],
      ),
    Error,
    "Failed to insert chunks",
  );
});

// ── linkChunks ─────────────────────────────────────────────

Deno.test("linkChunks links multiple chunks correctly", async () => {
  const updateResults = [
    mockResult(null),
    mockResult(null),
    mockResult(null),
  ];
  const supabase = createMockSupabase({ chunks: updateResults });

  await linkChunks(
    supabase as unknown as SupabaseClient<Database>,
    [{ id: 10 }, { id: 11 }, { id: 12 }],
  );
});

Deno.test("linkChunks skips single chunk", async () => {
  const supabase = createMockSupabase({ chunks: mockResult(null) });

  await linkChunks(
    supabase as unknown as SupabaseClient<Database>,
    [{ id: 10 }],
  );
});

Deno.test("linkChunks handles empty array", async () => {
  const supabase = createMockSupabase({ chunks: mockResult(null) });

  await linkChunks(
    supabase as unknown as SupabaseClient<Database>,
    [],
  );
});

Deno.test("linkChunks throws on update error", async () => {
  const supabase = createMockSupabase({
    chunks: mockError({ message: "Update failed" }),
  });

  await assertRejects(
    () =>
      linkChunks(
        supabase as unknown as SupabaseClient<Database>,
        [{ id: 10 }, { id: 11 }],
      ),
    Error,
    "Update failed",
  );
});

// ── updateDocumentStatus ───────────────────────────────────

Deno.test("updateDocumentStatus updates status successfully", async () => {
  const supabase = createMockSupabase({ documents: mockResult(null) });

  await updateDocumentStatus(
    supabase as unknown as SupabaseClient<Database>,
    1,
    4,
  );
});

Deno.test("updateDocumentStatus updates status with metadata", async () => {
  const supabase = createMockSupabase({ documents: mockResult(null) });

  await updateDocumentStatus(
    supabase as unknown as SupabaseClient<Database>,
    1,
    7,
    { error: "Something went wrong" },
  );
});

Deno.test("updateDocumentStatus throws on db error", async () => {
  const supabase = createMockSupabase({
    documents: mockError({ message: "Update failed" }),
  });

  await assertRejects(
    () =>
      updateDocumentStatus(
        supabase as unknown as SupabaseClient<Database>,
        1,
        4,
      ),
    Error,
    "Update failed",
  );
});
