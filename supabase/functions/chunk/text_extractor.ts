import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

export async function extractText(
  file: ArrayBuffer,
  fileName: string,
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "txt":
      return new TextDecoder().decode(file);

    case "pdf":
      return await extractPdfText(file);

    case "docx":
      return await extractDocxText(file);

    case "doc":
      throw new Error(
        "The .doc format is not supported for text extraction. Please upload a .docx file instead.",
      );

    default:
      throw new Error(`Unsupported file extension: .${ext}`);
  }
}

async function extractPdfText(file: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: file }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as Array<{ str: string }>)
      .map((item) => item.str)
      .join(" ");
    pages.push(text);
  }

  const fullText = pages.join("\n\n");

  if (!fullText.trim()) {
    throw new Error(
      "PDF appears to be image-based (no extractable text). OCR is not supported.",
    );
  }

  return fullText;
}

async function extractDocxText(file: ArrayBuffer): Promise<string> {
  // deno-lint-ignore no-explicit-any
  const result = await mammoth.extractRawText({ buffer: new Uint8Array(file) as any });
  return result.value;
}
