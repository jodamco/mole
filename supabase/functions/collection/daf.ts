import { SupabaseContext } from "@supabase/server";
import {
  ApiResponse,
  badRequest,
  internalError,
  notFound,
  success,
} from "../_shared/types/response_types.ts";
import { Database } from "../_shared/types/database.types.ts";
import { isEmpty } from "../_shared/utils/validator_utils.ts";
import { CollectionDto } from "./types.ts";

async function getAllCollections(
  ctx: SupabaseContext<Database>,
): Promise<ApiResponse> {
  const { data, error } = await ctx.supabase
    .from("collections")
    .select("*")
    .is("deleted_at", null);

  if (error) return internalError();

  if (!data || data.length < 1) return success({ collections: [] });

  return success({ collections: data });
}

async function getCollection(
  ctx: SupabaseContext<Database>,
  collectionId: number,
): Promise<ApiResponse> {
  if (isEmpty(collectionId)) return badRequest("Invalid collectionId");

  const { data, error } = await ctx.supabase
    .from("collections")
    .select("*")
    .eq("id", collectionId)
    .is("deleted_at", null)
    .single();

  if (error) return internalError();
  if (!data) return notFound();

  return success({ collection: data });
}

async function createCollection(
  req: Request,
  ctx: SupabaseContext<Database>,
  userId: string,
): Promise<ApiResponse> {
  if (isEmpty(userId)) return badRequest("Invalid userId");

  const body = await req.json() as CollectionDto;

  if (!body.name) {
    return badRequest("Name is required.");
  }

  const { data, error } = await ctx.supabase
    .from("collections")
    .insert({
      name: body.name,
      description: body.description,
      metadata: body.metadata,
      user_id: userId,
    })
    .select()
    .single();

  if (error) return internalError(error.message);

  return success(data);
}

async function patchCollection(
  req: Request,
  ctx: SupabaseContext<Database>,
  collectionId: number | null,
): Promise<ApiResponse> {
  if (isEmpty(collectionId)) return badRequest("Invalid collectionId");

  const body = await req.json() as Partial<CollectionDto>;

  const { data, error } = await ctx.supabase
    .from("collections")
    .update({
      ...body,
    })
    .eq("id", collectionId!)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) return internalError(error.message);
  if (!data) return notFound();

  return success(data);
}

async function deleteCollection(
  ctx: SupabaseContext<Database>,
  collectionId: number | null,
): Promise<ApiResponse> {
  if (isEmpty(collectionId)) return badRequest("Invalid collectionId");

  const { error } = await ctx.supabase
    .from("collections")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", collectionId!)
    .is("deleted_at", null);

  if (error) return internalError(error.message);

  return success({ deleted: true });
}

export {
  createCollection,
  deleteCollection,
  getAllCollections,
  getCollection,
  patchCollection,
};
