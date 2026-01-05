/**
 * Progress Claim / Tax Invoice Prefill Mapper
 * 
 * Maps job data to Invoice document fields:
 * - Auto-generates invoice number (INV-0001, INV-0002...)
 * - Issue date: today
 * - Due date: today + 7 days (default)
 * - Prefills line items from pricing snapshot (labour/materials as two rows)
 * - Requires user to confirm GST and amounts
 */

import type { JobData } from "../types";
import { mapCommon, type CommonPrefillData } from "./mapCommon";

export interface InvoiceLineItem {
  description: string;
  quantity: number | null;
  unit: string;
  rate: number | null;
  amount: number | null;
}

export interface InvoicePrefillData extends CommonPrefillData {
  invoiceNumber?: string;
  issueDate?: string; // ISO date string, defaults to today
  dueDate?: string; // ISO date string, defaults to today + 7 days
  claimNumber?: string;
  period?: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: number | null;
  gstAmount?: number | null;
  totalInclGst?: number | null;
  paymentTerms?: string;
  includeMaterialsMarkup?: boolean; // Whether to include markup in materials line item (default: false for client-facing)
}

/**
 * Generate next invoice number for a job
 * Format: INV-0001, INV-0002, etc.
 */
function generateInvoiceNumber(jobId: string, existingCount: number = 0): string {
  const num = (existingCount + 1).toString().padStart(4, "0");
  return `INV-${num}`;
}

/**
 * Parse pricing data from job.aiQuote JSON
 * For client-facing documents, use materialsSubtotal (excludes markup)
 * For internal use, can use materialsTotal (includes markup)
 */
function parsePricingData(job: JobData, includeMarkup: boolean = false): {
  labourSubtotal?: number;
  materialsSubtotal?: number;
  materialsMarkupTotal?: number;
  materialsTotal?: number;
  subtotal?: number;
  gstAmount?: number;
  totalInclGst?: number;
} {
  if (!job.aiQuote) {
    // Fallback to job-level materials totals if available
    if (job.materialsSubtotal !== undefined || job.materialsTotal !== undefined) {
      return {
        materialsSubtotal: job.materialsSubtotal ?? undefined,
        materialsMarkupTotal: job.materialsMarkupTotal ?? undefined,
        materialsTotal: includeMarkup ? (job.materialsTotal ?? undefined) : (job.materialsSubtotal ?? undefined),
      };
    }
    return {};
  }
  
  try {
    const quote = typeof job.aiQuote === "string" ? JSON.parse(job.aiQuote) : job.aiQuote;
    const materialsTotalFromQuote = quote.totalEstimate?.materialsTotal || quote.materialsTotal;
    
    // For client-facing, prefer materialsSubtotal (without markup)
    // For internal use, use materialsTotal (with markup) if includeMarkup is true
    const materialsAmount = includeMarkup 
      ? materialsTotalFromQuote 
      : (job.materialsSubtotal ?? materialsTotalFromQuote);
    
    return {
      labourSubtotal: quote.totalEstimate?.labourSubtotal || quote.labourSubtotal,
      materialsSubtotal: job.materialsSubtotal ?? undefined,
      materialsMarkupTotal: job.materialsMarkupTotal ?? undefined,
      materialsTotal: materialsAmount,
      subtotal: quote.totalEstimate?.subtotal || quote.subtotal,
      gstAmount: quote.totalEstimate?.gstAmount || quote.gstAmount,
      totalInclGst: quote.totalEstimate?.totalJobEstimate || quote.totalInclGst || quote.total,
    };
  } catch {
    // Fallback to job-level materials totals
    if (job.materialsSubtotal !== undefined || job.materialsTotal !== undefined) {
      return {
        materialsSubtotal: job.materialsSubtotal ?? undefined,
        materialsMarkupTotal: job.materialsMarkupTotal ?? undefined,
        materialsTotal: includeMarkup ? (job.materialsTotal ?? undefined) : (job.materialsSubtotal ?? undefined),
      };
    }
    return {};
  }
}

/**
 * Map job data to Invoice document fields
 * @param includeMarkup - Whether to include materials markup (default: false for client-facing docs)
 */
export function mapInvoice(
  job: JobData,
  commonData: CommonPrefillData,
  existingInvoiceCount: number = 0,
  includeMarkup: boolean = false
): InvoicePrefillData {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 7); // 7 days default
  
  const pricing = parsePricingData(job, includeMarkup);
  
  // Build line items from pricing snapshot
  const lineItems: InvoiceLineItem[] = [];
  
  if (pricing.labourSubtotal && pricing.labourSubtotal > 0) {
    lineItems.push({
      description: "Labour",
      quantity: null,
      unit: "Item",
      rate: null,
      amount: pricing.labourSubtotal,
    });
  }
  
  // Use materials amount (with or without markup based on includeMarkup flag)
  const materialsAmount = pricing.materialsTotal || pricing.materialsSubtotal;
  if (materialsAmount && materialsAmount > 0) {
    lineItems.push({
      description: "Materials",
      quantity: null,
      unit: "Item",
      rate: null,
      amount: materialsAmount,
    });
  }
  
  // If no line items, add a placeholder
  if (lineItems.length === 0) {
    lineItems.push({
      description: "",
      quantity: null,
      unit: "",
      rate: null,
      amount: null,
    });
  }
  
  return {
    ...commonData,
    invoiceNumber: generateInvoiceNumber(job.jobId || job.id || "", existingInvoiceCount),
    issueDate: today.toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    claimNumber: `PC-${(existingInvoiceCount + 1).toString().padStart(3, "0")}`,
    period: "", // User can fill
    lineItems,
    subtotal: pricing.subtotal || null,
    gstAmount: pricing.gstAmount || null,
    totalInclGst: pricing.totalInclGst || null,
    paymentTerms: "Payment due within 14 days",
    includeMaterialsMarkup: includeMarkup,
  };
}

