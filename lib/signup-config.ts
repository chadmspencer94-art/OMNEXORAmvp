/**
 * Signup mode configuration
 * Controls who can register for OMNEXORA
 */

export type SignupMode = "open" | "invite-only" | "closed";

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
 * Validates an invite code
 * Returns true if the code is valid (matches one of the allowed codes)
 */
export function isValidInviteCode(code: string): boolean {
  const allowedCodes = getInviteCodes();
  if (allowedCodes.length === 0) {
    return false; // No codes configured
  }
  return allowedCodes.includes(code);
}

