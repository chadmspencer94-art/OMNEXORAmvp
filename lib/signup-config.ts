/**
 * Signup mode configuration
 * Controls who can register for OMNEXORA
 */

export type SignupMode = "open" | "invite-only" | "closed";

/**
 * Signup source tracking - how the user registered
 */
export type SignupSource = "ORGANIC" | "FOUNDER_CODE" | "FOUNDER_EMAIL" | "INVITE_CODE";

/**
 * The official founder invite code
 * Users who sign up with this code get FOUNDER tier
 */
export const FOUNDER_INVITE_CODE = "OMNEX-FOUNDERS-2026";

/**
 * Gets the current signup mode from environment variables
 * Defaults to "open" if not set
 */
export function getSignupMode(): SignupMode {
  const mode = process.env.OMX_SIGNUP_MODE;
  if (mode === "closed" || mode === "invite-only" || mode === "open") {
    return mode;
  }
  return "open"; // Default to open
}

/**
 * Gets the list of valid invite codes from environment variables
 * Returns empty array if not set
 * Note: The founder code is always valid, separate from env-configured codes
 */
export function getInviteCodes(): string[] {
  const codes = process.env.OMX_INVITE_CODES;
  if (!codes) {
    return [];
  }
  // Split on comma and trim each code
  return codes
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}

/**
 * Checks if a code is the founder invite code
 * Case-insensitive comparison
 */
export function isFounderInviteCode(code: string): boolean {
  return code.trim().toUpperCase() === FOUNDER_INVITE_CODE;
}

/**
 * Validates an invite code
 * Returns true if the code is valid (matches founder code OR one of the allowed codes)
 */
export function isValidInviteCode(code: string): boolean {
  // Founder code is always valid
  if (isFounderInviteCode(code)) {
    return true;
  }
  
  // Check env-configured codes
  const allowedCodes = getInviteCodes();
  if (allowedCodes.length === 0) {
    return false; // No codes configured
  }
  return allowedCodes.includes(code.trim());
}

