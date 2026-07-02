import "@supabase/functions-js/edge-runtime.d.ts";

import { SupabaseContext } from "@supabase/server";

import { customFetchWrapper, getUserId } from "../_shared/fetch_wrapper.ts";
import { getIdFromPath } from "../_shared/route_utils.ts";
import { Database } from "../_shared/types/database.types.ts";

import {
  ApiResponse,
  internalError,
  methodNotAllowed,
} from "../_shared/response_types.ts";
import {
  completeUpload,
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
} from "./daf.ts";

const handler = async (
  req: Request,
  ctx: SupabaseContext<Database>,
): Promise<ApiResponse> => {
  const { id: userId, error } = await getUserId(ctx);

  if (error || !userId) {
    return error ?? internalError();
  }

  switch (req.method) {
    case "GET": {
      const id = getIdFromPath(req);
      if (id) return getDocument(ctx, id);
      return getDocuments(ctx);
    }

    case "POST": {
      const segments = new URL(req.url).pathname.split("/").filter(Boolean);
      if (segments.at(-1) === "complete_upload") {
        const id = Number(segments.at(-2));
        return completeUpload(ctx, id);
      }
      return createDocument(req, ctx, userId);
    }

    case "DELETE": {
      const id = getIdFromPath(req);
      return deleteDocument(ctx, id);
    }

    default:
      return methodNotAllowed();
  }
};

export default {
  fetch: customFetchWrapper(handler),
};
