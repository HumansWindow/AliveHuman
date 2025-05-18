/**
 * Validation utility functions for client and server-side validation
 */

/**
 * Check if a string is a valid email
 * @param email Email to validate
 * @returns Boolean indicating whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid Ethereum address
 * @param address Ethereum address to validate
 * @returns Boolean indicating whether the address is valid
 */
export function isValidEthereumAddress(address: string): boolean {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

/**
 * Check if a password meets security requirements
 * @param password Password to validate
 * @param options Password requirements configuration
 * @returns Validation result with error messages if any
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): { isValid: boolean; errors: string[] } {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;
  
  const errors: string[] = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long.`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a URL is valid
 * @param url URL to validate
 * @returns Boolean indicating whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate required fields in an object
 * @param data Object to validate
 * @param requiredFields Array of field names that are required
 * @returns Validation result with missing fields if any
 */
export function validateRequiredFields<T>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: (keyof T)[] } {
  const missingFields: (keyof T)[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}