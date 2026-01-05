/**
 * Document Access Control
 * 
 * Determines if a user has access to document features (PDF download, email, etc.)
 * based on their plan tier, admin status, and pilot program participation.
 * 
 * This module is client-safe and doesn't import server-side code.
 */

export interface UserAccessInfo {
  planTier: string;
  planStatus: string;
  isAdmin: boolean;
}

/**
 * Check if user has access to document features (PDF download, email to client)
 * 
 * Access granted to:
 * - Admin users
 * - Users with paid plans (planTier !== "FREE")
 * - Users in pilot program (planStatus === "TRIAL" or planTier === "TRIAL")
 * 
 * Free users can only create job packs, not use document features
 */
export function hasDocumentFeatureAccess(user: { isAdmin?: boolean } | null, accessInfo?: UserAccessInfo): boolean {
  if (!user) return false;
  
  // Admin users always have access
  const userIsAdmin = accessInfo?.isAdmin ?? user.isAdmin ?? false;
  if (userIsAdmin) {
    return true;
  }
  
  // Get plan info from accessInfo or user object
  const planTier = accessInfo?.planTier || (user as any).planTier || "FREE";
  const planStatus = accessInfo?.planStatus || (user as any).planStatus || "TRIAL";
  
  // Pilot program users (TRIAL status) have access even if FREE tier
  if (planStatus === "TRIAL" || planTier === "TRIAL") {
    return true;
  }
  
  // Paid plan users have access
  if (planTier !== "FREE") {
    return true;
  }
  
  // Free users (not in pilot) do not have access
  return false;
}

/**
 * Get access restriction message for display
 */
export function getDocumentAccessMessage(user: { isAdmin?: boolean } | null, accessInfo?: UserAccessInfo): string {
  if (hasDocumentFeatureAccess(user, accessInfo)) {
    return "";
  }
  
  return "A paid plan or pilot program membership is required to download PDFs and email documents. Free users can create job packs only.";
}

