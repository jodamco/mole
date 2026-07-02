const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

export function chunkText(text: string, strategyName: string): string[] {
  const name = strategyName.toLowerCase();

  if (name.includes("paragraph") || name.includes("semantic")) {
    return paragraphChunk(text);
  }

  if (name.includes("fixed") || name.includes("token")) {
    return fixedSizeChunk(text);
  }

  return paragraphChunk(text);
}

function paragraphChunk(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function fixedSizeChunk(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + DEFAULT_CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start = end - DEFAULT_OVERLAP;

    if (start >= text.length) break;
    if (start + DEFAULT_CHUNK_SIZE > text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }
  }

  return chunks.filter((c) => c.length > 0);
}
