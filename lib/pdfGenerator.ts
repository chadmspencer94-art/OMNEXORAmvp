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
    navy: [30, 41, 59] as [number, number, number],           // slate-800 (premium)
    gold: [202, 138, 4] as [number, number, number],          // yellow-600 (accent)
  },
};

// ============================================================================
// AUSTRALIAN STATE COMPLIANCE REFERENCES
// ============================================================================

export const AU_STATE_COMPLIANCE = {
  WA: {
    state: "Western Australia",
    authority: "WorkSafe WA",
    legislation: "Work Health and Safety Act 2020 (WA)",
    regulations: "Work Health and Safety (General) Regulations 2022",
    notes: "WA transitioned to harmonised WHS laws on 31 March 2022.",
  },
  NSW: {
    state: "New South Wales",
    authority: "SafeWork NSW",
    legislation: "Work Health and Safety Act 2011 (NSW)",
    regulations: "Work Health and Safety Regulation 2017",
    notes: "NSW operates under the model WHS framework.",
  },
  VIC: {
    state: "Victoria",
    authority: "WorkSafe Victoria",
    legislation: "Occupational Health and Safety Act 2004 (Vic)",
    regulations: "Occupational Health and Safety Regulations 2017",
    notes: "Victoria has not adopted the model WHS laws.",
  },
  QLD: {
    state: "Queensland",
    authority: "Workplace Health and Safety Queensland",
    legislation: "Work Health and Safety Act 2011 (Qld)",
    regulations: "Work Health and Safety Regulation 2011",
    notes: "QLD operates under the model WHS framework.",
  },
  SA: {
    state: "South Australia",
    authority: "SafeWork SA",
    legislation: "Work Health and Safety Act 2012 (SA)",
    regulations: "Work Health and Safety Regulations 2012",
    notes: "SA operates under the model WHS framework.",
  },
  TAS: {
    state: "Tasmania",
    authority: "WorkSafe Tasmania",
    legislation: "Work Health and Safety Act 2012 (Tas)",
    regulations: "Work Health and Safety Regulations 2012",
    notes: "TAS operates under the model WHS framework.",
  },
  NT: {
    state: "Northern Territory",
    authority: "NT WorkSafe",
    legislation: "Work Health and Safety (National Uniform Legislation) Act 2011",
    regulations: "Work Health and Safety (National Uniform Legislation) Regulations 2011",
    notes: "NT operates under the model WHS framework.",
  },
  ACT: {
    state: "Australian Capital Territory",
    authority: "WorkSafe ACT",
    legislation: "Work Health and Safety Act 2011 (ACT)",
    regulations: "Work Health and Safety Regulation 2011",
    notes: "ACT operates under the model WHS framework.",
  },
} as const;

export type AustralianState = keyof typeof AU_STATE_COMPLIANCE;

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
   * R5: Add client-ready baseline identifiers to export
   * Includes Document Type, Document ID, Job ID, Generated time, Revision
   */
  addExportIdentifiers(identifiers: {
    documentType: string;
    documentId: string;
    jobId: string;
    generatedAt?: string;
    revision?: number;
    contractorName?: string;
  }): void {
    this.checkNewPage(30);

    // Light gray background box for identifiers
    this.doc.setFillColor(248, 250, 252); // slate-50
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, 24, "F");
    this.doc.setDrawColor(226, 232, 240); // slate-200
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, 24, "S");

    // Format generated timestamp
    const generatedTime = identifiers.generatedAt
      ? new Date(identifiers.generatedAt).toLocaleString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    // Left column
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 116, 139); // slate-500
    this.doc.text(`Document: ${identifiers.documentType}`, this.config.marginLeft + 4, this.y + 4);
    this.doc.text(`ID: ${identifiers.documentId}`, this.config.marginLeft + 4, this.y + 10);
    this.doc.text(`Job Ref: ${identifiers.jobId}`, this.config.marginLeft + 4, this.y + 16);

    // Right column
    const rightX = this.config.pageWidth - this.config.marginRight - 4;
    this.doc.text(`Generated: ${generatedTime}`, rightX, this.y + 4, { align: "right" });
    this.doc.text(`Revision: ${identifiers.revision || 1}`, rightX, this.y + 10, { align: "right" });
    if (identifiers.contractorName) {
      this.doc.text(`Issued by: ${identifiers.contractorName}`, rightX, this.y + 16, { align: "right" });
    }

    this.y += 30;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * R11: Add jurisdiction label with safe note (no compliance claims)
   * Uses user's businessState or defaults to Western Australia
   */
  addJurisdictionLabel(jurisdiction?: string): void {
    this.checkNewPage(20);

    // Use provided jurisdiction or default to Western Australia
    const jurisdictionLabel = jurisdiction || "Western Australia";
    
    // Light blue background for jurisdiction
    this.doc.setFillColor(239, 246, 255); // blue-50
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, 16, "F");
    this.doc.setDrawColor(191, 219, 254); // blue-200
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, 16, "S");

    // Jurisdiction label
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 64, 175); // blue-800
    this.doc.text(`Jurisdiction: ${jurisdictionLabel}`, this.config.marginLeft + 4, this.y + 4);

    // Safe note (no compliance claims per LEGAL / REGULATORY SAFETY requirements)
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(7);
    this.doc.setTextColor(59, 130, 246); // blue-500
    this.doc.text(
      "This document supports alignment with industry standards; professional review required.",
      this.config.marginLeft + 4,
      this.y + 10
    );

    this.y += 22;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Premium document header with professional styling
   * Combines business identity with document type and reference
   */
  addPremiumDocumentHeader(options: {
    documentType: string;
    documentNumber?: string;
    documentDate?: string;
    issuer?: {
      legalName?: string;
      tradingName?: string;
      abn?: string;
      email?: string;
      phone?: string;
      addressLine1?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
      licenseNumber?: string;
    };
    recipient?: {
      name?: string;
      address?: string;
      email?: string;
    };
    jobReference?: string;
    projectName?: string;
    projectAddress?: string;
  }): void {
    const { documentType, documentNumber, documentDate, issuer, recipient, jobReference, projectName, projectAddress } = options;
    
    // Premium header background - navy gradient effect
    this.doc.setFillColor(30, 41, 59); // slate-800
    this.doc.rect(0, 0, this.config.pageWidth, 50, "F");
    
    // Gold accent line
    this.doc.setFillColor(202, 138, 4); // yellow-600
    this.doc.rect(0, 50, this.config.pageWidth, 2, "F");

    let yPos = 14;

    // Business name (large, white)
    if (issuer?.legalName) {
      this.doc.setFontSize(18);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(issuer.legalName.toUpperCase(), this.config.marginLeft, yPos);
      yPos += 6;

      // Trading name if different
      if (issuer.tradingName && issuer.tradingName !== issuer.legalName) {
        this.doc.setFontSize(9);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(148, 163, 184); // slate-400
        this.doc.text(`Trading as: ${issuer.tradingName}`, this.config.marginLeft, yPos);
        yPos += 4;
      }

      // ABN and License
      const credentialsLine: string[] = [];
      if (issuer.abn) {
        const abnClean = issuer.abn.replace(/\s/g, "");
        const abnFormatted = abnClean.length === 11 
          ? `ABN: ${abnClean.slice(0, 2)} ${abnClean.slice(2, 5)} ${abnClean.slice(5, 8)} ${abnClean.slice(8, 11)}`
          : `ABN: ${issuer.abn}`;
        credentialsLine.push(abnFormatted);
      }
      if (issuer.licenseNumber) {
        credentialsLine.push(`License: ${issuer.licenseNumber}`);
      }
      if (credentialsLine.length > 0) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(148, 163, 184); // slate-400
        this.doc.text(credentialsLine.join("  |  "), this.config.marginLeft, yPos);
      }
    } else {
      // Fallback: OMNEXORA branding
      this.doc.setFontSize(18);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text("OMNEXORA", this.config.marginLeft, yPos);
      yPos += 6;
      this.doc.setFontSize(9);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text("Construction Business Management", this.config.marginLeft, yPos);
    }

    // Document type and number on right side
    const rightX = this.config.pageWidth - this.config.marginRight;
    let rightY = 14;

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(202, 138, 4); // gold
    this.doc.text(documentType.toUpperCase(), rightX, rightY, { align: "right" });
    rightY += 6;

    if (documentNumber) {
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(`Ref: ${documentNumber}`, rightX, rightY, { align: "right" });
      rightY += 4;
    }

    if (documentDate) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text(`Date: ${documentDate}`, rightX, rightY, { align: "right" });
    }

    // Contact info below header
    this.y = 60;

    // Two-column layout for issuer contact and recipient
    if (issuer?.phone || issuer?.email || issuer?.addressLine1 || recipient?.name) {
      this.doc.setFillColor(248, 250, 252); // slate-50
      this.doc.rect(this.config.marginLeft, this.y - 4, this.maxWidth, 28, "F");
      this.doc.setDrawColor(226, 232, 240); // slate-200
      this.doc.setLineWidth(0.3);
      this.doc.rect(this.config.marginLeft, this.y - 4, this.maxWidth, 28, "S");

      // Issuer contact (left)
      let leftY = this.y;
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(100, 116, 139); // slate-500
      this.doc.text("FROM:", this.config.marginLeft + 4, leftY);
      leftY += 4;
      
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(15, 23, 42); // slate-900
      
      if (issuer?.phone) {
        this.doc.text(issuer.phone, this.config.marginLeft + 4, leftY);
        leftY += 4;
      }
      if (issuer?.email) {
        this.doc.text(issuer.email, this.config.marginLeft + 4, leftY);
        leftY += 4;
      }
      if (issuer?.addressLine1) {
        const addressParts = [issuer.addressLine1];
        if (issuer.suburb || issuer.state || issuer.postcode) {
          addressParts.push([issuer.suburb, issuer.state, issuer.postcode].filter(Boolean).join(" "));
        }
        this.doc.text(addressParts.join(", "), this.config.marginLeft + 4, leftY);
      }

      // Recipient (right column)
      if (recipient?.name) {
        const midX = this.config.marginLeft + this.maxWidth / 2 + 10;
        let recipientY = this.y;
        
        this.doc.setFontSize(7);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(100, 116, 139);
        this.doc.text("TO:", midX, recipientY);
        recipientY += 4;
        
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8);
        this.doc.setTextColor(15, 23, 42);
        this.doc.text(recipient.name, midX, recipientY);
        recipientY += 4;
        
        if (recipient.address) {
          const addressLines = this.doc.splitTextToSize(recipient.address, this.maxWidth / 2 - 14);
          addressLines.forEach((line: string) => {
            this.doc.text(line, midX, recipientY);
            recipientY += 4;
          });
        }
      }

      this.y += 32;
    }

    // Project details section if provided
    if (projectName || projectAddress || jobReference) {
      this.doc.setFillColor(254, 252, 232); // yellow-50
      this.doc.rect(this.config.marginLeft, this.y - 4, this.maxWidth, 18, "F");
      this.doc.setDrawColor(253, 224, 71); // yellow-300
      this.doc.setLineWidth(0.3);
      this.doc.rect(this.config.marginLeft, this.y - 4, this.maxWidth, 18, "S");

      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(146, 64, 14); // amber-800
      this.doc.text("PROJECT DETAILS", this.config.marginLeft + 4, this.y);
      
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(15, 23, 42);
      
      let projectY = this.y + 5;
      if (projectName) {
        this.doc.text(`Project: ${projectName}`, this.config.marginLeft + 4, projectY);
      }
      if (projectAddress) {
        this.doc.text(`Location: ${projectAddress}`, this.config.marginLeft + this.maxWidth / 2, projectY);
      }
      if (jobReference) {
        projectY += 4;
        this.doc.text(`Job Ref: ${jobReference}`, this.config.marginLeft + 4, projectY);
      }

      this.y += 22;
    }

    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add Australian state compliance reference box
   * Links to relevant state authority without making compliance claims
   */
  addAustralianComplianceReference(stateCode?: string): void {
    // Get state compliance info
    const state = (stateCode?.toUpperCase() || "WA") as AustralianState;
    const complianceInfo = AU_STATE_COMPLIANCE[state] || AU_STATE_COMPLIANCE.WA;

    this.checkNewPage(35);

    // Compliance reference box
    this.doc.setFillColor(240, 253, 244); // green-50
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, 28, "F");
    this.doc.setDrawColor(134, 239, 172); // green-300
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.config.marginLeft, this.y - 2, this.maxWidth, 28, "S");

    // Header
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(22, 101, 52); // green-800
    this.doc.text("AUSTRALIAN COMPLIANCE REFERENCE", this.config.marginLeft + 4, this.y + 3);

    // State info
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(21, 128, 61); // green-700
    this.doc.text(`Jurisdiction: ${complianceInfo.state}  |  Authority: ${complianceInfo.authority}`, this.config.marginLeft + 4, this.y + 9);
    this.doc.text(`Legislation: ${complianceInfo.legislation}`, this.config.marginLeft + 4, this.y + 14);

    // Disclaimer
    this.doc.setFontSize(6);
    this.doc.setTextColor(74, 222, 128); // green-400
    this.doc.text(
      "This document is formatted for Australian industry standards. Professional review and verification required. No compliance claims are made.",
      this.config.marginLeft + 4,
      this.y + 21
    );

    this.y += 34;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add a professional summary totals box
   * Used for invoices, quotes, and variations
   */
  addPremiumTotalsBox(items: {
    subtotal?: number;
    gst?: number;
    total: number;
    currency?: string;
    additionalLines?: Array<{ label: string; value: string | number; bold?: boolean }>;
  }): void {
    this.checkNewPage(50);

    const { subtotal, gst, total, currency = "AUD", additionalLines } = items;
    const boxWidth = 80;
    const boxX = this.config.pageWidth - this.config.marginRight - boxWidth;
    let boxHeight = 30;
    
    // Calculate height based on content
    if (subtotal !== undefined) boxHeight += 8;
    if (gst !== undefined) boxHeight += 8;
    if (additionalLines) boxHeight += additionalLines.length * 8;

    // Background
    this.doc.setFillColor(30, 41, 59); // slate-800
    this.doc.rect(boxX, this.y - 2, boxWidth, boxHeight, "F");
    
    // Gold accent
    this.doc.setFillColor(202, 138, 4); // yellow-600
    this.doc.rect(boxX, this.y - 2, 3, boxHeight, "F");

    let lineY = this.y + 5;
    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);

    // Additional lines first
    if (additionalLines) {
      for (const line of additionalLines) {
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", line.bold ? "bold" : "normal");
        this.doc.setTextColor(148, 163, 184); // slate-400
        this.doc.text(line.label, boxX + 8, lineY);
        this.doc.text(
          typeof line.value === "number" ? formatCurrency(line.value) : line.value,
          boxX + boxWidth - 6,
          lineY,
          { align: "right" }
        );
        lineY += 8;
      }
    }

    // Subtotal
    if (subtotal !== undefined) {
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(148, 163, 184);
      this.doc.text("Subtotal (ex GST)", boxX + 8, lineY);
      this.doc.text(formatCurrency(subtotal), boxX + boxWidth - 6, lineY, { align: "right" });
      lineY += 8;
    }

    // GST
    if (gst !== undefined) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text("GST (10%)", boxX + 8, lineY);
      this.doc.text(formatCurrency(gst), boxX + boxWidth - 6, lineY, { align: "right" });
      lineY += 8;
    }

    // Separator line
    this.doc.setDrawColor(202, 138, 4); // gold
    this.doc.setLineWidth(0.5);
    this.doc.line(boxX + 8, lineY - 2, boxX + boxWidth - 6, lineY - 2);
    lineY += 4;

    // Total
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("TOTAL", boxX + 8, lineY);
    this.doc.setTextColor(202, 138, 4); // gold
    this.doc.text(formatCurrency(total), boxX + boxWidth - 6, lineY, { align: "right" });

    // GST statement
    lineY += 8;
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(148, 163, 184);
    this.doc.text("GST inclusive. ABN required for tax invoice.", boxX + 8, lineY);

    this.y += boxHeight + 10;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add premium payment terms section
   */
  addPaymentTermsSection(options: {
    bankName?: string;
    bsb?: string;
    accountNumber?: string;
    accountName?: string;
    paymentTerms?: string;
    dueDate?: string;
    paymentReference?: string;
  }): void {
    this.checkNewPage(45);
    
    this.addSectionHeading("Payment Details");

    // Two-column layout
    const colWidth = (this.maxWidth - 10) / 2;

    // Bank details (left)
    this.doc.setFillColor(248, 250, 252); // slate-50
    this.doc.rect(this.config.marginLeft, this.y - 2, colWidth, 35, "F");
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.config.marginLeft, this.y - 2, colWidth, 35, "S");

    let leftY = this.y + 3;
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text("BANK TRANSFER DETAILS", this.config.marginLeft + 4, leftY);
    leftY += 6;

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(15, 23, 42);

    if (options.bankName) {
      this.doc.text(`Bank: ${options.bankName}`, this.config.marginLeft + 4, leftY);
      leftY += 5;
    }
    if (options.bsb) {
      this.doc.text(`BSB: ${options.bsb}`, this.config.marginLeft + 4, leftY);
      leftY += 5;
    }
    if (options.accountNumber) {
      this.doc.text(`Account: ${options.accountNumber}`, this.config.marginLeft + 4, leftY);
      leftY += 5;
    }
    if (options.accountName) {
      this.doc.text(`Name: ${options.accountName}`, this.config.marginLeft + 4, leftY);
    }

    // Payment terms (right)
    const rightX = this.config.marginLeft + colWidth + 10;
    this.doc.setFillColor(254, 252, 232); // yellow-50
    this.doc.rect(rightX, this.y - 2, colWidth, 35, "F");
    this.doc.setDrawColor(253, 224, 71); // yellow-300
    this.doc.rect(rightX, this.y - 2, colWidth, 35, "S");

    let rightY = this.y + 3;
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(146, 64, 14);
    this.doc.text("PAYMENT TERMS", rightX + 4, rightY);
    rightY += 6;

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(15, 23, 42);

    if (options.paymentTerms) {
      this.doc.text(`Terms: ${options.paymentTerms}`, rightX + 4, rightY);
      rightY += 5;
    }
    if (options.dueDate) {
      this.doc.setFont("helvetica", "bold");
      this.doc.text(`Due Date: ${options.dueDate}`, rightX + 4, rightY);
      rightY += 5;
    }
    if (options.paymentReference) {
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`Reference: ${options.paymentReference}`, rightX + 4, rightY);
    }

    this.y += 42;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add premium footer for professional documents
   * Includes document ID, timestamp, page numbers, and compliance note
   */
  addPremiumFooter(options: {
    issuerName?: string;
    documentId?: string;
    stateCode?: string;
    includeComplianceNote?: boolean;
  }): void {
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
      
      // Footer background
      this.doc.setFillColor(248, 250, 252); // slate-50
      this.doc.rect(0, this.config.pageHeight - 22, this.config.pageWidth, 22, "F");
      
      // Top border
      this.doc.setDrawColor(226, 232, 240); // slate-200
      this.doc.setLineWidth(0.5);
      this.doc.line(0, this.config.pageHeight - 22, this.config.pageWidth, this.config.pageHeight - 22);
      
      // Gold accent line
      this.doc.setDrawColor(202, 138, 4); // gold
      this.doc.setLineWidth(1);
      this.doc.line(0, this.config.pageHeight - 21, this.config.pageWidth, this.config.pageHeight - 21);

      // Issuer name (left)
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(100, 116, 139);
      if (options.issuerName) {
        this.doc.text(
          `Issued by ${options.issuerName}`,
          this.config.marginLeft,
          this.config.pageHeight - 14
        );
      }

      // Document reference and timestamp (center)
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(7);
      let centerText = timestamp;
      if (options.documentId) {
        centerText = `Doc: ${options.documentId}  |  ${timestamp}`;
      }
      this.doc.text(
        centerText,
        this.config.pageWidth / 2,
        this.config.pageHeight - 14,
        { align: "center" }
      );

      // Page number (right)
      this.doc.text(
        `Page ${i} of ${totalPages}`,
        this.config.pageWidth - this.config.marginRight,
        this.config.pageHeight - 14,
        { align: "right" }
      );

      // Compliance note
      if (options.includeComplianceNote !== false) {
        this.doc.setFontSize(6);
        this.doc.setTextColor(148, 163, 184);
        this.doc.text(
          "Document formatted for Australian construction industry standards. Professional review required before reliance. No compliance claims made.",
          this.config.pageWidth / 2,
          this.config.pageHeight - 7,
          { align: "center" }
        );
      }
    }
  }

  /**
   * R6: Add signature block with blank lines (not pre-filled)
   * For documents requiring acceptance/approval like Variations and EOT
   */
  addSignatureBlock(options: {
    title?: string;
    contractorName?: string;
    clientName?: string;
    showContractor?: boolean;
    showClient?: boolean;
  }): void {
    const {
      title = "Approval and Signatures",
      contractorName = "",
      clientName = "",
      showContractor = true,
      showClient = true,
    } = options;

    this.checkNewPage(80);

    // Section heading
    this.addSectionHeading(title);

    const colWidth = (this.maxWidth - 10) / 2; // Two columns with gap
    const lineLength = colWidth - 20;
    const startY = this.y;

    // Contractor signature (left column)
    if (showContractor) {
      const leftX = this.config.marginLeft;
      let yPos = startY;

      // Label
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(100, 116, 139); // slate-500
      this.doc.text("CONTRACTOR", leftX, yPos);
      yPos += 8;

      // Name field
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(15, 23, 42); // slate-900
      this.doc.text("Name:", leftX, yPos);
      this.doc.text(contractorName || "_________________________", leftX + 15, yPos);
      yPos += 12;

      // Signature line
      this.doc.text("Signature:", leftX, yPos);
      this.doc.setDrawColor(100, 116, 139);
      this.doc.setLineWidth(0.3);
      this.doc.line(leftX + 22, yPos, leftX + 22 + lineLength - 22, yPos);
      yPos += 12;

      // Date line
      this.doc.text("Date:", leftX, yPos);
      this.doc.line(leftX + 15, yPos, leftX + 15 + lineLength - 15, yPos);
    }

    // Client signature (right column)
    if (showClient) {
      const rightX = this.config.marginLeft + colWidth + 10;
      let yPos = startY;

      // Label
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(100, 116, 139); // slate-500
      this.doc.text("CLIENT / PRINCIPAL", rightX, yPos);
      yPos += 8;

      // Name field
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(15, 23, 42); // slate-900
      this.doc.text("Name:", rightX, yPos);
      this.doc.text(clientName || "_________________________", rightX + 15, yPos);
      yPos += 12;

      // Signature line
      this.doc.text("Signature:", rightX, yPos);
      this.doc.setDrawColor(100, 116, 139);
      this.doc.setLineWidth(0.3);
      this.doc.line(rightX + 22, yPos, rightX + 22 + lineLength - 22, yPos);
      yPos += 12;

      // Date line
      this.doc.text("Date:", rightX, yPos);
      this.doc.line(rightX + 15, yPos, rightX + 15 + lineLength - 15, yPos);
    }

    this.y = startY + 45;
    this.doc.setTextColor(...this.config.colors.text);
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
  // COMPACT ONE-PAGE DOCUMENT METHODS
  // For premium client-facing documents that must fit on one page
  // -------------------------------------------------------------------------

  /**
   * Add compact premium header for one-page client documents
   * Smaller, more efficient layout while maintaining premium look
   */
  addCompactPremiumHeader(options: {
    documentType: string;
    documentRef?: string;
    documentDate?: string;
    issuer?: {
      businessName?: string;
      abn?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
    };
    client?: {
      name?: string;
      address?: string;
    };
    projectTitle?: string;
    projectAddress?: string;
  }): void {
    const { documentType, documentRef, documentDate, issuer, client, projectTitle, projectAddress } = options;
    
    // Compact navy header - 28mm height
    this.doc.setFillColor(30, 41, 59); // slate-800
    this.doc.rect(0, 0, this.config.pageWidth, 28, "F");
    
    // Gold accent line
    this.doc.setFillColor(202, 138, 4); // yellow-600
    this.doc.rect(0, 28, this.config.pageWidth, 1.5, "F");

    // Business name (left side)
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(issuer?.businessName?.toUpperCase() || "OMNEXORA", this.config.marginLeft, 10);
    
    // ABN and License (small, under business name)
    if (issuer?.abn || issuer?.licenseNumber) {
      this.doc.setFontSize(6);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(148, 163, 184); // slate-400
      const credLine = [
        issuer.abn ? `ABN: ${issuer.abn.replace(/\s/g, "").replace(/(.{2})(.{3})(.{3})(.{3})/, "$1 $2 $3 $4")}` : "",
        issuer.licenseNumber ? `Lic: ${issuer.licenseNumber}` : ""
      ].filter(Boolean).join("  |  ");
      this.doc.text(credLine, this.config.marginLeft, 15);
    }
    
    // Contact info (under credentials)
    if (issuer?.phone || issuer?.email) {
      this.doc.setFontSize(6);
      this.doc.setTextColor(148, 163, 184);
      const contactLine = [issuer.phone, issuer.email].filter(Boolean).join("  |  ");
      this.doc.text(contactLine, this.config.marginLeft, 20);
    }

    // Document type and reference (right side)
    const rightX = this.config.pageWidth - this.config.marginRight;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(202, 138, 4); // gold
    this.doc.text(documentType.toUpperCase(), rightX, 10, { align: "right" });
    
    if (documentRef) {
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(`Ref: ${documentRef}`, rightX, 15, { align: "right" });
    }
    
    if (documentDate) {
      this.doc.setFontSize(6);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text(documentDate, rightX, 20, { align: "right" });
    }

    // Info bar with client/project details (if provided)
    let barY = 32;
    if (client?.name || projectTitle || projectAddress) {
      this.doc.setFillColor(248, 250, 252); // slate-50
      this.doc.rect(this.config.marginLeft, barY, this.maxWidth, 14, "F");
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.rect(this.config.marginLeft, barY, this.maxWidth, 14, "S");

      this.doc.setFontSize(6);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(100, 116, 139);
      
      // Left side - client info
      if (client?.name) {
        this.doc.text("CLIENT:", this.config.marginLeft + 3, barY + 4);
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(7);
        this.doc.setTextColor(15, 23, 42);
        this.doc.text(client.name, this.config.marginLeft + 3, barY + 9);
        if (client.address) {
          this.doc.setFontSize(6);
          this.doc.setTextColor(100, 116, 139);
          this.doc.text(client.address.substring(0, 50), this.config.marginLeft + 3, barY + 12);
        }
      }

      // Right side - project info
      const midX = this.config.marginLeft + this.maxWidth / 2;
      if (projectTitle || projectAddress) {
        this.doc.setFontSize(6);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(100, 116, 139);
        this.doc.text("PROJECT:", midX, barY + 4);
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(7);
        this.doc.setTextColor(15, 23, 42);
        if (projectTitle) this.doc.text(projectTitle.substring(0, 40), midX, barY + 9);
        if (projectAddress) {
          this.doc.setFontSize(6);
          this.doc.setTextColor(100, 116, 139);
          this.doc.text(projectAddress.substring(0, 40), midX, barY + 12);
        }
      }
      
      barY += 16;
    }

    this.y = barY + 2;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add compact section heading for one-page documents
   */
  addCompactSectionHeading(text: string): void {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59); // slate-800
    this.doc.text(this.cleanText(text).toUpperCase(), this.config.marginLeft, this.y);
    this.y += 3;
    
    // Thin gold underline
    this.doc.setDrawColor(202, 138, 4); // gold
    this.doc.setLineWidth(0.5);
    this.doc.line(this.config.marginLeft, this.y, this.config.marginLeft + 40, this.y);
    this.y += 3;
  }

  /**
   * Add compact text for one-page documents (smaller font, tighter spacing)
   */
  addCompactText(text: string, options?: { indent?: number; bold?: boolean; color?: [number, number, number] }): void {
    const cleanedText = this.cleanText(text);
    if (!cleanedText) return;

    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    this.doc.setTextColor(...(options?.color || this.config.colors.text));

    const indent = options?.indent || 0;
    const lines = this.doc.splitTextToSize(cleanedText, this.maxWidth - indent);
    
    for (const line of lines) {
      this.doc.text(line, this.config.marginLeft + indent, this.y);
      this.y += 2.8;
    }
  }

  /**
   * Add compact bullet list for one-page documents
   */
  addCompactBulletList(items: string[], maxItems: number = 10): void {
    const displayItems = items.slice(0, maxItems);
    
    for (const item of displayItems) {
      const cleanItem = this.cleanText(item);
      if (!cleanItem) continue;
      
      this.doc.setFontSize(7);
      this.doc.setTextColor(22, 163, 74); // green
      this.doc.text("•", this.config.marginLeft, this.y);
      
      this.doc.setTextColor(...this.config.colors.text);
      const lines = this.doc.splitTextToSize(cleanItem, this.maxWidth - 6);
      this.doc.text(lines[0], this.config.marginLeft + 4, this.y);
      this.y += 2.8;
    }
    
    if (items.length > maxItems) {
      this.doc.setFontSize(6);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(`+ ${items.length - maxItems} more items...`, this.config.marginLeft + 4, this.y);
      this.y += 2.5;
    }
  }

  /**
   * Add compact table for one-page documents (minimal rows, small fonts)
   */
  addCompactTable(headers: string[], rows: string[][], options?: { colWidths?: number[]; maxRows?: number }): void {
    const colWidths = options?.colWidths || headers.map(() => this.maxWidth / headers.length);
    const maxRows = options?.maxRows || 8;
    const displayRows = rows.slice(0, maxRows);
    const rowHeight = 5;
    const cellPadding = 1.5;

    // Header row
    const headerY = this.y;
    this.doc.setFillColor(30, 41, 59); // slate-800
    this.doc.rect(this.config.marginLeft, headerY - 1, this.maxWidth, rowHeight + 1, "F");
    
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    
    let xPos = this.config.marginLeft + cellPadding;
    for (let i = 0; i < headers.length; i++) {
      this.doc.text(this.cleanText(headers[i]).substring(0, 15), xPos, headerY + 3);
      xPos += colWidths[i];
    }
    this.y = headerY + rowHeight + 1;

    // Data rows
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(6);
    
    for (let rowIndex = 0; rowIndex < displayRows.length; rowIndex++) {
      const row = displayRows[rowIndex];
      
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(this.config.marginLeft, this.y - 1, this.maxWidth, rowHeight, "F");
      }
      
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.2);
      this.doc.line(this.config.marginLeft, this.y + rowHeight - 1, this.config.marginLeft + this.maxWidth, this.y + rowHeight - 1);
      
      this.doc.setTextColor(...this.config.colors.text);
      xPos = this.config.marginLeft + cellPadding;
      for (let i = 0; i < row.length; i++) {
        this.doc.text(this.cleanText(row[i] || "").substring(0, 20), xPos, this.y + 2.5);
        xPos += colWidths[i];
      }
      this.y += rowHeight;
    }
    
    if (rows.length > maxRows) {
      this.doc.setFontSize(5);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(`+ ${rows.length - maxRows} more rows (see attached schedule)`, this.config.marginLeft, this.y + 2);
      this.y += 3;
    }
    
    this.y += 2;
  }

  /**
   * Add compact totals box for invoices/quotes (one-page friendly)
   */
  addCompactTotalsBox(items: { subtotal?: number; gst?: number; total: number }): void {
    const boxWidth = 60;
    const boxX = this.config.pageWidth - this.config.marginRight - boxWidth;
    const boxHeight = 22;
    
    // Background
    this.doc.setFillColor(30, 41, 59);
    this.doc.rect(boxX, this.y, boxWidth, boxHeight, "F");
    
    // Gold accent
    this.doc.setFillColor(202, 138, 4);
    this.doc.rect(boxX, this.y, 2, boxHeight, "F");

    const formatCurrency = (amount: number) => 
      new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

    let lineY = this.y + 5;
    
    if (items.subtotal !== undefined) {
      this.doc.setFontSize(6);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(148, 163, 184);
      this.doc.text("Subtotal (ex GST)", boxX + 5, lineY);
      this.doc.text(formatCurrency(items.subtotal), boxX + boxWidth - 4, lineY, { align: "right" });
      lineY += 4;
    }
    
    if (items.gst !== undefined) {
      this.doc.setTextColor(148, 163, 184);
      this.doc.text("GST (10%)", boxX + 5, lineY);
      this.doc.text(formatCurrency(items.gst), boxX + boxWidth - 4, lineY, { align: "right" });
      lineY += 4;
    }
    
    // Separator
    this.doc.setDrawColor(202, 138, 4);
    this.doc.setLineWidth(0.3);
    this.doc.line(boxX + 5, lineY - 1, boxX + boxWidth - 4, lineY - 1);
    lineY += 3;
    
    // Total
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("TOTAL", boxX + 5, lineY);
    this.doc.setTextColor(202, 138, 4);
    this.doc.text(formatCurrency(items.total), boxX + boxWidth - 4, lineY, { align: "right" });
    
    this.y += boxHeight + 3;
  }

  /**
   * Add compact dual signature block for client-facing documents
   * Fits trade and client signatures side by side
   */
  addCompactDualSignatureBlock(options: {
    tradeLabel?: string;
    tradeName?: string;
    clientLabel?: string;
    clientName?: string;
  }): void {
    const { 
      tradeLabel = "CONTRACTOR/TRADE", 
      tradeName = "", 
      clientLabel = "CLIENT/PRINCIPAL", 
      clientName = "" 
    } = options;

    // Signature section header
    this.doc.setDrawColor(202, 138, 4); // gold
    this.doc.setLineWidth(0.5);
    this.doc.line(this.config.marginLeft, this.y, this.config.marginLeft + this.maxWidth, this.y);
    this.y += 4;
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(30, 41, 59);
    this.doc.text("ACCEPTANCE & SIGNATURES", this.config.marginLeft, this.y);
    this.y += 5;

    const colWidth = (this.maxWidth - 10) / 2;
    const leftX = this.config.marginLeft;
    const rightX = this.config.marginLeft + colWidth + 10;
    const startY = this.y;

    // Trade/Contractor signature (left)
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(tradeLabel, leftX, startY);
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(`Name: ${tradeName || "________________________"}`, leftX, startY + 5);
    
    this.doc.text("Signature:", leftX, startY + 12);
    this.doc.setDrawColor(100, 116, 139);
    this.doc.setLineWidth(0.2);
    this.doc.line(leftX + 18, startY + 12, leftX + colWidth - 5, startY + 12);
    
    this.doc.text("Date:", leftX, startY + 19);
    this.doc.line(leftX + 12, startY + 19, leftX + colWidth - 5, startY + 19);

    // Client signature (right)
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(clientLabel, rightX, startY);
    
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(`Name: ${clientName || "________________________"}`, rightX, startY + 5);
    
    this.doc.text("Signature:", rightX, startY + 12);
    this.doc.line(rightX + 18, startY + 12, rightX + colWidth - 5, startY + 12);
    
    this.doc.text("Date:", rightX, startY + 19);
    this.doc.line(rightX + 12, startY + 19, rightX + colWidth - 5, startY + 19);

    this.y = startY + 24;
    this.doc.setTextColor(...this.config.colors.text);
  }

  /**
   * Add compact footer for one-page documents
   */
  addCompactFooter(options: { issuerName?: string; documentId?: string }): void {
    const doc = this.doc;
    const pageHeight = this.config.pageHeight;
    const pageWidth = this.config.pageWidth;
    
    // Footer line
    doc.setDrawColor(202, 138, 4); // gold
    doc.setLineWidth(0.5);
    doc.line(this.config.marginLeft, pageHeight - 10, pageWidth - this.config.marginRight, pageHeight - 10);

    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    
    const timestamp = new Date().toLocaleString("en-AU", {
      day: "numeric", month: "short", year: "numeric"
    });
    
    // Left: Issuer
    if (options.issuerName) {
      doc.text(`Issued by ${options.issuerName}`, this.config.marginLeft, pageHeight - 6);
    }
    
    // Center: Compliance note
    doc.text(
      "Document formatted for Australian standards. Review required.",
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
    
    // Right: Date and ref
    let rightText = timestamp;
    if (options.documentId) rightText = `${options.documentId} | ${rightText}`;
    doc.text(rightText, pageWidth - this.config.marginRight, pageHeight - 6, { align: "right" });
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
