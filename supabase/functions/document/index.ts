import "@supabase/functions-js/edge-runtime.d.ts";

import { SupabaseContext } from "@supabase/server";

import { customFetchWrapper, getUserId } from "../_shared/utils/fetch_wrapper_utils.ts";
import { getIdFromPath } from "../_shared/utils/route_utils.ts";
import { Database } from "../_shared/types/database.types.ts";

import {
  ApiResponse,
  internalError,
  methodNotAllowed,
} from "../_shared/types/response_types.ts";
import { BroadcastService } from "../_shared/services/broadcast/service.ts";
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
  broadcastService?: BroadcastService,
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
        return completeUpload(ctx, id, broadcastService);
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

export { handler };
export default {
  fetch: customFetchWrapper(handler),
};
