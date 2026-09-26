export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CredentialInput = { email: string; password: string };

/**
 * Reads and trims credentials from a submitted form.
 * Non-string entries (e.g. files) are treated as empty.
 */
export function readCredentials(formData: FormData): CredentialInput {
  const email = formData.get("email");
  const password = formData.get("password");
  return {
    email: typeof email === "string" ? email.trim().toLowerCase() : "",
    password: typeof password === "string" ? password : "",
  };
}

/** Returns a user-facing error message, or null when the input is valid. */
export function validateCredentials({ email, password }: CredentialInput): string | null {
  if (!email || !password) return "Enter your email and password.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/**
 * Sanitizes a post-login redirect target. Only same-site absolute paths are
 * allowed; anything else (external URLs, protocol-relative `//host`,
 * backslash tricks) falls back to the dashboard to prevent open redirects.
 */
export function safeRedirectPath(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string" || next.length === 0) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\\]/.test(next)) return fallback;
  return next;
}
