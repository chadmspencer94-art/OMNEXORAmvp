/**
 * Issuer Profile Validation
 * 
 * Validates business profile data before allowing document issuance.
 * Different document types have different requirements.
 */

import type { IssuerProfile, IssuerValidationResult, DocType } from "./types";

/**
 * Document types that require ABN for tax/legal compliance
 */
const ABN_REQUIRED_DOC_TYPES: DocType[] = [
  "PROGRESS_CLAIM_TAX_INVOICE",
  "PAYMENT_CLAIM_WA",
];

/**
 * Document types that strongly recommend ABN
 */
const ABN_RECOMMENDED_DOC_TYPES: DocType[] = [
  "VARIATION_CHANGE_ORDER",
  "HANDOVER_PRACTICAL_COMPLETION",
];

/**
 * Validate issuer profile for a specific document type
 * 
 * @param docType - The type of document being issued
 * @param issuer - The business profile data
 * @param strict - If true, ABN is required for invoice types (blocks issuance)
 * @returns Validation result with missing fields and warnings
 */
export function validateIssuerForDoc(
  docType: DocType,
  issuer: IssuerProfile | null | undefined,
  strict: boolean = true
): IssuerValidationResult {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const warnings: string[] = [];

  // No issuer data at all
  if (!issuer) {
    return {
      isValid: false,
      missingRequired: ["Business profile not configured"],
      missingRecommended: [],
      warnings: ["Please complete your business profile in Settings before issuing documents."],
      canIssue: false,
    };
  }

  // Legal name is always required
  if (!issuer.legalName || issuer.legalName.trim() === "") {
    missingRequired.push("Business legal name");
  }

  // ABN requirements based on document type
  const abnRequired = ABN_REQUIRED_DOC_TYPES.includes(docType);
  const abnRecommended = ABN_RECOMMENDED_DOC_TYPES.includes(docType);

  if (!issuer.abn || issuer.abn.trim() === "") {
    if (abnRequired) {
      if (strict) {
        missingRequired.push("ABN (required for tax invoices)");
      } else {
        missingRecommended.push("ABN");
        warnings.push("ABN is strongly recommended for tax invoices. Without it, the document may not be legally valid for tax purposes.");
      }
    } else if (abnRecommended) {
      missingRecommended.push("ABN");
    }
  } else {
    // Validate ABN format (11 digits)
    const abnClean = issuer.abn.replace(/\s/g, "");
    if (!/^\d{11}$/.test(abnClean)) {
      warnings.push("ABN format appears invalid. Expected 11 digits.");
    }
  }

  // Contact info recommendations
  if (!issuer.email && !issuer.phone) {
    missingRecommended.push("Contact details (email or phone)");
  }

  // Address recommendations for professional appearance
  if (!issuer.addressLine1 && !issuer.suburb) {
    missingRecommended.push("Business address");
  }

  // GST warning for invoices
  if (ABN_REQUIRED_DOC_TYPES.includes(docType) && issuer.abn && !issuer.gstRegistered) {
    warnings.push("If registered for GST, ensure your profile indicates GST registration.");
  }

  const isValid = missingRequired.length === 0;
  const canIssue = isValid;

  return {
    isValid,
    missingRequired,
    missingRecommended,
    warnings,
    canIssue,
  };
}

/**
 * Get issuer profile from user data
 * Extracts and normalizes business profile fields from a user record
 */
export function extractIssuerFromUser(user: {
  email?: string | null;
  businessName?: string | null;
  tradingName?: string | null;
  abn?: string | null;
  businessAddressLine1?: string | null;
  businessAddressLine2?: string | null;
  businessSuburb?: string | null;
  businessState?: string | null;
  businessPostcode?: string | null;
  businessPhone?: string | null;
  businessLogoUrl?: string | null;
  gstRegistered?: boolean | null;
  // Fallback fields
  serviceArea?: string | null;
}): IssuerProfile {
  return {
    legalName: user.businessName || "",
    tradingName: user.tradingName || undefined,
    abn: user.abn || undefined,
    email: user.email || undefined,
    phone: user.businessPhone || undefined,
    addressLine1: user.businessAddressLine1 || undefined,
    addressLine2: user.businessAddressLine2 || undefined,
    suburb: user.businessSuburb || undefined,
    state: user.businessState || undefined,
    postcode: user.businessPostcode || undefined,
    logoUrl: user.businessLogoUrl || undefined,
    gstRegistered: user.gstRegistered ?? false,
  };
}

/**
 * Format ABN for display (XX XXX XXX XXX)
 */
export function formatABN(abn: string | undefined | null): string {
  if (!abn) return "";
  const cleaned = abn.replace(/\s/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
  }
  return abn;
}

/**
 * Format full business address
 */
export function formatBusinessAddress(issuer: IssuerProfile): string {
  const parts: string[] = [];
  
  if (issuer.addressLine1) parts.push(issuer.addressLine1);
  if (issuer.addressLine2) parts.push(issuer.addressLine2);
  
  const locality: string[] = [];
  if (issuer.suburb) locality.push(issuer.suburb);
  if (issuer.state) locality.push(issuer.state);
  if (issuer.postcode) locality.push(issuer.postcode);
  
  if (locality.length > 0) {
    parts.push(locality.join(" "));
  }
  
  return parts.join(", ");
}


