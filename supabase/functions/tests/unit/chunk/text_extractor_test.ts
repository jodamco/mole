import { assertEquals, assertRejects } from "@std/assert";
import { extractText } from "../../../chunk/text_extractor.ts";

function createMinimalPdf(text: string): ArrayBuffer {
  const encoder = new TextEncoder();

  const header = "%PDF-1.0\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

  const streamContent = `BT /F1 12 Tf 100 700 Td (${text}) Tj ET`;
  const obj4 =
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  const obj5 =
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  let offset = header.length;
  const offsets = [0];

  offsets.push(offset);
  offset += obj1.length;

  offsets.push(offset);
  offset += obj2.length;

  offsets.push(offset);
  offset += obj3.length;

  offsets.push(offset);
  offset += obj4.length;

  offsets.push(offset);
  offset += obj5.length;

  const xrefStart = offset;
  let xref = `xref\n0 6\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const pdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return encoder.encode(pdf).buffer;
}

function createEmptyPdf(): ArrayBuffer {
  const encoder = new TextEncoder();

  const header = "%PDF-1.0\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

  const streamContent = "";
  const obj4 =
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  const obj5 =
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  let offset = header.length;
  const offsets = [0];

  offsets.push(offset);
  offset += obj1.length;

  offsets.push(offset);
  offset += obj2.length;

  offsets.push(offset);
  offset += obj3.length;

  offsets.push(offset);
  offset += obj4.length;

  offsets.push(offset);
  offset += obj5.length;

  const xrefStart = offset;
  let xref = `xref\n0 6\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const pdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return encoder.encode(pdf).buffer;
}

Deno.test("extractText extracts text from .txt file", async () => {
  const text = "Hello, world!\nThis is a test.";
  const buffer = new TextEncoder().encode(text).buffer;

  const result = await extractText(buffer, "test.txt");
  assertEquals(result, text);
});

Deno.test("extractText extracts text from .txt file with unicode", async () => {
  const text = "Hello 世界 🌍";
  const buffer = new TextEncoder().encode(text).buffer;

  const result = await extractText(buffer, "test.txt");
  assertEquals(result, text);
});

Deno.test("extractText extracts text from .pdf file", async () => {
  const buffer = createMinimalPdf("Hello PDF");

  const result = await extractText(buffer, "test.pdf");
  assertEquals(result.includes("Hello PDF"), true);
});

Deno.test("extractText throws error for image-based PDF", async () => {
  const buffer = createEmptyPdf();

  await assertRejects(
    () => extractText(buffer, "test.pdf"),
    Error,
    "image-based",
  );
});

Deno.test("extractText throws error for .doc file", async () => {
  const buffer = new ArrayBuffer(0);

  await assertRejects(
    () => extractText(buffer, "test.doc"),
    Error,
    ".doc format is not supported",
  );
});

Deno.test("extractText throws error for unsupported extension", async () => {
  const buffer = new ArrayBuffer(0);

  await assertRejects(
    () => extractText(buffer, "test.xyz"),
    Error,
    "Unsupported file extension",
  );
});

Deno.test("extractText throws error for file without extension", async () => {
  const buffer = new ArrayBuffer(0);

  await assertRejects(
    () => extractText(buffer, "noextension"),
    Error,
    "Unsupported file extension",
  );
});

Deno.test("extractText handles uppercase extension", async () => {
  const text = "Hello uppercase";
  const buffer = new TextEncoder().encode(text).buffer;

  const result = await extractText(buffer, "test.TXT");
  assertEquals(result, text);
});

Deno.test("extractText handles mixed case extension", async () => {
  const buffer = new ArrayBuffer(0);

  await assertRejects(
    () => extractText(buffer, "test.Doc"),
    Error,
    ".doc format is not supported",
  );
});
