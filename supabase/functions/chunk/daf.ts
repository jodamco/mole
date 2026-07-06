import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceClient } from "../_shared/utils/supabase_utils.ts";
import { DocumentStatus } from "../_shared/types/document_status.ts";
import type { Database, Json } from "../_shared/types/database.types.ts";
import type { ApiResponse } from "../_shared/types/response_types.ts";
import { internalError, success } from "../_shared/types/response_types.ts";
import { extractText } from "./text_extractor.ts";
import { chunkText } from "./strategies.ts";
import { BroadcastService, Topic } from "../_shared/services/broadcast/service.ts";

const DOCUMENT_BUCKET = "documents";

export interface ClaimedDocument {
  id: number;
  path: string;
  name: string;
  strategyName: string;
}

export async function claimDocument(
  supabase: SupabaseClient<Database>,
  documentId: number,
  status: DocumentStatus,
): Promise<ClaimedDocument> {
  const { data, error } = await supabase
    .from("documents")
    .update({ status_id: status.chunking })
    .eq("id", documentId)
    .eq("status_id", status.uploaded)
    .select(`id, path, name, chunk_strategy:chunking_strategy(name)`)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Document not found or not in uploaded status.");

  const strategyName = (data as { chunk_strategy: { name: string } | null })
    .chunk_strategy?.name;

  if (!strategyName) throw new Error("Chunking strategy not found.");

  return {
    id: data.id,
    path: data.path,
    name: data.name,
    strategyName,
  };
}

export async function downloadFile(
  supabase: SupabaseClient<Database>,
  path: string,
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .download(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download file.");
  }

  return await data.arrayBuffer();
}

export async function saveChunks(
  supabase: SupabaseClient<Database>,
  documentId: number,
  chunks: string[],
): Promise<Array<{ id: number }>> {
  const { data, error } = await supabase
    .from("chunks")
    .insert(
      chunks.map((txt) => ({ document_id: documentId, txt })),
    )
    .select("id");

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert chunks.");
  }

  return data;
}

export async function linkChunks(
  supabase: SupabaseClient<Database>,
  chunks: Array<{ id: number }>,
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    const updates: {
      prev_chunk_id?: number | null;
      next_chunk_id?: number | null;
    } = {};

    if (i > 0) updates.prev_chunk_id = chunks[i - 1].id;
    if (i < chunks.length - 1) updates.next_chunk_id = chunks[i + 1].id;

    if (Object.keys(updates).length === 0) continue;

    const { error } = await supabase
      .from("chunks")
      .update(updates)
      .eq("id", chunks[i].id);

    if (error) throw new Error(error.message);
  }
}

export async function updateDocumentStatus(
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

export async function processChunking(
  documentId: number,
): Promise<ApiResponse> {
  const supabase = createServiceClient();
  const statuses = await DocumentStatus.load(supabase);

  try {
    const document = await claimDocument(supabase, documentId, statuses);
    const fileData = await downloadFile(supabase, document.path);
    const text = await extractText(fileData, document.name);
    const chunks = chunkText(text, document.strategyName);
    const insertedChunks = await saveChunks(supabase, documentId, chunks);
    await linkChunks(supabase, insertedChunks);
    await updateDocumentStatus(supabase, documentId, statuses.chunked);

    const broadcast = new BroadcastService();
    await broadcast.broadcastMessage({
      topic: Topic.DOCUMENT_CHUNKED,
      type: "START_EMBEDDING",
      data: { documentId },
    });

    return success({ message: "Document chunked successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateDocumentStatus(supabase, documentId, statuses.error, {
      error: message,
    });
    return internalError(message);
  }
}
