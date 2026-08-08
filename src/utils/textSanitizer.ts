/**
 * Sanitizes text by removing invisible Unicode characters that might cause rendering issues.
 * Specifically targets:
 * - \u2063: Invisible Separator
 * - \u200b: Zero Width Space
 * - \ufeff: Byte Order Mark
 * - \u200c: Zero Width Non-Joiner
 * - \u200d: Zero Width Joiner
 */
export const sanitizeText = (text: string): string => {
  if (!text) return text;
  return text.replace(/[\u2063\u200b\ufeff\u200c\u200d]/g, '');
};
