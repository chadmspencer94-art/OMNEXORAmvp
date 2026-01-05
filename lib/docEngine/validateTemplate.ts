/**
 * Template Schema Validation
 * 
 * Validates document templates against the schema at runtime.
 * Fails fast with readable error messages.
 */

import type { DocumentTemplate, Section, Field, Table, OvisCheck } from "./types";

export class TemplateValidationError extends Error {
  constructor(message: string, public path?: string) {
    super(message);
    this.name = "TemplateValidationError";
  }
}

/**
 * Validate a document template
 */
export function validateTemplate(template: any): template is DocumentTemplate {
  if (!template || typeof template !== "object") {
    throw new TemplateValidationError("Template must be an object");
  }

  // Required top-level fields
  if (!template.schemaVersion || typeof template.schemaVersion !== "string") {
    throw new TemplateValidationError("Template must have a 'schemaVersion' string field");
  }

  if (!template.jurisdiction || typeof template.jurisdiction !== "string") {
    throw new TemplateValidationError("Template must have a 'jurisdiction' string field");
  }

  if (!template.docType || !["SWMS", "PAYMENT_CLAIM_WA", "TOOLBOX_TALK"].includes(template.docType)) {
    throw new TemplateValidationError("Template must have a 'docType' field with value 'SWMS', 'PAYMENT_CLAIM_WA', or 'TOOLBOX_TALK'");
  }

  if (!template.title || typeof template.title !== "string") {
    throw new TemplateValidationError("Template must have a 'title' string field");
  }

  if (!template.disclaimer || typeof template.disclaimer !== "string") {
    throw new TemplateValidationError("Template must have a 'disclaimer' string field");
  }

  // Validate disclaimer contains required language
  const disclaimerLower = template.disclaimer.toLowerCase();
  if (!disclaimerLower.includes("draft") && !disclaimerLower.includes("review")) {
    throw new TemplateValidationError("Template disclaimer must mention 'draft' or 'review required'");
  }

  // Validate sections
  if (!Array.isArray(template.sections)) {
    throw new TemplateValidationError("Template must have a 'sections' array");
  }

  if (template.sections.length === 0) {
    throw new TemplateValidationError("Template must have at least one section");
  }

  template.sections.forEach((section: any, index: number) => {
    validateSection(section, `sections[${index}]`);
  });

  // Validate OVIS checks
  if (!Array.isArray(template.ovisChecks)) {
    throw new TemplateValidationError("Template must have an 'ovisChecks' array");
  }

  template.ovisChecks.forEach((check: any, index: number) => {
    validateOvisCheck(check, `ovisChecks[${index}]`);
  });

  return true;
}

function validateSection(section: any, path: string): asserts section is Section {
  if (!section.id || typeof section.id !== "string") {
    throw new TemplateValidationError(`Section at ${path} must have an 'id' string field`, path);
  }

  if (!section.title || typeof section.title !== "string") {
    throw new TemplateValidationError(`Section at ${path} must have a 'title' string field`, path);
  }

  // Section must have either fields or table
  if (!section.fields && !section.table) {
    throw new TemplateValidationError(`Section at ${path} must have either 'fields' or 'table'`, path);
  }

  if (section.fields) {
    if (!Array.isArray(section.fields)) {
      throw new TemplateValidationError(`Section at ${path}.fields must be an array`, path);
    }

    section.fields.forEach((field: any, index: number) => {
      validateField(field, `${path}.fields[${index}]`);
    });
  }

  if (section.table) {
    validateTable(section.table, `${path}.table`);
  }
}

function validateField(field: any, path: string): asserts field is Field {
  if (!field.id || typeof field.id !== "string") {
    throw new TemplateValidationError(`Field at ${path} must have an 'id' string field`, path);
  }

  if (!field.label || typeof field.label !== "string") {
    throw new TemplateValidationError(`Field at ${path} must have a 'label' string field`, path);
  }

  const validTypes: string[] = ["text", "textarea", "date", "select", "multiSelect", "currency", "number"];
  if (!field.type || !validTypes.includes(field.type)) {
    throw new TemplateValidationError(`Field at ${path} must have a 'type' field with value: ${validTypes.join(", ")}`, path);
  }

  if (field.options && !Array.isArray(field.options)) {
    throw new TemplateValidationError(`Field at ${path}.options must be an array`, path);
  }

  if ((field.type === "select" || field.type === "multiSelect") && (!field.options || field.options.length === 0)) {
    throw new TemplateValidationError(`Field at ${path} with type '${field.type}' must have 'options' array`, path);
  }
}

function validateTable(table: any, path: string): asserts table is Table {
  if (!table.id || typeof table.id !== "string") {
    throw new TemplateValidationError(`Table at ${path} must have an 'id' string field`, path);
  }

  if (!Array.isArray(table.columns) || table.columns.length === 0) {
    throw new TemplateValidationError(`Table at ${path} must have a 'columns' array with at least one column`, path);
  }

  table.columns.forEach((column: any, index: number) => {
    if (!column.id || typeof column.id !== "string") {
      throw new TemplateValidationError(`Table column at ${path}.columns[${index}] must have an 'id' string field`, path);
    }

    if (!column.label || typeof column.label !== "string") {
      throw new TemplateValidationError(`Table column at ${path}.columns[${index}] must have a 'label' string field`, path);
    }
  });

  if (!table.rowsKey || typeof table.rowsKey !== "string") {
    throw new TemplateValidationError(`Table at ${path} must have a 'rowsKey' string field`, path);
  }
}

function validateOvisCheck(check: any, path: string): asserts check is OvisCheck {
  if (!check.id || typeof check.id !== "string") {
    throw new TemplateValidationError(`OVIS check at ${path} must have an 'id' string field`, path);
  }

  const validSeverities: string[] = ["low", "medium", "high"];
  if (!check.severity || !validSeverities.includes(check.severity)) {
    throw new TemplateValidationError(`OVIS check at ${path} must have a 'severity' field with value: ${validSeverities.join(", ")}`, path);
  }

  if (!check.rule || typeof check.rule !== "string") {
    throw new TemplateValidationError(`OVIS check at ${path} must have a 'rule' string field`, path);
  }

  if (!check.message || typeof check.message !== "string") {
    throw new TemplateValidationError(`OVIS check at ${path} must have a 'message' string field`, path);
  }
}

