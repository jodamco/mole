import "@supabase/functions-js/edge-runtime.d.ts";

import {
  type ApiResponse,
  badRequest,
  internalError,
  methodNotAllowed,
  success,
} from "../_shared/types/response_types.ts";
import { processEmbeddings } from "./daf.ts";

const handler = async (req: Request): Promise<ApiResponse> => {
  if (req.method !== "POST") return methodNotAllowed();

  try {
    const body = await req.json();
    const documentId = body.documentId;

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
