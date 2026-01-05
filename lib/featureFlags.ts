/**
 * Feature Flags Configuration
 * 
 * Controls visibility of experimental/non-essential features in the OMNEXORA MVP.
 * Set to `false` to hide features that aren't ready for founders yet.
 * 
 * Core features (auth, onboarding, settings, jobs, clients, admin) are always enabled.
 */

export const featureFlags: Record<string, boolean> = {
  // Calendar - shows scheduled jobs
  showCalendar: false,
  
  // Billing - subscription and payment management
  showBilling: false,
  
  // Rate Templates - template management for job rates
  showRateTemplates: false,
  
  // Materials - material catalog management
  showMaterials: false,
  
  // Signature - digital signature management
  showSignature: false,
  
  // Dev tools / debug routes (if any are exposed in nav)
  showDevTools: false,
  
  // Document Engine V1 - compliance-ready document templates
  DOC_ENGINE_V1: process.env.DOC_ENGINE_V1 === "true",
  
  // Suggested Tradies - tradie matching for clients
  showSuggestedTradies: false,
};

export type FeatureFlag = keyof typeof featureFlags;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag] === true;
}

