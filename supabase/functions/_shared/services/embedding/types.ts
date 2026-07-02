export interface Embedding {
  values: number[];
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingProvider {
  createEmbedding(request: EmbeddingRequest): Promise<Embedding[]>;
}
