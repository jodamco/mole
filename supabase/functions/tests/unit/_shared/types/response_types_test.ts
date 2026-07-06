import { assertEquals } from "@std/assert";
import {
  success,
  badRequest,
  unauthorized,
  accessDenied,
  notFound,
  methodNotAllowed,
  internalError,
  allowPreflight,
} from "../../../../_shared/types/response_types.ts";

async function assertResponse(
  response: Response,
  expectedStatus: number,
  expectedBody: Record<string, unknown>,
): Promise<void> {
  assertEquals(response.status, expectedStatus);
  const body = await response.json();
  assertEquals(body, expectedBody);
}

Deno.test("success returns 200 with body", async () => {
  await assertResponse(success({ data: "test" }), 200, { data: "test" });
});

Deno.test("success returns 200 with array body", async () => {
  await assertResponse(success({ items: [1, 2, 3] }), 200, { items: [1, 2, 3] });
});

Deno.test("badRequest returns 400 with default message", async () => {
  await assertResponse(badRequest(), 400, { message: "Bad request" });
});

Deno.test("badRequest returns 400 with custom message", async () => {
  await assertResponse(badRequest("Name is required."), 400, { message: "Name is required." });
});

Deno.test("unauthorized returns 401 with default message", async () => {
  await assertResponse(unauthorized(), 401, { message: "Unauthorized" });
});

Deno.test("unauthorized returns 401 with custom message", async () => {
  await assertResponse(unauthorized("Invalid token."), 401, { message: "Invalid token." });
});

Deno.test("accessDenied returns 403 with default message", async () => {
  await assertResponse(accessDenied(), 403, { message: "Access Denied" });
});

Deno.test("notFound returns 404 with default message", async () => {
  await assertResponse(notFound(), 404, { message: "Not found" });
});

Deno.test("notFound returns 404 with custom message", async () => {
  await assertResponse(notFound("Collection not found."), 404, { message: "Collection not found." });
});

Deno.test("methodNotAllowed returns 405 with default message", async () => {
  await assertResponse(methodNotAllowed(), 405, { message: "Method not allowed" });
});

Deno.test("internalError returns 500 with default message", async () => {
  await assertResponse(internalError(), 500, { message: "Internal Server Error" });
});

Deno.test("internalError returns 500 with custom message", async () => {
  await assertResponse(internalError("Something went wrong."), 500, { message: "Something went wrong." });
});

Deno.test("allowPreflight returns 200", async () => {
  await assertResponse(allowPreflight(), 200, { message: "OPTIONS accepted" });
});
