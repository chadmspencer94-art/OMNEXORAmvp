/**
 * Template Validation Tests
 */

import { validateTemplate, TemplateValidationError } from "../validateTemplate";
import type { DocumentTemplate } from "../types";

describe("validateTemplate", () => {
  const validTemplate: DocumentTemplate = {
    schemaVersion: "1.0",
    jurisdiction: "AU-WA",
    docType: "SWMS",
    title: "Test Template",
    disclaimer: "Draft generated from user inputs. Review required.",
    sections: [
      {
        id: "section1",
        title: "Section 1",
        fields: [
          {
            id: "field1",
            label: "Field 1",
            type: "text",
            required: true,
          },
        ],
      },
    ],
    ovisChecks: [
      {
        id: "check1",
        severity: "high",
        rule: "empty('field1')",
        message: "Field 1 is required",
      },
    ],
  };

  it("should validate a valid template", () => {
    expect(() => validateTemplate(validTemplate)).not.toThrow();
    expect(validateTemplate(validTemplate)).toBe(true);
  });

  it("should reject template without schemaVersion", () => {
    const invalid = { ...validTemplate, schemaVersion: undefined };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject template without disclaimer mentioning draft/review", () => {
    const invalid = { ...validTemplate, disclaimer: "No draft or review mentioned" };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject template with invalid docType", () => {
    const invalid = { ...validTemplate, docType: "INVALID" };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject template without sections", () => {
    const invalid = { ...validTemplate, sections: [] };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject section without id", () => {
    const invalid = {
      ...validTemplate,
      sections: [{ title: "Section", fields: [] }],
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject field without id", () => {
    const invalid = {
      ...validTemplate,
      sections: [
        {
          id: "section1",
          title: "Section 1",
          fields: [{ label: "Field", type: "text" }],
        },
      ],
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject field with invalid type", () => {
    const invalid = {
      ...validTemplate,
      sections: [
        {
          id: "section1",
          title: "Section 1",
          fields: [{ id: "field1", label: "Field", type: "invalid" }],
        },
      ],
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject OVIS check without id", () => {
    const invalid = {
      ...validTemplate,
      ovisChecks: [{ severity: "high", rule: "empty('field')", message: "Test" }],
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });

  it("should reject OVIS check with invalid severity", () => {
    const invalid = {
      ...validTemplate,
      ovisChecks: [
        {
          id: "check1",
          severity: "invalid",
          rule: "empty('field')",
          message: "Test",
        },
      ],
    };
    expect(() => validateTemplate(invalid)).toThrow(TemplateValidationError);
  });
});

