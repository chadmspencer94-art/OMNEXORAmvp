/**
 * Demo user configuration
 * 
 * Demo users are allowed to perform certain actions (like saving client details)
 * regardless of job ownership, for demonstration purposes.
 */

/**
 * List of email addresses that are demo users.
 * These users can save client details and regenerate packs for demo purposes.
 */
export const DEMO_USER_EMAILS: string[] = [
  "chadmspencer94@gmail.com",
];

/**
 * Checks if a user is a demo user based on their email address.
 * @param email - The user's email address (optional)
 * @returns True if the user is a demo user
 */
export function isDemoUser(email?: string | null): boolean {
  if (!email) return false;
  return DEMO_USER_EMAILS.includes(email.toLowerCase().trim());
}

