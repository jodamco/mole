import "@supabase/functions-js/edge-runtime.d.ts";

import {
  ApiResponse,
  badRequest,
  internalError,
  methodNotAllowed,
} from "../_shared/types/response_types.ts";
import { BroadcastService } from "../_shared/services/broadcast/service.ts";
import { processChunking } from "./daf.ts";

const handler = async (req: Request): Promise<ApiResponse> => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const broadcast = new BroadcastService();
    const signature = req.headers.get(broadcast.signatureHeader);
    if (!signature) {
      return badRequest(`Missing ${broadcast.signatureHeader} header.`);
    }

    const rawBody = await req.text();
    const message = await broadcast.verifyAndParseMessage(rawBody, signature);

    const documentId = (message.data as { documentId?: unknown }).documentId;
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
