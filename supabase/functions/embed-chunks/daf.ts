import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "../_shared/utils/supabase_utils.ts";
import { DocumentStatus } from "../_shared/types/document_status.ts";
import type { Database, Json } from "../_shared/types/database.types.ts";
import { EmbeddingService } from "../_shared/services/embedding/service.ts";
import type { ChunkBatch, EmbeddingResult } from "./types.ts";

const CHUNKS_PER_LOOP = 100;
const BATCH_SIZE = 20;

async function claimDocument(
  supabase: SupabaseClient<Database>,
  documentId: number,
  status: DocumentStatus,
): Promise<void> {
  const { error, data } = await supabase
    .from("documents")
    .update({ status_id: status.embedding })
    .eq("id", documentId)
    .eq("status_id", status.chunked)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Document not found or not in chunked status.");
}

async function loadUnprocessedChunks(
  supabase: SupabaseClient<Database>,
  documentId: number,
): Promise<Array<{ id: number; txt: string }>> {
  const { data, error } = await supabase
    .from("chunks")
    .select("id, txt")
    .is("embedding", null)
    .eq("document_id", documentId)
    .limit(CHUNKS_PER_LOOP);

  if (error) throw new Error(error.message);

  return data ?? [];
}

async function updateDocumentStatus(
  supabase: SupabaseClient<Database>,
  documentId: number,
  statusId: number,
  metadata?: Json | null,
): Promise<void> {
  const update: Database["public"]["Tables"]["documents"]["Update"] = {
    status_id: statusId,
  };

  if (metadata !== undefined) update.metadata = metadata;

  const { error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", documentId);

  if (error) throw new Error(error.message);
}

async function createBatchEmbedings(
  embeddingService: EmbeddingService,
  batches: Array<ChunkBatch>,
): Promise<EmbeddingResult[]> {
  return await Promise.all(
    batches.map(async (batch: ChunkBatch) => {
      try {
        const texts = batch.map((c) => c.txt);
        const embeddings = await embeddingService.createEmbeddings(texts);
        return { batch, embeddings, ok: true };
      } catch {
        return { batch, ok: false };
      }
    }),
  );
}

async function saveBatchEmbeddings(
  results: EmbeddingResult[],
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const updates = results
    .filter((r) => r.ok)
    .flatMap((r) =>
      r.batch.map((chunk, j) => ({
        id: chunk.id,
        embedding: JSON.stringify(r.embeddings![j].values),
        embedding_model: r.embeddings![j].model,
      }))
    );

  if (updates.length > 0) {
    const { error } = await supabase
      .from("chunks")
      // deno-lint-ignore no-explicit-any
      .upsert(updates as any, { onConflict: "id" });

    if (error) throw new Error(error.message);
  }
}

export async function processEmbeddings(
  documentId: number,
): Promise<void> {
  const supabase = createServiceClient();
  const statuses = await DocumentStatus.load(supabase);
  const embeddingService = new EmbeddingService();

  try {
    await claimDocument(supabase, documentId, statuses);

    while (true) {
      const chunks = await loadUnprocessedChunks(supabase, documentId);
      if (chunks.length === 0) break;

      const batches: Array<ChunkBatch> = [];
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        batches.push(chunks.slice(i, i + BATCH_SIZE));
      }

      const results: EmbeddingResult[] = await createBatchEmbedings(
        embeddingService,
        batches,
      );

      const batchFailures = results.filter((r) => !r.ok).length;

      if (batchFailures === batches.length && batches.length > 0) {
        throw new Error("All embedding batches failed for this iteration.");
      }

      await saveBatchEmbeddings(results, supabase);
    }

    await updateDocumentStatus(supabase, documentId, statuses.ready);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateDocumentStatus(supabase, documentId, statuses.error, {
      error: message,
    });
    throw error;
  }
}
