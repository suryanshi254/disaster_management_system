// src/utils/formatSeverity.ts

/**
 * Converts a numerical severity value (1–5) into a descriptive label.
 * Example:
 * 1 → "Low", 3 → "Moderate", 5 → "High"
 */
export function formatSeverity(severity: number): string {
  if (severity <= 2) return "Low";
  if (severity <= 4) return "Moderate";
  return "High";
}
