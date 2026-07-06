import "@supabase/functions-js/edge-runtime.d.ts";
import { SupabaseContext } from "@supabase/server";
import {
  customFetchWrapper,
  getUserId,
} from "../_shared/utils/fetch_wrapper_utils.ts";
import {
  ApiResponse,
  internalError,
  methodNotAllowed,
} from "../_shared/types/response_types.ts";
import { Database } from "../_shared/types/database.types.ts";
import { getIdFromPath } from "../_shared/utils/route_utils.ts";
import {
  createCollection,
  deleteCollection,
  getAllCollections,
  getCollection,
  patchCollection,
} from "./daf.ts";

const handler = async (
  req: Request,
  ctx: SupabaseContext<Database>,
): Promise<ApiResponse> => {
  const { id: userId, error } = await getUserId<Database>(ctx);
  if (error || userId === undefined) return error ?? internalError();

  switch (req.method) {
    case "GET": {
      const collectionId = getIdFromPath(req);
      if (collectionId) return getCollection(ctx, collectionId);
      return getAllCollections(ctx);
    }

    case "POST":
      return createCollection(req, ctx, userId);

    case "PATCH": {
      const collectionId = getIdFromPath(req);
      return patchCollection(req, ctx, collectionId);
    }

    case "DELETE": {
      const collectionId = getIdFromPath(req);
      return deleteCollection(ctx, collectionId);
    }

    default:
      return methodNotAllowed();
  }
};

export { handler };
export default { fetch: customFetchWrapper(handler) };
