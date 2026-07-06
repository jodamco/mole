import { assertEquals, assertRejects } from "@std/assert";
import { OpenAIEmbeddingProvider } from "../../../../_shared/services/embedding/openai.ts";
import { ServerError } from "../../../../_shared/types/error_types.ts";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string | URL | Request, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = handler as typeof fetch;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("OpenAIEmbeddingProvider throws if no API key", () => {
  const originalKey = Deno.env.get("OPENAI_API_KEY");
  Deno.env.delete("OPENAI_API_KEY");

  try {
    new OpenAIEmbeddingProvider();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "OPENAI_API_KEY is required");
  } finally {
    if (originalKey) Deno.env.set("OPENAI_API_KEY", originalKey);
  }
});

Deno.test("OpenAIEmbeddingProvider uses provided API key", () => {
  const provider = new OpenAIEmbeddingProvider("test-key-123");
  assertEquals(provider instanceof OpenAIEmbeddingProvider, true);
});

Deno.test("OpenAIEmbeddingProvider uses default model", async () => {
  let capturedBody = "";
  mockFetch(async (_url, init) => {
    capturedBody = init?.body as string;
    return jsonResponse({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
    });
  });

  try {
    const provider = new OpenAIEmbeddingProvider("test-key");
    const result = await provider.createEmbedding({ input: "hello" });

    assertEquals(result.length, 1);
    assertEquals(result[0].values, [0.1, 0.2, 0.3]);
    assertEquals(result[0].model, "text-embedding-3-small");

    const body = JSON.parse(capturedBody);
    assertEquals(body.model, "text-embedding-3-small");
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider uses custom model", async () => {
  let capturedBody = "";
  mockFetch(async (_url, init) => {
    capturedBody = init?.body as string;
    return jsonResponse({
      data: [{ embedding: [0.5, 0.6] }],
    });
  });

  try {
    const provider = new OpenAIEmbeddingProvider("test-key", "text-embedding-ada-002");
    const result = await provider.createEmbedding({ input: "test" });

    assertEquals(result[0].model, "text-embedding-ada-002");

    const body = JSON.parse(capturedBody);
    assertEquals(body.model, "text-embedding-ada-002");
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider sends correct request format", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  mockFetch(async (url, init) => {
    capturedUrl = url.toString();
    capturedInit = init;
    return jsonResponse({
      data: [{ embedding: [1.0] }],
    });
  });

  try {
    const provider = new OpenAIEmbeddingProvider("my-api-key");
    await provider.createEmbedding({ input: "hello world" });

    assertEquals(capturedUrl, "https://api.openai.com/v1/embeddings");
    assertEquals(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assertEquals(headers?.["Content-Type"], "application/json");
    assertEquals(headers?.["Authorization"], "Bearer my-api-key");

    const body = JSON.parse(capturedInit?.body as string);
    assertEquals(body.input, "hello world");
    assertEquals(body.model, "text-embedding-3-small");
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider handles multiple embeddings", async () => {
  mockFetch(async () => {
    return jsonResponse({
      data: [
        { embedding: [0.1, 0.2] },
        { embedding: [0.3, 0.4] },
        { embedding: [0.5, 0.6] },
      ],
    });
  });

  try {
    const provider = new OpenAIEmbeddingProvider("test-key");
    const result = await provider.createEmbedding({ input: ["a", "b", "c"] });

    assertEquals(result.length, 3);
    assertEquals(result[0].values, [0.1, 0.2]);
    assertEquals(result[1].values, [0.3, 0.4]);
    assertEquals(result[2].values, [0.5, 0.6]);
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider uses request model override", async () => {
  let capturedBody = "";
  mockFetch(async (_url, init) => {
    capturedBody = init?.body as string;
    return jsonResponse({
      data: [{ embedding: [0.1] }],
    });
  });

  try {
    const provider = new OpenAIEmbeddingProvider("test-key");
    const result = await provider.createEmbedding({
      input: "test",
      model: "custom-model",
    });

    assertEquals(result[0].model, "custom-model");

    const body = JSON.parse(capturedBody);
    assertEquals(body.model, "custom-model");
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider throws on 4xx error", async () => {
  mockFetch(async () => {
    return jsonResponse(
      { error: { message: "Invalid API key provided" } },
      401,
    );
  });

  try {
    const provider = new OpenAIEmbeddingProvider("bad-key");
    await assertRejects(
      () => provider.createEmbedding({ input: "test" }),
      Error,
      "Invalid API key provided",
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider throws on 4xx without error message", async () => {
  mockFetch(async () => {
    return jsonResponse({}, 400);
  });

  try {
    const provider = new OpenAIEmbeddingProvider("test-key");
    await assertRejects(
      () => provider.createEmbedding({ input: "test" }),
      Error,
      "OpenAI API error: 400",
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("OpenAIEmbeddingProvider throws ServerError on 5xx", async () => {
  mockFetch(async () => {
    return new Response("Internal Server Error", { status: 500 });
  });

  try {
    const provider = new OpenAIEmbeddingProvider("test-key");
    await assertRejects(
      () => provider.createEmbedding({ input: "test" }),
      ServerError,
    );
  } finally {
    restoreFetch();
  }
});
