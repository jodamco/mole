import { assertEquals } from "@std/assert";
import { isEmpty } from "../../../_shared/utils/validator_utils.ts";

Deno.test("isEmpty returns true for null", () => {
  assertEquals(isEmpty(null), true);
});

Deno.test("isEmpty returns true for undefined", () => {
  assertEquals(isEmpty(undefined), true);
});

Deno.test("isEmpty returns true for empty string", () => {
  assertEquals(isEmpty(""), true);
});

Deno.test("isEmpty returns true for whitespace string", () => {
  assertEquals(isEmpty("   "), true);
});

Deno.test("isEmpty returns false for non-empty string", () => {
  assertEquals(isEmpty("hello"), false);
});

Deno.test("isEmpty returns true for empty object", () => {
  assertEquals(isEmpty({}), true);
});

Deno.test("isEmpty returns false for non-empty object", () => {
  assertEquals(isEmpty({ key: "value" }), false);
});

Deno.test("isEmpty returns false for numbers", () => {
  assertEquals(isEmpty(0), false);
  assertEquals(isEmpty(42), false);
  assertEquals(isEmpty(-1), false);
});

Deno.test("isEmpty returns false for boolean", () => {
  assertEquals(isEmpty(true), false);
  assertEquals(isEmpty(false), false);
});

Deno.test("isEmpty returns true for empty arrays", () => {
  assertEquals(isEmpty([]), true);
});

Deno.test("isEmpty returns false for non-empty arrays", () => {
  assertEquals(isEmpty([1, 2, 3]), false);
});
