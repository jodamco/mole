import type {
  Embedding,
  EmbeddingProvider,
  EmbeddingRequest,
} from "./types.ts";
import { ServerError } from "../../types/error_types.ts";
import { requestWithRetry } from "../../utils/request_utils.ts";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/embeddings";

export class DeepSeekEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = "deepseek-embedding") {
    this.apiKey = apiKey ?? Deno.env.get("DEEPSEEK_API_KEY") ?? "";
    if (!this.apiKey) throw new Error("DEEPSEEK_API_KEY is required");
    this.model = model;
  }

  async createEmbedding(request: EmbeddingRequest): Promise<Embedding[]> {
    const response = await requestWithRetry(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: request.input,
        model: request.model ?? this.model,
      }),
    });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ServerError(response.status, await response.text());
      }
      const body = await response.json().catch(() => ({}));
      throw new Error(
        body.error?.message ?? `DeepSeek API error: ${response.status}`,
      );
    }

    const data = await response.json();
    const usedModel = request.model ?? this.model;
    const usage = data.usage;
    return data.data.map((item: { embedding: number[] }) => ({
      values: item.embedding,
      model: usedModel,
      usage,
    }));
  }
}
