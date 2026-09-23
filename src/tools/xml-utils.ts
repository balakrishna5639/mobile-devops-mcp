/**
 * XML utility functions for safe content generation.
 * Prevents XML injection by escaping special characters in user-provided input.
 */

const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * Escapes XML special characters in a string to prevent injection attacks.
 * 
 * @param input - The raw string to escape
 * @returns The escaped string safe for XML interpolation
 * 
 * @example
 * ```typescript
 * escapeXml('My App</widget><evil>') 
 * // => 'My App&lt;/widget&gt;&lt;evil&gt;'
 * ```
 */
export function escapeXml(input: string): string {
  if (!input) return '';
  return input.replace(/[&<>"']/g, (char) => XML_ESCAPE_MAP[char] ?? char);
}
