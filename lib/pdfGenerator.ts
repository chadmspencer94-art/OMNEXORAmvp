/**
 * Professional PDF Generator Utility for OMNEXORA
 * 
 * This module provides a robust, well-formatted PDF generation system
 * with proper text handling, spacing, and page management.
 */

import { jsPDF } from "jspdf";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PDF_CONFIG = {
  // Page dimensions (A4)
  pageWidth: 210,
  pageHeight: 297,
  
  // Margins
  marginTop: 25,
  marginBottom: 30,
  marginLeft: 20,
  marginRight: 20,
  
  // Typography
  fonts: {
    title: { size: 20, weight: "bold" as const },
    heading1: { size: 14, weight: "bold" as const },
    heading2: { size: 12, weight: "bold" as const },
    body: { size: 10, weight: "normal" as const },
    small: { size: 9, weight: "normal" as const },
    tiny: { size: 8, weight: "normal" as const },
  },
  
  // Spacing
  lineHeight: 1.4,
  paragraphSpacing: 6,
  sectionSpacing: 12,
  
  // Colors (RGB)
  colors: {
    primary: [245, 158, 11] as [number, number, number],      // amber-500
    primaryDark: [217, 119, 6] as [number, number, number],   // amber-600
    text: [15, 23, 42] as [number, number, number],           // slate-900
    textMuted: [100, 116, 139] as [number, number, number],   // slate-500
    textLight: [148, 163, 184] as [number, number, number],   // slate-400
    success: [22, 163, 74] as [number, number, number],       // green-600
    error: [220, 38, 38] as [number, number, number],         // red-600
    warning: [146, 64, 14] as [number, number, number],       // amber-900
    warningBg: [254, 243, 199] as [number, number, number],   // amber-50
    warningBorder: [251, 191, 36] as [number, number, number], // amber-400
    border: [226, 232, 240] as [number, number, number],      // slate-200
    bgLight: [241, 245, 249] as [number, number, number],     // slate-100
    white: [255, 255, 255] as [number, number, number],
  },
};

// ============================================================================
// PDF DOCUMENT CLASS
// ============================================================================

export class PdfDocument {
  private doc: jsPDF;
  private y: number;
  private pageNumber: number;
  private config: typeof PDF_CONFIG;
  private maxWidth: number;
  private footerCallback?: (doc: jsPDF, pageNum: number, totalPages: number) => void;

  constructor(options?: { orientation?: "portrait" | "landscape" }) {
    this.doc = new jsPDF({
      orientation: options?.orientation || "portrait",
      unit: "mm",
      format: "a4",
    });
    this.config = PDF_CONFIG;
    this.y = this.config.marginTop;
    this.pageNumber = 1;
    this.maxWidth = this.config.pageWidth - this.config.marginLeft - this.config.marginRight;
  }

  // -------------------------------------------------------------------------
  // Page Management
  // -------------------------------------------------------------------------

  /**
   * Check if there's enough space for content, add new page if needed
   */
  checkNewPage(requiredSpace: number = 20): boolean {
    const availableSpace = this.config.pageHeight - this.config.marginBottom - this.y;
    if (availableSpace < requiredSpace) {
      this.addPage();
      return true;
    }
    return false;
  }

  /**
   * Add a new page
   */
  addPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.y = this.config.marginTop;
  }

  /**
   * Get current Y position
   */
  getY(): number {
    return this.y;
  }

  /**
   * Set Y position
   */
  setY(y: number): void {
    this.y = y;
  }

  /**
   * Add vertical spacing
   */
  addSpace(mm: number): void {
    this.y += mm;
  }

  // -------------------------------------------------------------------------
  // Text Rendering
  // -------------------------------------------------------------------------

  /**
   * Clean text to prevent encoding issues
   */
  private cleanText(text: string): string {
    if (!text) return "";
    
    return text
      // Remove any weird Unicode artifacts
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      // Remove markdown-style formatting artifacts
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s*/g, "")
      // Convert common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      // Fix common encoding issues
      .replace(/â€"/g, "—")
      .replace(/â€˜/g, "'")
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .trim();
  }

  /**
   * Add text with automatic wrapping and page breaks
   */
  addText(
    text: string,
    options?: {
      fontSize?: number;
      fontWeight?: "normal" | "bold";
      color?: [number, number, number];
      align?: "left" | "center" | "right";
      maxWidth?: number;
      indent?: number;
    }
  ): void {
    const {
      fontSize = this.config.fonts.body.size,
      fontWeight = "normal",
      color = this.config.colors.text,
      align = "left",
      maxWidth = this.maxWidth,
      indent = 0,
    } = options || {};

    const cleanedText = this.cleanText(text);
    if (!cleanedText) return;

    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", fontWeight);
    this.doc.setTextColor(...color);

    const effectiveWidth = maxWidth - indent;
    const lines = this.doc.splitTextToSize(cleanedText, effectiveWidth);
    const lineHeight = fontSize * 0.4;

    for (const line of lines) {
      this.checkNewPage(lineHeight + 2);
      
      let xPos = this.config.marginLeft + indent;
      if (align === "center") {
        xPos = this.config.pageWidth / 2;
      } else if (align === "right") {
        xPos = this.config.pageWidth - this.config.marginRight;
      }

      this.doc.text(line, xPos, this.y, { align });
      this.y += lineHeight;
    }
  }

  /**
   * Add a title (large, bold text)
   */
  addTitle(text: string, options?: { color?: [number, number, number] }): void {
    this.addText(text, {
      fontSize: this.config.fonts.title.size,
      fontWeight: "bold",
      color: options?.color || this.config.colors.text,
    });
    this.addSpace(this.config.paragraphSpacing);
  }

  /**
   * Add a section heading with underline
   */
  addSectionHeading(text: string): void {
    this.checkNewPage(20);
    this.addSpace(this.config.sectionSpacing);
    
    // Heading text
    this.doc.setFontSize(this.config.fonts.heading1.size);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.config.colors.text);
    this.doc.text(this.cleanText(text).toUpperCase(), this.config.marginLeft, this.y);
    this.y += 6;

    // Underline
    this.doc.setDrawColor(...this.config.colors.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.config.marginLeft,
      this.y,
      this.config.pageWidth - this.config.marginRight,
      this.y
    );
    this.y += 6;
  }

  /**
   * Add a subsection heading
   */
  addSubheading(text: string): void {
    this.checkNewPage(15);
    this.addSpace(this.config.paragraphSpacing);
    this.addText(text, {
      fontSize: this.config.fonts.heading2.size,
      fontWeight: "bold",
    });
    this.addSpace(2);
  }

  /**
   * Add a paragraph of body text
   */
  addParagraph(text: string): void {
    this.addText(text, {
      fontSize: this.config.fonts.body.size,
      fontWeight: "normal",
    });
    this.addSpace(this.config.paragraphSpacing);
  }

  /**
   * Add a bullet list
   */
  addBulletList(items: string[], options?: { bulletColor?: [number, number, number] }): void {
    const bulletColor = options?.bulletColor || this.config.colors.text;
    const bulletIndent = 8;

    for (const item of items) {
      const cleanItem = this.cleanText(item);
      if (!cleanItem) continue;

      this.checkNewPage(10);
      
      // Bullet point
      this.doc.setTextColor(...bulletColor);
      this.doc.setFontSize(this.config.fonts.body.size);
      this.doc.text("•", this.config.marginLeft, this.y);
      
      // Item text
      this.doc.setTextColor(...this.config.colors.text);
      const lines = this.doc.splitTextToSize(cleanItem, this.maxWidth - bulletIndent);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) this.checkNewPage(5);
        this.doc.text(lines[i], this.config.marginLeft + bulletIndent, this.y);
        this.y += this.config.fonts.body.size * 0.4;
      }
      this.y += 2;
    }
    this.addSpace(this.config.paragraphSpacing);
  }

  /**
   * Add a numbered list
   */
  addNumberedList(items: string[]): void {
    const numberIndent = 10;

    for (let i = 0; i < items.length; i++) {
      const cleanItem = this.cleanText(items[i]);
      if (!cleanItem) continue;

      this.checkNewPage(10);
      
      // Number
      this.doc.setFontSize(this.config.fonts.body.size);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...this.config.colors.text);
      this.doc.text(`${i + 1}.`, this.config.marginLeft, this.y);
      
      // Item text
      this.doc.setFont("helvetica", "normal");
      const lines = this.doc.splitTextToSize(cleanItem, this.maxWidth - numberIndent);
      for (let j = 0; j < lines.length; j++) {
        if (j > 0) this.checkNewPage(5);
        this.doc.text(lines[j], this.config.marginLeft + numberIndent, this.y);
        this.y += this.config.fonts.body.size * 0.4;
      }
      this.y += 3;
    }
    this.addSpace(this.config.paragraphSpacing);
  }

  /**
   * Add inclusions list (with green checkmarks)
   * R2: Uses PDF-safe drawn shapes instead of Unicode symbols
   */
  addInclusionsList(items: string[]): void {
    for (const item of items) {
      const cleanItem = this.cleanText(item);
      if (!cleanItem) continue;

      this.checkNewPage(10);
      
      // R2: Draw a filled green circle as PDF-safe checkmark indicator
      // This avoids font dependency issues with Unicode symbols
      const symbolX = this.config.marginLeft + 2;
      const symbolY = this.y - 1.5;
      this.doc.setFillColor(...this.config.colors.success);
      this.doc.circle(symbolX, symbolY, 1.5, "F");
      
      // Item text
      this.doc.setTextColor(...this.config.colors.text);
      this.doc.setFontSize(this.config.fonts.body.size);
      const lines = this.doc.splitTextToSize(cleanItem, this.maxWidth - 10);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) this.checkNewPage(5);
        this.doc.text(lines[i], this.config.marginLeft + 10, this.y);
        this.y += this.config.fonts.body.size * 0.4;
      }
      this.y += 2;
    }
    this.addSpace(this.config.paragraphSpacing);
  }

  /**
   * Add exclusions list (with red X marks)
   * R2: Uses PDF-safe drawn shapes instead of Unicode symbols
   */
  addExclusionsList(items: string[]): void {
    for (const item of items) {
      const cleanItem = this.cleanText(item);
      if (!cleanItem) continue;

      this.checkNewPage(10);
      
      // R2: Draw a red X shape as PDF-safe exclusion indicator
      // This avoids font dependency issues with Unicode symbols
      const symbolX = this.config.marginLeft + 2;
      const symbolY = this.y - 1.5;
      this.doc.setDrawColor(...this.config.colors.error);
      this.doc.setLineWidth(0.5);
      // Draw X shape
      this.doc.line(symbolX - 1.5, symbolY - 1.5, symbolX + 1.5, symbolY + 1.5);
      this.doc.line(symbolX - 1.5, symbolY + 1.5, symbolX + 1.5, symbolY - 1.5);
      
      // Item text
      this.doc.setTextColor(...this.config.colors.text);
      this.doc.setFontSize(this.config.fonts.body.size);
      const lines = this.doc.splitTextToSize(cleanItem, this.maxWidth - 10);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) this.checkNewPage(5);
        this.doc.text(lines[i], this.config.marginLeft + 10, this.y);
        this.y += this.config.fonts.body.size * 0.4;
      }
      this.y += 2;
    }
    this.addSpace(this.config.paragraphSpacing);
  }

  // -------------------------------------------------------------------------
  // Special Elements
  // -------------------------------------------------------------------------

  /**
   * Add branded header with OMNEXORA logo
   */
  addBrandedHeader(subtitle?: string): void {
    // Amber banner
    this.doc.setFillColor(...this.config.colors.primary);
    this.doc.rect(0, 0, this.config.pageWidth, 35, "F");

    // Logo text
    this.doc.setFontSize(22);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.config.colors.white);
    this.doc.text("OMNEXORA", this.config.marginLeft, 18);

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(subtitle, this.config.marginLeft, 26);
    }

    this.y = 50;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add business identity header for professional documents
   * Shows business name, trading name, ABN, contact details
   */
  addBusinessHeader(issuer: {
    legalName?: string;
    tradingName?: string;
    abn?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  }): void {
    // Header background (subtle)
    this.doc.setFillColor(248, 250, 252); // slate-50
    this.doc.rect(0, 0, this.config.pageWidth, 45, "F");
    
    // Bottom border
    this.doc.setDrawColor(226, 232, 240); // slate-200
    this.doc.setLineWidth(0.5);
    this.doc.line(0, 45, this.config.pageWidth, 45);

    let yPos = 12;

    // Business legal name (large)
    if (issuer.legalName) {
      this.doc.setFontSize(16);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(15, 23, 42); // slate-900
      this.doc.text(issuer.legalName, this.config.marginLeft, yPos);
      yPos += 6;
    }

    // Trading name (if different)
    if (issuer.tradingName && issuer.tradingName !== issuer.legalName) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(71, 85, 105); // slate-600
      this.doc.text(`Trading as: ${issuer.tradingName}`, this.config.marginLeft, yPos);
      yPos += 4;
    }

    // ABN (formatted)
    if (issuer.abn) {
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 116, 139); // slate-500
      // Format ABN: XX XXX XXX XXX
      const abnClean = issuer.abn.replace(/\s/g, "");
      const abnFormatted = abnClean.length === 11 
        ? `${abnClean.slice(0, 2)} ${abnClean.slice(2, 5)} ${abnClean.slice(5, 8)} ${abnClean.slice(8, 11)}`
        : issuer.abn;
      this.doc.text(`ABN: ${abnFormatted}`, this.config.marginLeft, yPos);
      yPos += 4;
    }

    // Contact info on right side
    let rightY = 12;
    const rightX = this.config.pageWidth - this.config.marginRight;

    // Phone
    if (issuer.phone) {
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(71, 85, 105); // slate-600
      this.doc.text(issuer.phone, rightX, rightY, { align: "right" });
      rightY += 4;
    }

    // Email
    if (issuer.email) {
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(71, 85, 105); // slate-600
      this.doc.text(issuer.email, rightX, rightY, { align: "right" });
      rightY += 4;
    }

    // Address
    const addressParts: string[] = [];
    if (issuer.addressLine1) addressParts.push(issuer.addressLine1);
    if (issuer.addressLine2) addressParts.push(issuer.addressLine2);
    const locality: string[] = [];
    if (issuer.suburb) locality.push(issuer.suburb);
    if (issuer.state) locality.push(issuer.state);
    if (issuer.postcode) locality.push(issuer.postcode);
    if (locality.length > 0) addressParts.push(locality.join(" "));
    
    if (addressParts.length > 0) {
      const fullAddress = addressParts.join(", ");
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 116, 139); // slate-500
      const addressLines = this.doc.splitTextToSize(fullAddress, this.maxWidth / 2);
      addressLines.forEach((line: string) => {
        this.doc.text(line, rightX, rightY, { align: "right" });
        rightY += 3.5;
      });
    }

    // Set Y position after header
    this.y = 55;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add professional footer for issued documents (no AI warnings)
   */
  addIssuedFooter(issuerName: string, documentId?: string): void {
    const totalPages = this.doc.getNumberOfPages();
    const timestamp = new Date().toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(226, 232, 240); // slate-200
      this.doc.setLineWidth(0.3);
      this.doc.line(this.config.marginLeft, this.config.pageHeight - 18, this.config.pageWidth - this.config.marginRight, this.config.pageHeight - 18);

      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100, 116, 139); // slate-500
      
      // Issued by line
      this.doc.text(
        `Issued by ${issuerName}`,
        this.config.pageWidth / 2,
        this.config.pageHeight - 13,
        { align: "center" }
      );
      
      // Document ID and page number
      let footerText = timestamp;
      if (documentId) {
        footerText = `Document: ${documentId} | ${timestamp}`;
      }
      footerText += ` | Page ${i} of ${totalPages}`;
      
      this.doc.text(
        footerText,
        this.config.pageWidth / 2,
        this.config.pageHeight - 9,
        { align: "center" }
      );
    }
  }

  /**
   * Add AI content warning box
   */
  addAiWarning(): void {
    this.checkNewPage(35);
    
    const boxHeight = 28;
    const boxY = this.y - 2;

    // Warning box background
    this.doc.setFillColor(...this.config.colors.warningBg);
    this.doc.rect(this.config.marginLeft, boxY, this.maxWidth, boxHeight, "F");
    
    // Warning box border
    this.doc.setDrawColor(...this.config.colors.warningBorder);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.config.marginLeft, boxY, this.maxWidth, boxHeight);

    // Warning title
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.config.colors.warning);
    this.doc.text("AI-GENERATED CONTENT WARNING", this.config.marginLeft + 4, this.y + 4);

    // Warning text
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(120, 53, 15);
    const warningText = "This document contains AI-generated content that must be reviewed before use. You are responsible for ensuring compliance with all applicable Australian laws and regulations.";
    const warningLines = this.doc.splitTextToSize(warningText, this.maxWidth - 8);
    let warningY = this.y + 10;
    for (const line of warningLines) {
      this.doc.text(line, this.config.marginLeft + 4, warningY);
      warningY += 4;
    }

    this.y = boxY + boxHeight + 10;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add a highlighted box (for totals, key info, etc.)
   */
  addHighlightBox(content: { label: string; value: string }, options?: { bgColor?: [number, number, number] }): void {
    this.checkNewPage(25);
    
    const boxHeight = 20;
    const bgColor = options?.bgColor || this.config.colors.warningBg;

    this.doc.setFillColor(...bgColor);
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, boxHeight, "F");

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...this.config.colors.text);
    this.doc.text(content.label, this.config.marginLeft + 4, this.y + 6);

    this.doc.setFontSize(14);
    this.doc.text(content.value, this.config.marginLeft + 4, this.y + 14);

    this.y += boxHeight + 8;
  }

  /**
   * Add a simple table with improved formatting for Australian standards
   */
  addTable(headers: string[], rows: string[][], options?: { colWidths?: number[] }): void {
    const colWidths = options?.colWidths || headers.map(() => this.maxWidth / headers.length);
    const rowHeight = 9; // Slightly increased for better readability
    const cellPadding = 3; // Increased padding
    const headerHeight = rowHeight + 2;

    // Header row with better styling
    this.checkNewPage(headerHeight + 10);
    const headerY = this.y;
    
    // Header background
    this.doc.setFillColor(245, 158, 11); // amber-500
    this.doc.rect(this.config.marginLeft, headerY - 2, this.maxWidth, headerHeight, "F");
    
    // Header border
    this.doc.setDrawColor(217, 119, 6); // amber-600
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.config.marginLeft, headerY - 2, this.maxWidth, headerHeight, "S");
    
    this.doc.setFontSize(this.config.fonts.small.size);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255); // white text on amber background
    
    let xPos = this.config.marginLeft + cellPadding;
    for (let i = 0; i < headers.length; i++) {
      const headerText = this.cleanText(headers[i]);
      // Allow text wrapping in headers if needed
      const lines = this.doc.splitTextToSize(headerText, colWidths[i] - (cellPadding * 2));
      lines.forEach((line: string, lineIndex: number) => {
        this.doc.text(line, xPos, headerY + (lineIndex * 4) + 4);
      });
      xPos += colWidths[i];
    }
    this.y = headerY + headerHeight;

    // Data rows with alternating colors and borders
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...this.config.colors.text);
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const isEvenRow = rowIndex % 2 === 0;
      
      this.checkNewPage(rowHeight);
      
      // Alternating row background for better readability
      if (isEvenRow) {
        this.doc.setFillColor(248, 250, 252); // slate-50
        this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, rowHeight, "F");
      }
      
      // Row border
      this.doc.setDrawColor(226, 232, 240); // slate-200
      this.doc.setLineWidth(0.3);
      this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, rowHeight, "S");
      
      xPos = this.config.marginLeft + cellPadding;
      for (let i = 0; i < row.length; i++) {
        const cellText = this.cleanText(row[i] || "");
        // Allow text wrapping in cells
        const lines = this.doc.splitTextToSize(cellText, colWidths[i] - (cellPadding * 2));
        const cellHeight = Math.max(rowHeight, lines.length * 4 + 2);
        
        lines.forEach((line: string, lineIndex: number) => {
          this.doc.text(line, xPos, this.y + (lineIndex * 4) + 3);
        });
        xPos += colWidths[i];
      }
      this.y += rowHeight;
    }
    
    // Bottom border
    this.doc.setDrawColor(203, 213, 225); // slate-300
    this.doc.setLineWidth(0.5);
    this.doc.line(this.config.marginLeft, this.y - 2, this.config.marginLeft + this.maxWidth, this.y - 2);
    
    this.addSpace(this.config.paragraphSpacing);
  }

  /**
   * Add horizontal line separator
   */
  addSeparator(): void {
    this.checkNewPage(5);
    this.doc.setDrawColor(...this.config.colors.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(
      this.config.marginLeft,
      this.y,
      this.config.pageWidth - this.config.marginRight,
      this.y
    );
    this.y += 5;
  }

  /**
   * Add metadata row (label: value format)
   */
  addMetadata(items: Array<{ label: string; value: string }>): void {
    this.doc.setFontSize(this.config.fonts.small.size);
    this.doc.setTextColor(...this.config.colors.textMuted);
    
    for (const item of items) {
      if (!item.value) continue;
      this.checkNewPage(6);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`${item.label}: ${this.cleanText(item.value)}`, this.config.marginLeft, this.y);
      this.y += 5;
    }
    this.addSpace(this.config.paragraphSpacing);
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add image (with error handling)
   */
  addImage(dataUrl: string, options?: { width?: number; height?: number }): boolean {
    if (!dataUrl) return false;
    
    try {
      this.checkNewPage(options?.height || 40);
      
      const width = options?.width || 80;
      const height = options?.height || 30;
      
      this.doc.addImage(
        dataUrl,
        "PNG",
        this.config.marginLeft,
        this.y,
        width,
        height
      );
      
      this.y += height + 8;
      return true;
    } catch (error) {
      console.warn("Failed to add image to PDF:", error);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Footer Management
  // -------------------------------------------------------------------------

  /**
   * Set footer callback for all pages
   */
  setFooter(callback: (doc: jsPDF, pageNum: number, totalPages: number) => void): void {
    this.footerCallback = callback;
  }

  /**
   * Add standard OMNEXORA footer to all pages
   */
  addStandardFooters(options?: { jobId?: string }): void {
    const totalPages = this.doc.getNumberOfPages();
    const timestamp = new Date().toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...this.config.colors.textLight);
      
      // OVIS line
      this.doc.text(
        "OVIS Checked Output - OMNEXORA Checked Intelligence Systems",
        this.config.pageWidth / 2,
        this.config.pageHeight - 20,
        { align: "center" }
      );
      
      // Footer line
      let footerText = `Generated by OMNEXORA  |  ${timestamp}`;
      if (options?.jobId) {
        footerText += `  |  Job ${options.jobId.slice(0, 8)}`;
      }
      footerText += `  |  Page ${i} of ${totalPages}`;
      
      this.doc.text(
        footerText,
        this.config.pageWidth / 2,
        this.config.pageHeight - 10,
        { align: "center" }
      );
    }
  }

  // -------------------------------------------------------------------------
  // Document Output
  // -------------------------------------------------------------------------

  /**
   * Get the jsPDF instance for advanced operations
   */
  getDoc(): jsPDF {
    return this.doc;
  }

  /**
   * Save the PDF with the given filename
   */
  save(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get PDF as blob
   */
  getBlob(): Blob {
    return this.doc.output("blob");
  }

  /**
   * Get PDF as base64 string
   */
  getBase64(): string {
    return this.doc.output("datauristring");
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse structured text content into sections
 */
export function parseStructuredContent(content: string): Array<{ type: "heading" | "text" | "list"; content: string }> {
  const sections: Array<{ type: "heading" | "text" | "list"; content: string }> = [];
  
  if (!content) return sections;

  const lines = content.split("\n");
  let currentText = "";
  let currentList: string[] = [];

  const flushText = () => {
    if (currentText.trim()) {
      sections.push({ type: "text", content: currentText.trim() });
      currentText = "";
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({ type: "list", content: currentList.join("\n") });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      if (currentText) currentText += " ";
      continue;
    }

    // Check for headings (## or ** at start)
    if (trimmed.match(/^#{1,6}\s/) || trimmed.match(/^\*\*[^*]+\*\*$/)) {
      flushText();
      flushList();
      sections.push({
        type: "heading",
        content: trimmed.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, ""),
      });
      continue;
    }

    // Check for numbered headings (1. **Title**)
    if (trimmed.match(/^\d+\.\s+\*\*/)) {
      flushText();
      flushList();
      sections.push({
        type: "heading",
        content: trimmed.replace(/^\d+\.\s+\*\*/, "").replace(/\*\*$/, ""),
      });
      continue;
    }

    // Check for bullet points
    if (trimmed.match(/^[-•*]\s/)) {
      flushText();
      currentList.push(trimmed.replace(/^[-•*]\s+/, ""));
      continue;
    }

    // Check for numbered list items
    if (trimmed.match(/^\d+\.\s/) && !trimmed.match(/^\d+\.\s+\*\*/)) {
      flushText();
      currentList.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    // Regular text
    flushList();
    currentText += (currentText ? " " : "") + trimmed;
  }

  flushText();
  flushList();

  return sections;
}

/**
 * Format currency for Australian locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

/**
 * Format date for Australian locale
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format datetime for Australian locale
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
