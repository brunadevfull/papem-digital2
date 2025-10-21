import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeDutyNameValue } from "./dutyNameUtils";

describe("normalizeDutyNameValue", () => {
  it("keeps plain uppercase names untouched", () => {
    const input = "LARISSA CASTRO";
    const result = normalizeDutyNameValue(input);

    assert.equal(result, "LARISSA CASTRO");
  });

  it("strips known rank and specialty prefixes", () => {
    const input = "1T (RM2-T) LARISSA CASTRO";
    const result = normalizeDutyNameValue(input);

    assert.equal(result, "LARISSA CASTRO");
  });
});
