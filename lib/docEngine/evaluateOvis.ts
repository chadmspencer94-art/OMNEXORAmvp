/**
 * OVIS Checks Evaluation
 * 
 * Evaluates OVIS rules against merged data using a simple DSL.
 * Rules are warnings/flags only - not assertions of compliance.
 */

import type { OvisCheck, DocumentTemplate } from "./types";

/**
 * Get value from nested object using dot notation path
 */
function getValueByPath(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Evaluate a single OVIS rule
 * 
 * Supported rule syntax:
 * - exists(path) - checks if value exists and is not null/undefined/empty
 * - empty(path) - checks if value is empty/null/undefined
 * - len(path) < N - checks if length is less than N
 * - len(path) === N - checks if length equals N
 * - equals(path, value) - checks if value equals the given value
 */
function evaluateRule(rule: string, data: Record<string, any>): boolean {
  const trimmed = rule.trim();
  
  // exists(path)
  const existsMatch = trimmed.match(/^exists\(["']?([^"')]+)["']?\)$/);
  if (existsMatch) {
    const path = existsMatch[1];
    const value = getValueByPath(data, path);
    return value !== null && value !== undefined && value !== "" && 
           !(Array.isArray(value) && value.length === 0);
  }
  
  // empty(path)
  const emptyMatch = trimmed.match(/^empty\(["']?([^"')]+)["']?\)$/);
  if (emptyMatch) {
    const path = emptyMatch[1];
    const value = getValueByPath(data, path);
    return value === null || value === undefined || value === "" || 
           (Array.isArray(value) && value.length === 0);
  }
  
  // len(path) < N
  const lenLessMatch = trimmed.match(/^len\(["']?([^"')]+)["']?\)\s*<\s*(\d+)$/);
  if (lenLessMatch) {
    const path = lenLessMatch[1];
    const maxLen = parseInt(lenLessMatch[2], 10);
    const value = getValueByPath(data, path);
    if (Array.isArray(value)) {
      return value.length < maxLen;
    }
    if (typeof value === "string") {
      return value.length < maxLen;
    }
    return true; // Non-string/non-array treated as empty
  }
  
  // len(path) === N
  const lenEqualMatch = trimmed.match(/^len\(["']?([^"')]+)["']?\)\s*===\s*(\d+)$/);
  if (lenEqualMatch) {
    const path = lenEqualMatch[1];
    const expectedLen = parseInt(lenEqualMatch[2], 10);
    const value = getValueByPath(data, path);
    if (Array.isArray(value)) {
      return value.length === expectedLen;
    }
    if (typeof value === "string") {
      return value.length === expectedLen;
    }
    return false;
  }
  
  // equals(path, value)
  const equalsMatch = trimmed.match(/^equals\(["']?([^"')]+)["']?,\s*["']?([^"')]*)["']?\)$/);
  if (equalsMatch) {
    const path = equalsMatch[1];
    const expectedValue = equalsMatch[2];
    const value = getValueByPath(data, path);
    return String(value) === expectedValue;
  }
  
  // Unknown rule syntax - log warning and return false (don't trigger warning)
  console.warn(`[OVIS] Unknown rule syntax: ${rule}`);
  return false;
}

/**
 * Evaluate all OVIS checks for a template against merged data
 * Returns warnings that should be displayed to the user
 */
export function evaluateOvis(
  template: DocumentTemplate,
  mergedData: Record<string, any>
): Array<{ id: string; severity: "low" | "medium" | "high"; message: string }> {
  const warnings: Array<{ id: string; severity: "low" | "medium" | "high"; message: string }> = [];
  
  template.ovisChecks.forEach((check) => {
    const ruleResult = evaluateRule(check.rule, mergedData);
    
    // If rule evaluates to true, it means there's a potential issue (warning)
    if (ruleResult) {
      warnings.push({
        id: check.id,
        severity: check.severity,
        message: check.message,
      });
    }
  });
  
  return warnings;
}

