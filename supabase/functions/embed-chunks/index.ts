import "@supabase/functions-js/edge-runtime.d.ts";

import {
  type ApiResponse,
  badRequest,
  internalError,
  methodNotAllowed,
  success,
} from "_shared/types/response_types.ts";
import { BroadcastService } from "_shared/services/broadcast/service.ts";
import { processEmbeddings } from "./daf.ts";

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

    const bg = processEmbeddings(documentId);

    const edgeRuntime = (globalThis as Record<string, unknown>)
      .EdgeRuntime as
        | { waitUntil: (p: Promise<unknown>) => void }
        | undefined;

    if (edgeRuntime?.waitUntil) {
      edgeRuntime.waitUntil(bg);
      return success({ message: "Embedding started." });
    }

    await bg;
    return success({ message: "Embedding completed." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined;
    return internalError(message);
  }
};

export default {
  fetch: handler,
};
