/**
 * Validation utilities for IntakeOS
 * Handles phone formatting, email validation, budget parsing, etc.
 */

/**
 * Format phone number as user types
 * Supports US format: (555) 123-4567
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Format based on length
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1]?.toLowerCase();

  // Check for typos like "gmial.com" or "yahooo.com"
  if (domain) {
    const typos: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
    };

    if (typos[domain]) {
      return {
        valid: false,
        message: `Did you mean ${email.split('@')[0]}@${typos[domain]}?`
      };
    }
  }

  return { valid: true };
}

/**
 * Parse budget from fuzzy input
 * Handles: "$500", "around 500", "maybe $300-400", "I dunno, 1000?"
 */
export function parseBudget(input: string): {
  value: string;
  min?: number;
  max?: number;
  confidence: 'high' | 'medium' | 'low';
} {
  // Remove common filler words
  let cleaned = input.toLowerCase()
    .replace(/i don't know|i dunno|maybe|around|approximately|about|roughly/gi, '')
    .trim();

  // Extract all numbers
  const numbers = cleaned.match(/\d+(?:,\d{3})*(?:\.\d{2})?/g);

  if (!numbers || numbers.length === 0) {
    return { value: input, confidence: 'low' };
  }

  // Parse numbers (remove commas)
  const parsedNumbers = numbers.map(n => parseFloat(n.replace(/,/g, '')));

  // Single number - high confidence
  if (parsedNumbers.length === 1) {
    const value = parsedNumbers[0];
    return {
      value: `$${value.toLocaleString()}`,
      min: value,
      max: value,
      confidence: 'high'
    };
  }

  // Range (e.g., "300-500" or "between 300 and 500")
  if (parsedNumbers.length === 2) {
    const [min, max] = parsedNumbers.sort((a, b) => a - b);
    return {
      value: `$${min.toLocaleString()} - $${max.toLocaleString()}`,
      min,
      max,
      confidence: 'high'
    };
  }

  // Multiple numbers - take the most prominent one (usually the first or largest)
  const value = parsedNumbers[0];
  return {
    value: `$${value.toLocaleString()}`,
    min: value,
    max: value,
    confidence: 'medium'
  };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): { valid: boolean; message?: string } {
  const numbers = phone.replace(/\D/g, '');

  if (numbers.length === 0) {
    return { valid: false, message: 'Phone number is required' };
  }

  if (numbers.length !== 10) {
    return { valid: false, message: 'Please enter a valid 10-digit phone number' };
  }

  return { valid: true };
}

/**
 * Format currency input
 */
export function formatCurrency(value: string): string {
  // Remove all non-numeric characters except decimal point
  const numbers = value.replace(/[^\d.]/g, '');

  // Parse and format
  const num = parseFloat(numbers);
  if (isNaN(num)) return '';

  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
