// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — Validation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate Indian PIN code (6 digits, starts with 1-9)
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim())
}

/**
 * Validate Indian mobile number (10 digits, starts with 6-9)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Allow 10-digit or 12-digit with 91 prefix
  if (cleaned.length === 10) return /^[6-9][0-9]{9}$/.test(cleaned)
  if (cleaned.length === 12) return cleaned.startsWith('91') && /^[6-9][0-9]{9}$/.test(cleaned.slice(2))
  return false
}

/**
 * Validate Indian GST number (15-char GSTIN format)
 * Format: 2-digit state code + 10-char PAN + 1-digit entity + Z + 1-char checksum
 */
export function isValidGST(gst: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.trim().toUpperCase())
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Validate PAN card (India)
 */
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())
}
