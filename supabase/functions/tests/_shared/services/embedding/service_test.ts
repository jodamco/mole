import { assertEquals } from "@std/assert";
import { EmbeddingService } from "../../../../_shared/services/embedding/service.ts";
import type { Embedding, EmbeddingProvider, EmbeddingRequest } from "../../../../_shared/services/embedding/types.ts";

function createMockProvider(): EmbeddingProvider & {
  calls: EmbeddingRequest[];
  results: Embedding[][];
} {
  const mock: EmbeddingProvider & {
    calls: EmbeddingRequest[];
    results: Embedding[][];
  } = {
    calls: [],
    results: [],
    async createEmbedding(request: EmbeddingRequest): Promise<Embedding[]> {
      mock.calls.push(request);
      return mock.results.shift() ?? [];
    },
  };
  return mock;
}

Deno.test("EmbeddingService.createEmbedding returns single embedding", async () => {
  const mock = createMockProvider();
  mock.results = [[{ values: [0.1, 0.2, 0.3], model: "test-model" }]];
  const service = new EmbeddingService(mock);

  const result = await service.createEmbedding("hello");

  assertEquals(result.values, [0.1, 0.2, 0.3]);
  assertEquals(result.model, "test-model");
  assertEquals(mock.calls.length, 1);
  assertEquals(mock.calls[0].input, "hello");
});

Deno.test("EmbeddingService.createEmbeddings returns array of embeddings", async () => {
  const mock = createMockProvider();
  mock.results = [[
    { values: [0.1, 0.2], model: "test-model" },
    { values: [0.3, 0.4], model: "test-model" },
  ]];
  const service = new EmbeddingService(mock);

  const result = await service.createEmbeddings(["hello", "world"]);

  assertEquals(result.length, 2);
  assertEquals(result[0].values, [0.1, 0.2]);
  assertEquals(result[1].values, [0.3, 0.4]);
  assertEquals(mock.calls[0].input, ["hello", "world"]);
});

Deno.test("EmbeddingService.createEmbedding passes string input to provider", async () => {
  const mock = createMockProvider();
  mock.results = [[{ values: [1.0], model: "m" }]];
  const service = new EmbeddingService(mock);

  await service.createEmbedding("test text");

  assertEquals(mock.calls[0].input, "test text");
});

Deno.test("EmbeddingService.createEmbeddings passes array input to provider", async () => {
  const mock = createMockProvider();
  mock.results = [[{ values: [1.0], model: "m" }, { values: [2.0], model: "m" }]];
  const service = new EmbeddingService(mock);

  await service.createEmbeddings(["text1", "text2"]);

  assertEquals(mock.calls[0].input, ["text1", "text2"]);
});

Deno.test("EmbeddingService.openai creates service with OpenAI provider", () => {
  const service = EmbeddingService.openai("test-key");
  assertEquals(service instanceof EmbeddingService, true);
});

Deno.test("EmbeddingService.deepseek creates service with DeepSeek provider", () => {
  const service = EmbeddingService.deepseek("test-key");
  assertEquals(service instanceof EmbeddingService, true);
});
