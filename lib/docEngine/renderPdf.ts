/**
 * PDF Rendering
 * 
 * Renders a RenderModel to PDF using the existing PdfDocument class.
 * Optimized for Australian construction industry standards.
 */

import { PdfDocument } from "../pdfGenerator";
import type { RenderModel, RenderSection, RenderField, RenderTable } from "./types";

/**
 * Format date in Australian format (DD/MM/YYYY)
 */
function formatAustralianDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format currency in Australian format ($X,XXX.XX)
 */
function formatAustralianCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "$0.00";
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
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
 * Render a document model to PDF
 * @param model - The render model to convert to PDF
 * @param approved - Whether the document has been approved (if true, warnings/disclaimers are excluded)
 */
export function renderModelToPdf(model: RenderModel, approved: boolean = false): PdfDocument {
  const pdf = new PdfDocument();

  // Title with better formatting
  pdf.addTitle(model.title);
  pdf.addSeparator();

  // Record ID and timestamp metadata (Australian format)
  const timestamp = new Date(model.timestamp).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  pdf.addMetadata([
    { label: "Record ID", value: model.recordId },
    { label: "Generated", value: timestamp },
  ]);

  // Only show disclaimer/warnings if not approved
  if (!approved) {
    // Disclaimer (warning box)
    pdf.addAiWarning();
    pdf.addParagraph(model.disclaimer);
    pdf.addSeparator();
  }

  // Render sections with improved formatting
  model.sections.forEach((section, index) => {
    renderSectionToPdf(pdf, section, index === 0);
  });

  // Set custom footer with Record ID and disclaimer on every page
  pdf.setFooter((doc, pageNum, totalPages) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    
    // Only show disclaimer if not approved
    if (!approved) {
      // Disclaimer line
      doc.text(
        "Draft generated from user inputs. Review required. Not certified or verified.",
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 15,
        { align: "center" }
      );
    }
    
    // Record ID and timestamp
    doc.text(
      `Record ID: ${model.recordId} | Generated: ${timestamp} | Page ${pageNum} of ${totalPages}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  });

  // Add standard footers (will use our custom footer)
  pdf.addStandardFooters();

  return pdf;
}

function renderSectionToPdf(pdf: PdfDocument, section: RenderSection, isFirstSection: boolean = false): void {
  // Add extra space before first section
  if (!isFirstSection) {
    pdf.addSpace(4);
  }
  
  pdf.addSectionHeading(section.title);

  // Render fields with improved layout
  if (section.fields && section.fields.length > 0) {
    // Group fields into logical pairs for better layout
    const fieldsToRender = [...section.fields];
    
    // Render fields in a grid-like layout (2 columns when possible)
    for (let i = 0; i < fieldsToRender.length; i += 2) {
      const field1 = fieldsToRender[i];
      const field2 = fieldsToRender[i + 1];
      
      if (field1) {
        renderFieldToPdf(pdf, field1, field2 ? 0 : undefined);
      }
      if (field2) {
        renderFieldToPdf(pdf, field2, 1);
      }
      
      // Add spacing between field pairs
      if (i + 2 < fieldsToRender.length) {
        pdf.addSpace(2);
      }
    }
  }

  // Render table with improved formatting
  if (section.table) {
    pdf.addSpace(4);
    renderTableToPdf(pdf, section.table);
  }
  
  // Add spacing after section
  pdf.addSpace(6);
}

function renderFieldToPdf(pdf: PdfDocument, field: RenderField, column?: number): void {
  const doc = pdf.getDoc();
  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = 20;
  const marginRight = 20;
  const maxWidth = pageWidth - marginLeft - marginRight;
  const fieldWidth = column !== undefined ? (maxWidth - 10) / 2 : maxWidth; // 10px gap between columns
  const xPos = column !== undefined 
    ? marginLeft + (column * (fieldWidth + 10))
    : marginLeft;

  // Format value based on field type
  let displayValue: string;
  if (field.value !== null && field.value !== undefined && field.value !== "") {
    if (field.type === "currency") {
      displayValue = formatAustralianCurrency(field.value);
    } else if (field.type === "date") {
      displayValue = formatAustralianDate(String(field.value));
    } else if (field.type === "number") {
      const num = typeof field.value === "number" ? field.value : parseFloat(String(field.value));
      displayValue = isNaN(num) ? String(field.value) : num.toLocaleString("en-AU");
    } else {
      displayValue = String(field.value);
    }
  } else {
    displayValue = field.placeholder || "—";
  }

  pdf.checkNewPage(column !== undefined ? 10 : 12);

  // Label with better formatting
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139); // slate-500
  const labelText = `${field.label}${field.required ? " *" : ""}`;
  doc.text(labelText, xPos, pdf.getY(), { maxWidth: fieldWidth });
  pdf.addSpace(2);

  // Value with improved formatting
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const isEmpty = field.value === null || field.value === undefined || field.value === "";
  if (isEmpty) {
    doc.setTextColor(148, 163, 184); // slate-400 if empty
  } else {
    doc.setTextColor(15, 23, 42); // slate-900 if has value
  }
  
  const lines = doc.splitTextToSize(displayValue, fieldWidth);
  lines.forEach((line: string, lineIndex: number) => {
    if (lineIndex > 0) pdf.checkNewPage(5);
    doc.text(line, xPos, pdf.getY(), { maxWidth: fieldWidth });
    pdf.addSpace(3.5);
  });

  // Only add spacing if not in a column pair or if it's the second column
  if (column === undefined || column === 1) {
    pdf.addSpace(2);
  }
}

function renderTableToPdf(pdf: PdfDocument, table: RenderTable): void {
  if (table.rows.length === 0) {
    pdf.addParagraph("No items added yet.");
    return;
  }

  const doc = pdf.getDoc();
  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = 20;
  const marginRight = 20;
  const maxWidth = pageWidth - marginLeft - marginRight;
  
  // Format table data with proper formatting
  const headers = table.columns.map((col) => col.label);
  const rows = table.rows.map((row) =>
    table.columns.map((col) => {
      const val = row[col.id];
      if (val === null || val === undefined || val === "") {
        return "—";
      }
      
      // Apply formatting based on column type
      if (col.type === "currency") {
        return formatAustralianCurrency(val);
      } else if (col.type === "number") {
        const num = typeof val === "number" ? val : parseFloat(String(val));
        return isNaN(num) ? String(val) : num.toLocaleString("en-AU");
      } else if (col.type === "date") {
        return formatAustralianDate(String(val));
      }
      
      return String(val);
    })
  );

  // Calculate column widths based on percentage
  const totalWidth = table.columns.reduce((sum, col) => sum + (col.width || 100 / table.columns.length), 0);
  const colWidths = table.columns.map((col) => 
    ((col.width || 100 / table.columns.length) / totalWidth) * maxWidth
  );

  // Use improved table rendering
  pdf.addTable(headers, rows, { colWidths });
  
  // Add note if minimum rows not met
  if (table.rows.length < table.minRows) {
    pdf.addSpace(2);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(146, 64, 14); // amber-900
    doc.text(
      `Note: Minimum ${table.minRows} row${table.minRows !== 1 ? "s" : ""} required.`,
      marginLeft,
      pdf.getY()
    );
    pdf.addSpace(2);
  }
}

