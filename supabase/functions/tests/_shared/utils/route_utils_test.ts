import { assertEquals } from "@std/assert";
import { getIdFromPath } from "../../../_shared/utils/route_utils.ts";

Deno.test("getIdFromPath returns id when last segment is a number", () => {
  const req = new Request("http://localhost/collections/42");
  assertEquals(getIdFromPath(req), 42);
});

Deno.test("getIdFromPath returns null when last segment is not a number", () => {
  const req = new Request("http://localhost/collections/abc");
  assertEquals(getIdFromPath(req), null);
});

Deno.test("getIdFromPath returns null when path has no segments", () => {
  const req = new Request("http://localhost/");
  assertEquals(getIdFromPath(req), null);
});

Deno.test("getIdFromPath returns null when path is root", () => {
  const req = new Request("http://localhost");
  assertEquals(getIdFromPath(req), null);
});

Deno.test("getIdFromPath returns null for float values", () => {
  const req = new Request("http://localhost/collections/3.14");
  assertEquals(getIdFromPath(req), null);
});

Deno.test("getIdFromPath returns negative number as valid", () => {
  const req = new Request("http://localhost/collections/-1");
  assertEquals(getIdFromPath(req), -1);
});

Deno.test("getIdFromPath works with nested paths", () => {
  const req = new Request("http://localhost/api/v1/collections/7");
  assertEquals(getIdFromPath(req), 7);
});
