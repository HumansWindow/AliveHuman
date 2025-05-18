/**
 * Formatting utilities for text and data display
 */

/**
 * Truncate a string to a specified length and add an ellipsis if needed
 * @param text String to truncate
 * @param maxLength Maximum length
 * @param ellipsis String to append when truncated
 * @returns Truncated string
 */
export function truncateText(
  text: string,
  maxLength: number = 100,
  ellipsis: string = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (default: USD)
 * @param locale Locale for formatting (default: browser locale)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale?: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format a number with thousand separators
 * @param value Number to format
 * @param decimalPlaces Number of decimal places
 * @param locale Locale for formatting (default: browser locale)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimalPlaces: number = 2,
  locale?: string
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

/**
 * Format a file size in a human-readable format
 * @param bytes Size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Convert a string to title case
 * @param text Input string
 * @returns String in title case
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a string to kebab case
 * @param text Input string
 * @returns String in kebab-case
 */
export function toKebabCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Convert a string to snake case
 * @param text Input string
 * @returns String in snake_case
 */
export function toSnakeCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Convert a string to camel case
 * @param text Input string
 * @returns String in camelCase
 */
export function toCamelCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * Pluralize a word based on count
 * @param word Word to pluralize
 * @param count Count
 * @param pluralForm Custom plural form (optional)
 * @returns Pluralized word
 */
export function pluralize(
  word: string,
  count: number,
  pluralForm?: string
): string {
  if (count === 1) return word;
  
  if (pluralForm) return pluralForm;
  
  // Simple English pluralization rules
  if (word.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(ending => word.endsWith(ending))) {
    return word.slice(0, -1) + 'ies';
  }
  
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  
  return word + 's';
}