import { Embedding } from "../_shared/services/embedding/service.ts";

export type Chunk = { id: number; txt: string };

export type ChunkBatch = Array<Chunk>;

export type EmbeddingResult = {
  batch: ChunkBatch;
  embeddings?: Embedding[];
  ok: boolean;
};
