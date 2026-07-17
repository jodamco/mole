import { Json } from "_shared/types/database.types.ts";

export interface CollectionDto {
  name: string;
  description?: string | null;
  metadata?: Json | null;
}
