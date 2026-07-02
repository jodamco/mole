import { SupabaseContext } from "@supabase/server";
import {
  ApiResponse,
  badRequest,
  internalError,
  notFound,
  success,
} from "../_shared/response_types.ts";
import { Database } from "../_shared/types/database.types.ts";
import { isEmpty } from "../_shared/validator_utils.ts";

const DOCUMENT_BUCKET = "documents";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const STATUS_UPLOADING = 1;
const STATUS_UPLOADED = 2;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function getDocuments(
  ctx: SupabaseContext<Database>,
): Promise<ApiResponse> {
  const { data, error } = await ctx.supabase
    .from("documents")
    .select(`
      *,
      status:document_status(*),
      chunk_strategy:chunking_strategy(*)
    `)
    .order("created_at", { ascending: false });

  if (error) return internalError(error.message);

  return success({ documents: data ?? [] });
}

async function getDocument(
  ctx: SupabaseContext<Database>,
  id: number | null,
): Promise<ApiResponse> {
  if (isEmpty(id)) return badRequest("Invalid document id.");

  const { data, error } = await ctx.supabase
    .from("documents")
    .select(`
      *,
      status:document_status(*),
      chunk_strategy:chunking_strategy(*)
    `)
    .eq("id", id!)
    .single();

  if (error) return internalError(error.message);
  if (!data) return notFound();

  return success({ document: data });
}

async function createDocument(
  req: Request,
  ctx: SupabaseContext<Database>,
  userId: string,
): Promise<ApiResponse> {
  const body = await req.json();

  const name = body.name;
  const collectionId = Number(body.collectionId);
  const chunkStrategyId = Number(body.chunkStrategyId);
  const size = Number(body.size);
  const contentType = body.contentType;

  if (!name) return badRequest("Missing file name.");
  if (!collectionId) return badRequest("Missing collectionId.");
  if (!chunkStrategyId) return badRequest("Missing chunkStrategyId.");
  if (!size) return badRequest("Missing file size.");
  if (!contentType) return badRequest("Missing file content type.");

  if (!Number.isFinite(size) || size <= 0) {
    return badRequest("Invalid file size.");
  }

  if (size > MAX_FILE_SIZE) {
    return badRequest(
      `File size exceeds the maximum allowed size of ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`,
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return badRequest(`File type "${contentType}" is not supported.`);
  }

  const { data: userData, error: userError } = await ctx.supabase
    .from("users")
    .select("storage_path")
    .eq("user_id", userId)
    .single();

  if (userError || !userData) {
    return internalError(userError?.message ?? "User not found.");
  }

  const safeName = sanitizeFileName(name);
  const path =
    `${userData.storage_path}/${collectionId}/${crypto.randomUUID()}-${safeName}`;

  const { data: uploadData, error: uploadUrlError } = await ctx.supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });

  if (uploadUrlError || !uploadData) {
    return internalError(
      uploadUrlError?.message ?? "Failed to generate upload URL.",
    );
  }

  const { data, error } = await ctx.supabase
    .from("documents")
    .insert({
      name,
      path,
      status_id: STATUS_UPLOADING,
      chunk_strategy_id: chunkStrategyId,
      created_by: userId,
      collection_id: collectionId,
    })
    .select()
    .single();

  if (error) return internalError(error.message);

  return success({
    document: data,
    upload_url: uploadData.signedUrl,
    token: uploadData.token,
  });
}

async function completeUpload(
  ctx: SupabaseContext<Database>,
  id: number | null,
): Promise<ApiResponse> {
  if (isEmpty(id)) return badRequest("Invalid document id.");

  const { data: document, error: fetchError } = await ctx.supabase
    .from("documents")
    .select("status_id")
    .eq("id", id!)
    .single();

  if (fetchError) return internalError(fetchError.message);
  if (!document) return notFound();

  if (document.status_id !== STATUS_UPLOADING) {
    return badRequest("Document is not in uploading status.");
  }

  const { data, error } = await ctx.supabase
    .from("documents")
    .update({ status_id: STATUS_UPLOADED })
    .eq("id", id!)
    .select()
    .single();

  if (error) return internalError(error.message);

  return success({ document: data });
}

async function deleteDocument(
  ctx: SupabaseContext<Database>,
  id: number | null,
): Promise<ApiResponse> {
  if (isEmpty(id)) return badRequest("Invalid document id.");

  const { data, error } = await ctx.supabase
    .from("documents")
    .select("path")
    .eq("id", id!)
    .single();

  if (error) return internalError(error.message);
  if (!data) return notFound();

  const { error: storageError } = await ctx.supabase.storage
    .from(DOCUMENT_BUCKET)
    .remove([data.path]);

  if (storageError) return internalError(storageError.message);

  const { error: deleteError } = await ctx.supabase
    .from("documents")
    .delete()
    .eq("id", id!);

  if (deleteError) return internalError(deleteError.message);

  return success({ deleted: true });
}

export {
  completeUpload,
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
};
