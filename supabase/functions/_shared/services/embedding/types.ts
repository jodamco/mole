export interface Embedding {
  values: number[];
  model: string;
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingProvider {
  createEmbedding(request: EmbeddingRequest): Promise<Embedding[]>;
}
