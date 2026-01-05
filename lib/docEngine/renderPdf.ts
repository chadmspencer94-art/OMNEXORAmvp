/**
 * PDF Rendering
 * 
 * Renders a RenderModel to PDF using the existing PdfDocument class.
 * Optimized for Australian construction industry standards.
 * 
 * Supports two audiences:
 * - INTERNAL: Shows AI/OVIS warnings and disclaimers (for drafts)
 * - CLIENT: Professional client-facing export with business header, no AI warnings
 */

import { PdfDocument, PDF_CONFIG } from "../pdfGenerator";
import type { RenderModel, RenderSection, RenderField, RenderTable, IssuerProfile, DocumentAudience } from "./types";
import { formatABN, formatBusinessAddress } from "./validateIssuer";

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

// formatABN imported from validateIssuer

/**
 * Options for rendering a document to PDF
 */
export interface RenderPdfOptions {
  /** Whether the document has been approved (legacy parameter) */
  approved?: boolean;
  /** Document audience: INTERNAL (with warnings) or CLIENT (professional, no AI warnings) */
  audience?: DocumentAudience;
  /** Issuer profile for business header (required for CLIENT audience) */
  issuer?: IssuerProfile | null;
  /** Issued record ID (for client exports) */
  issuedRecordId?: string | null;
  /** Issue timestamp (for client exports) */
  issuedAt?: string | null;
}

/**
 * Render a document model to PDF
 * @param model - The render model to convert to PDF
 * @param options - Rendering options including audience and issuer
 */
export function renderModelToPdf(
  model: RenderModel, 
  optionsOrApproved: boolean | RenderPdfOptions = false
): PdfDocument {
  // Handle legacy boolean parameter for backwards compatibility
  const options: RenderPdfOptions = typeof optionsOrApproved === "boolean"
    ? { approved: optionsOrApproved }
    : optionsOrApproved;

  const {
    approved = false,
    audience = "INTERNAL",
    issuer = null,
    issuedRecordId = null,
    issuedAt = null,
  } = options;

  // For CLIENT audience, we never show AI warnings
  // For INTERNAL, we show warnings unless explicitly approved
  const showWarnings = audience === "INTERNAL" && !approved;
  const isClientExport = audience === "CLIENT";

  const pdf = new PdfDocument();
  const doc = pdf.getDoc();

  // For CLIENT exports, add business identity header
  if (isClientExport && issuer) {
    renderBusinessHeader(pdf, issuer);
    pdf.addSpace(4);
  }

  // Title with better formatting
  pdf.addTitle(model.title);
  pdf.addSeparator();

  // Record ID and timestamp metadata (Australian format)
  const displayRecordId = issuedRecordId || model.recordId;
  const displayTimestamp = issuedAt 
    ? new Date(issuedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(model.timestamp).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  
  const metadata: { label: string; value: string }[] = [
    { label: isClientExport ? "Document ID" : "Record ID", value: displayRecordId },
  ];
  
  if (isClientExport) {
    metadata.push({ label: "Issued", value: displayTimestamp });
  } else {
    metadata.push({ label: "Generated", value: displayTimestamp });
  }

  pdf.addMetadata(metadata);

  // Only show disclaimer/warnings for INTERNAL audience when not approved
  if (showWarnings) {
    // Disclaimer (warning box) - AI warning
    pdf.addAiWarning();
    pdf.addParagraph(model.disclaimer);
    pdf.addSeparator();
  }

  // Render sections with improved formatting
  model.sections.forEach((section, index) => {
    renderSectionToPdf(pdf, section, index === 0);
  });

  // Set custom footer based on audience
  if (isClientExport && issuer) {
    // Professional footer for client exports - NO AI/OVIS language
    renderClientFooter(pdf, issuer, displayRecordId, displayTimestamp);
  } else {
    // Internal footer with warnings if applicable
    renderInternalFooter(pdf, model, displayRecordId, displayTimestamp, showWarnings);
  }

  return pdf;
}

/**
 * Render business identity header for client-facing PDFs
 * NO AI/OVIS warnings - professional business header only
 */
function renderBusinessHeader(pdf: PdfDocument, issuer: IssuerProfile): void {
  const doc = pdf.getDoc();
  const pageWidth = doc.internal.pageSize.width;
  const marginLeft = PDF_CONFIG.marginLeft;
  const marginRight = PDF_CONFIG.marginRight;
  const maxWidth = pageWidth - marginLeft - marginRight;

  // Header background (subtle)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Bottom border
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(0, 45, pageWidth, 45);

  let yPos = 12;

  // Business legal name (large)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(issuer.legalName || "Business Name", marginLeft, yPos);
  yPos += 6;

  // Trading name (if different)
  if (issuer.tradingName && issuer.tradingName !== issuer.legalName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Trading as: ${issuer.tradingName}`, marginLeft, yPos);
    yPos += 4;
  }

  // ABN (formatted)
  if (issuer.abn) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`ABN: ${formatABN(issuer.abn)}`, marginLeft, yPos);
    yPos += 4;
  }

  // Contact info on right side
  let rightY = 12;
  const rightX = pageWidth - marginRight;

  // Phone
  if (issuer.phone) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(issuer.phone, rightX, rightY, { align: "right" });
    rightY += 4;
  }

  // Email
  if (issuer.email) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(issuer.email, rightX, rightY, { align: "right" });
    rightY += 4;
  }

  // Address
  const fullAddress = formatBusinessAddress(issuer);
  if (fullAddress) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    const addressLines = doc.splitTextToSize(fullAddress, maxWidth / 2);
    addressLines.forEach((line: string) => {
      doc.text(line, rightX, rightY, { align: "right" });
      rightY += 3.5;
    });
  }

  // Set Y position after header
  pdf.setY(55);
}

/**
 * Render professional footer for client-facing PDFs
 * NO AI/OVIS disclaimers - just professional issuer info
 */
function renderClientFooter(
  pdf: PdfDocument, 
  issuer: IssuerProfile,
  recordId: string,
  timestamp: string
): void {
  const doc = pdf.getDoc();
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(PDF_CONFIG.marginLeft, pageHeight - 18, pageWidth - PDF_CONFIG.marginRight, pageHeight - 18);

    // Issued by line
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Issued by ${issuer.legalName}`,
      pageWidth / 2,
      pageHeight - 13,
      { align: "center" }
    );
    
    // Document ID and page number
    doc.text(
      `Document ID: ${recordId} | ${timestamp} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 9,
      { align: "center" }
    );
  }
}

/**
 * Render footer for internal/draft PDFs
 * Includes AI/OVIS warnings when appropriate
 */
function renderInternalFooter(
  pdf: PdfDocument,
  model: RenderModel,
  recordId: string,
  timestamp: string,
  showWarnings: boolean
): void {
  const doc = pdf.getDoc();
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); // slate-500
    
    // Only show disclaimer if warnings are enabled
    if (showWarnings) {
      // OVIS line
      doc.text(
        "OVIS Checked Output - OMNEXORA Checked Intelligence Systems",
        pageWidth / 2,
        pageHeight - 20,
        { align: "center" }
      );
      
      // Disclaimer line
      doc.text(
        "Draft generated from user inputs. Review required. Not certified or verified.",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );
    }
    
    // Record ID and timestamp
    doc.text(
      `Record ID: ${recordId} | Generated: ${timestamp} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
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

