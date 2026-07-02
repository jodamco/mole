import "@supabase/functions-js/edge-runtime.d.ts";

import {
  ApiResponse,
  badRequest,
  internalError,
  methodNotAllowed,
} from "../_shared/types/response_types.ts";
import { processChunking } from "./daf.ts";

/// Edge function called externaly through message broker
const handler = async (req: Request): Promise<ApiResponse> => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await req.json();
    const documentId = body.documentId;

    if (typeof documentId !== "number") {
      return badRequest("Missing or invalid documentId.");
    }

    return await processChunking(documentId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
};

export default {
  fetch: handler,
};
