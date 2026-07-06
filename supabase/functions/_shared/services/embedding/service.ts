import { DeepSeekEmbeddingProvider } from "./deepseek.ts";
import { OpenAIEmbeddingProvider } from "./openai.ts";
import type {
  Embedding,
  EmbeddingProvider,
  EmbeddingRequest,
} from "./types.ts";

export type { Embedding, EmbeddingProvider, EmbeddingRequest };
export { DeepSeekEmbeddingProvider, OpenAIEmbeddingProvider };

export class EmbeddingService {
  private provider: EmbeddingProvider;

  constructor(provider?: EmbeddingProvider) {
    this.provider = provider ?? new OpenAIEmbeddingProvider();
  }

  static openai(apiKey?: string, model?: string): EmbeddingService {
    return new EmbeddingService(new OpenAIEmbeddingProvider(apiKey, model));
  }

  static deepseek(apiKey?: string, model?: string): EmbeddingService {
    return new EmbeddingService(new DeepSeekEmbeddingProvider(apiKey, model));
  }

  async createEmbedding(text: string): Promise<Embedding> {
    const [embedding] = await this.provider.createEmbedding({ input: text });
    return embedding;
  }

  async createEmbeddings(texts: string[]): Promise<Embedding[]> {
    return await this.provider.createEmbedding({ input: texts });
  }
}
