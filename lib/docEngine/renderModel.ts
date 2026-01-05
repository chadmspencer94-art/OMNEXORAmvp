/**
 * Render Model Generation
 * 
 * Converts template + merged data into a render model for UI/PDF rendering.
 */

import type { DocumentTemplate, RenderModel, RenderSection, RenderField, RenderTable, JobData } from "./types";
import { mergeData } from "./mergeData";
import { evaluateOvis } from "./evaluateOvis";

/**
 * Generate a stable Record ID for document exports
 * Format: OX-<docType>-<YYYYMMDD>-<6char>
 */
function generateRecordId(docType: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OX-${docType}-${dateStr}-${randomStr}`;
}

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
 * Format ABN in Australian format (XX XXX XXX XXX)
 */
function formatABN(abn: string | null | undefined): string {
  if (!abn) return "";
  const cleaned = abn.replace(/\s/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
  }
  return abn;
}

/**
 * Format value based on field type (Australian standards)
 */
function formatFieldValue(value: any, fieldType: string, fieldId?: string): string | number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  // Format ABN fields
  if (fieldId && (fieldId.toLowerCase().includes("abn") || fieldId.toLowerCase().includes("claimant-abn") || fieldId.toLowerCase().includes("prepared-by-abn"))) {
    return formatABN(String(value));
  }
  
  switch (fieldType) {
    case "currency":
      if (typeof value === "number") {
        // Use Australian currency format
        return new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      }
      return String(value);
    case "number":
      if (typeof value === "number") {
        return value;
      }
      const num = parseFloat(String(value));
      return isNaN(num) ? null : num;
    case "date":
      if (value instanceof Date) {
        // Format as Australian date (DD/MM/YYYY)
        return value.toLocaleDateString("en-AU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
      if (typeof value === "string") {
        // Try to parse and format as Australian date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-AU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }
      }
      return String(value);
    case "multiSelect":
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Generate render model from template and job data
 */
export function generateRenderModel(
  template: DocumentTemplate,
  jobData: JobData,
  overrides?: Record<string, any>
): RenderModel {
  // Merge data
  const merged = mergeData(template, jobData, overrides);
  
  // Evaluate OVIS checks
  const ovisWarnings = evaluateOvis(template, merged);
  
  // Generate record ID and timestamp
  const recordId = generateRecordId(template.docType);
  const timestamp = new Date().toISOString();
  
  // Build render sections
  const renderSections: RenderSection[] = template.sections
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((section): RenderSection => {
      const renderSection: RenderSection = {
        id: section.id,
        title: section.title,
      };
      
      // Process fields
      if (section.fields) {
        renderSection.fields = section.fields.map((field): RenderField => {
          const dataPath = field.dataPath || field.id;
          const rawValue = getValueByPath(merged, dataPath);
          const formattedValue = formatFieldValue(rawValue, field.type, field.id);
          
          return {
            id: field.id,
            label: field.label,
            type: field.type,
            value: formattedValue,
            required: field.required || false,
            placeholder: field.placeholder,
            options: field.options,
          };
        });
      }
      
      // Process table
      if (section.table) {
        const rowsData = getValueByPath(merged, section.table.rowsKey) || [];
        const rows: RenderTable["rows"] = Array.isArray(rowsData) 
          ? rowsData.map((row: any) => {
              const renderRow: Record<string, any> = {};
              section.table!.columns.forEach((col) => {
                const colPath = col.id;
                const rawValue = row[colPath] || getValueByPath(row, colPath) || "";
                renderRow[col.id] = formatFieldValue(rawValue, col.type || "text");
              });
              return renderRow;
            })
          : [];
        
        // Ensure minimum rows
        const minRows = section.table.minRows || 0;
        while (rows.length < minRows) {
          const emptyRow: Record<string, any> = {};
          section.table.columns.forEach((col) => {
            emptyRow[col.id] = null;
          });
          rows.push(emptyRow);
        }
        
        renderSection.table = {
          id: section.table.id,
          columns: section.table.columns,
          rows,
          minRows: section.table.minRows || 0,
        };
      }
      
      return renderSection;
    });
  
  return {
    docType: template.docType,
    title: template.title,
    disclaimer: template.disclaimer,
    recordId,
    timestamp,
    sections: renderSections,
    ovisWarnings,
  };
}

