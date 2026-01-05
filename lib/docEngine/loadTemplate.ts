/**
 * Template Loader
 * 
 * Loads and validates document templates from JSON files.
 */

import { validateTemplate, TemplateValidationError } from "./validateTemplate";
import type { DocumentTemplate, DocType } from "./types";

// Import templates (these will be bundled at build time)
import swmsTemplate from "../docTemplates/swms_au_wa.json";
import paymentClaimTemplate from "../docTemplates/payment_claim_au_wa.json";
import toolboxTalkTemplate from "../docTemplates/toolbox_talk_au.json";
import variationChangeOrderTemplate from "../docTemplates/variation_change_order_au.json";
import extensionOfTimeTemplate from "../docTemplates/extension_of_time_au.json";
import progressClaimTaxInvoiceTemplate from "../docTemplates/progress_claim_tax_invoice_au.json";
import handoverPracticalCompletionTemplate from "../docTemplates/handover_practical_completion_au.json";
import maintenanceCareGuideTemplate from "../docTemplates/maintenance_care_guide_au.json";

const TEMPLATE_MAP: Record<DocType, any> = {
  SWMS: swmsTemplate,
  PAYMENT_CLAIM_WA: paymentClaimTemplate,
  TOOLBOX_TALK: toolboxTalkTemplate,
  VARIATION_CHANGE_ORDER: variationChangeOrderTemplate,
  EXTENSION_OF_TIME: extensionOfTimeTemplate,
  PROGRESS_CLAIM_TAX_INVOICE: progressClaimTaxInvoiceTemplate,
  HANDOVER_PRACTICAL_COMPLETION: handoverPracticalCompletionTemplate,
  MAINTENANCE_CARE_GUIDE: maintenanceCareGuideTemplate,
};

/**
 * Load and validate a template by document type
 */
export function loadTemplate(docType: DocType): DocumentTemplate {
  const template = TEMPLATE_MAP[docType];
  
  if (!template) {
    throw new Error(`Template not found for document type: ${docType}`);
  }
  
  try {
    validateTemplate(template);
    return template as DocumentTemplate;
  } catch (error) {
    if (error instanceof TemplateValidationError) {
      throw new Error(`Template validation failed for ${docType}: ${error.message}${error.path ? ` (at ${error.path})` : ""}`);
    }
    throw error;
  }
}

/**
 * Get all available document types
 */
export function getAvailableDocTypes(): DocType[] {
  return Object.keys(TEMPLATE_MAP) as DocType[];
}

