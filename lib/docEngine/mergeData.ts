/**
 * Data Merging
 * 
 * Merges job data and user overrides into template fields.
 */

import type { JobData, Field, DocumentTemplate } from "./types";

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
 * Set value in nested object using dot notation path
 */
function setValueByPath(obj: any, path: string, value: any): void {
  const parts = path.split(".");
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Merge job data and overrides into template fields
 */
export function mergeData(
  template: DocumentTemplate,
  jobData: JobData,
  overrides?: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = { ...jobData };
  
  // Apply overrides first (highest priority)
  if (overrides) {
    Object.assign(merged, overrides);
  }
  
  // Fill in default values from template fields
  template.sections.forEach((section) => {
    if (section.fields) {
      section.fields.forEach((field) => {
        const fieldPath = field.dataPath || field.id;
        const currentValue = getValueByPath(merged, fieldPath);
        
        // If field has no value, use default or empty value
        if (currentValue === null || currentValue === undefined || currentValue === "") {
          if (field.defaultValue !== undefined) {
            setValueByPath(merged, fieldPath, field.defaultValue);
          } else {
            // Set appropriate empty value based on type
            switch (field.type) {
              case "number":
              case "currency":
                setValueByPath(merged, fieldPath, null);
                break;
              case "multiSelect":
                setValueByPath(merged, fieldPath, []);
                break;
              default:
                setValueByPath(merged, fieldPath, "");
            }
          }
        }
      });
    }
    
    // Handle table rows
    if (section.table) {
      const rowsKey = section.table.rowsKey;
      if (!getValueByPath(merged, rowsKey)) {
        setValueByPath(merged, rowsKey, []);
      }
    }
  });
  
  return merged;
}

