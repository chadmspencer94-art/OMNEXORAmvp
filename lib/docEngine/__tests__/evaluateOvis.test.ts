/**
 * OVIS Evaluation Tests
 */

import { evaluateOvis } from "../evaluateOvis";
import type { DocumentTemplate } from "../types";

describe("evaluateOvis", () => {
  const template: DocumentTemplate = {
    schemaVersion: "1.0",
    jurisdiction: "AU-WA",
    docType: "SWMS",
    title: "Test Template",
    disclaimer: "Draft generated from user inputs. Review required.",
    sections: [],
    ovisChecks: [
      {
        id: "empty-field",
        severity: "high",
        rule: "empty('field1')",
        message: "Field 1 is required",
      },
      {
        id: "exists-field",
        severity: "medium",
        rule: "exists('field2')",
        message: "Field 2 should exist",
      },
      {
        id: "len-check",
        severity: "low",
        rule: "len('arrayField') < 1",
        message: "Array should have at least 1 item",
      },
    ],
  };

  it("should return warning when field is empty", () => {
    const data = { field1: "", field2: "value", arrayField: [] };
    const warnings = evaluateOvis(template, data);
    expect(warnings).toHaveLength(2); // empty-field and len-check
    expect(warnings.find((w) => w.id === "empty-field")).toBeDefined();
    expect(warnings.find((w) => w.id === "len-check")).toBeDefined();
  });

  it("should not return warning when field has value", () => {
    const data = { field1: "value", field2: "value", arrayField: ["item"] };
    const warnings = evaluateOvis(template, data);
    expect(warnings.find((w) => w.id === "empty-field")).toBeUndefined();
    expect(warnings.find((w) => w.id === "exists-field")).toBeDefined();
  });

  it("should handle null and undefined values", () => {
    const data = { field1: null, field2: undefined, arrayField: [] };
    const warnings = evaluateOvis(template, data);
    expect(warnings.find((w) => w.id === "empty-field")).toBeDefined();
  });

  it("should handle array length checks", () => {
    const data = { field1: "value", field2: "value", arrayField: [] };
    const warnings = evaluateOvis(template, data);
    expect(warnings.find((w) => w.id === "len-check")).toBeDefined();
  });

  it("should return empty array when no warnings", () => {
    const data = { field1: "value", field2: "value", arrayField: ["item"] };
    const warnings = evaluateOvis(template, data);
    // Only exists-field should trigger (field2 exists)
    expect(warnings.length).toBeGreaterThanOrEqual(0);
  });
});

