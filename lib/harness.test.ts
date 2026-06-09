import { test, assert, summarize } from "./test-helpers.ts";
test("harness runs", () => assert(1 + 1 === 2, "math"));
summarize();
