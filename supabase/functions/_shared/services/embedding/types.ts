export interface Embedding {
  values: number[];
  model: string;
  usage?: { prompt_tokens: number; total_tokens: number };
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingProvider {
  createEmbedding(request: EmbeddingRequest): Promise<Embedding[]>;
}
