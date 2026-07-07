import { assertEquals, assertRejects } from "@std/assert";
import { DeepSeekEmbeddingProvider } from "../../../../../_shared/services/embedding/deepseek.ts";
import { ServerError } from "../../../../../_shared/types/error_types.ts";

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

Deno.test("DeepSeekEmbeddingProvider throws if no API key", () => {
  const originalKey = Deno.env.get("DEEPSEEK_API_KEY");
  Deno.env.delete("DEEPSEEK_API_KEY");

  try {
    new DeepSeekEmbeddingProvider();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "DEEPSEEK_API_KEY is required");
  } finally {
    if (originalKey) Deno.env.set("DEEPSEEK_API_KEY", originalKey);
  }
});

Deno.test("DeepSeekEmbeddingProvider uses provided API key", () => {
  const provider = new DeepSeekEmbeddingProvider("test-key-123");
  assertEquals(provider instanceof DeepSeekEmbeddingProvider, true);
});

Deno.test("DeepSeekEmbeddingProvider uses default model", async () => {
  let capturedBody = "";
  mockFetch(async (_url, init) => {
    capturedBody = init?.body as string;
    return await Promise.resolve(jsonResponse({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { prompt_tokens: 5, total_tokens: 5 },
    }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key");
    const result = await provider.createEmbedding({ input: "hello" });

    assertEquals(result.length, 1);
    assertEquals(result[0].values, [0.1, 0.2, 0.3]);
    assertEquals(result[0].model, "deepseek-embedding");
    assertEquals(result[0].usage, { prompt_tokens: 5, total_tokens: 5 });

    const body = JSON.parse(capturedBody);
    assertEquals(body.model, "deepseek-embedding");
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider uses custom model", async () => {
  let capturedBody = "";
  mockFetch(async (_url, init) => {
    capturedBody = init?.body as string;
    return await Promise.resolve(jsonResponse({
      data: [{ embedding: [0.5, 0.6] }],
      usage: { prompt_tokens: 3, total_tokens: 3 },
    }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key", "deepseek-v3");
    const result = await provider.createEmbedding({ input: "test" });

    assertEquals(result[0].model, "deepseek-v3");

    const body = JSON.parse(capturedBody);
    assertEquals(body.model, "deepseek-v3");
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider sends correct request format", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  mockFetch(async (url, init) => {
    capturedUrl = url.toString();
    capturedInit = init;
    return await Promise.resolve(jsonResponse({
      data: [{ embedding: [1.0] }],
      usage: { prompt_tokens: 1, total_tokens: 1 },
    }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("my-api-key");
    await provider.createEmbedding({ input: "hello world" });

    assertEquals(capturedUrl, "https://api.deepseek.com/v1/embeddings");
    assertEquals(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assertEquals(headers?.["Content-Type"], "application/json");
    assertEquals(headers?.["Authorization"], "Bearer my-api-key");

    const body = JSON.parse(capturedInit?.body as string);
    assertEquals(body.input, "hello world");
    assertEquals(body.model, "deepseek-embedding");
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider handles multiple embeddings", async () => {
  mockFetch(async () => {
    return await Promise.resolve(jsonResponse({
      data: [
        { embedding: [0.1, 0.2] },
        { embedding: [0.3, 0.4] },
      ],
      usage: { prompt_tokens: 10, total_tokens: 10 },
    }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key");
    const result = await provider.createEmbedding({ input: ["a", "b"] });

    assertEquals(result.length, 2);
    assertEquals(result[0].values, [0.1, 0.2]);
    assertEquals(result[1].values, [0.3, 0.4]);
    assertEquals(result[0].usage, { prompt_tokens: 10, total_tokens: 10 });
    assertEquals(result[1].usage, { prompt_tokens: 10, total_tokens: 10 });
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider uses request model override", async () => {
  let capturedBody = "";
  mockFetch(async (_url, init) => {
    capturedBody = init?.body as string;
    return await Promise.resolve(jsonResponse({
      data: [{ embedding: [0.1] }],
      usage: { prompt_tokens: 2, total_tokens: 2 },
    }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key");
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

Deno.test("DeepSeekEmbeddingProvider throws on 4xx error", async () => {
  mockFetch(async () => {
    return await Promise.resolve(jsonResponse(
      { error: { message: "Invalid API key" } },
      401,
    ));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("bad-key");
    await assertRejects(
      () => provider.createEmbedding({ input: "test" }),
      Error,
      "Invalid API key",
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider throws on 4xx without error message", async () => {
  mockFetch(async () => {
    return await Promise.resolve(jsonResponse({}, 400));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key");
    await assertRejects(
      () => provider.createEmbedding({ input: "test" }),
      Error,
      "DeepSeek API error: 400",
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider throws ServerError on 5xx", async () => {
  mockFetch(async () => {
    return await Promise.resolve(new Response("Internal Server Error", { status: 500 }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key");
    await assertRejects(
      () => provider.createEmbedding({ input: "test" }),
      ServerError,
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("DeepSeekEmbeddingProvider handles missing usage in response", async () => {
  mockFetch(async () => {
    return await Promise.resolve(jsonResponse({
      data: [{ embedding: [0.1, 0.2] }],
    }));
  });

  try {
    const provider = new DeepSeekEmbeddingProvider("test-key");
    const result = await provider.createEmbedding({ input: "test" });

    assertEquals(result.length, 1);
    assertEquals(result[0].values, [0.1, 0.2]);
    assertEquals(result[0].usage, undefined);
  } finally {
    restoreFetch();
  }
});
