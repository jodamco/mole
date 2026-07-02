import type { SupabaseClient } from "@supabase/supabase-js";

export class DocumentStatus {
  private constructor(private ids: Map<string, number>) {}

  static async load(supabase: SupabaseClient): Promise<DocumentStatus> {
    const { data } = await supabase
      .from("document_status")
      .select("name, id");

    if (!data) throw new Error("Failed to load document statuses.");

    const ids = new Map<string, number>(
      data.map((s: { name: string; id: number }) => [s.name, s.id]),
    );
    return new DocumentStatus(ids);
  }

  get uploading(): number {
    return this.getId("uploading");
  }
  get uploaded(): number {
    return this.getId("uploaded");
  }
  get chunking(): number {
    return this.getId("chunking");
  }
  get chunked(): number {
    return this.getId("chunked");
  }
  get embedding(): number {
    return this.getId("embedding");
  }
  get ready(): number {
    return this.getId("ready");
  }
  get error(): number {
    return this.getId("error");
  }
  get deleted(): number {
    return this.getId("deleted");
  }

  private getId(name: string): number {
    const id = this.ids.get(name);
    if (id === undefined) {
      throw new Error(`Document status "${name}" not found in the database.`);
    }
    return id;
  }
}
