import { test } from "node:test";
import assert from "node:assert/strict";

import { dutyOfficersPayloadSchema } from "../schema";

test("accepts legacy validFrom format with spaces", () => {
  const result = dutyOfficersPayloadSchema.parse({
    validFrom: "2024-10-12 00:00:00",
  });

  assert.ok(result.validFrom instanceof Date);
  assert.equal(
    result.validFrom?.toISOString(),
    new Date("2024-10-12T00:00:00").toISOString()
  );
});

test("sanitizes invalid dates to undefined", () => {
  const warnings: unknown[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const result = dutyOfficersPayloadSchema.parse({
      validFrom: "invalid-date-value",
    });

    assert.equal(result.validFrom, undefined);
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});
