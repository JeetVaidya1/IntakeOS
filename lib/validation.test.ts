import { describe, it, expect } from 'vitest';
import { validateEmail, validatePhone } from './validation';

describe('validateEmail', () => {
  it('should return valid for a valid email address', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should return invalid for empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Email is required');
  });

  it('should return invalid for email without @ symbol', () => {
    const result = validateEmail('testexample.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid email address');
  });

  it('should return invalid for email without domain', () => {
    const result = validateEmail('test@');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid email address');
  });

  it('should return invalid for email without TLD', () => {
    const result = validateEmail('test@example');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid email address');
  });

  it('should return invalid for email with spaces', () => {
    const result = validateEmail('test @example.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid email address');
  });

  it('should detect typo in gmail.com domain (gmial.com)', () => {
    const result = validateEmail('user@gmial.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Did you mean user@gmail.com?');
  });

  it('should detect typo in gmail.com domain (gmai.com)', () => {
    const result = validateEmail('user@gmai.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Did you mean user@gmail.com?');
  });

  it('should detect typo in yahoo.com domain (yahooo.com)', () => {
    const result = validateEmail('user@yahooo.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Did you mean user@yahoo.com?');
  });

  it('should detect typo in yahoo.com domain (yaho.com)', () => {
    const result = validateEmail('user@yaho.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Did you mean user@yahoo.com?');
  });

  it('should detect typo in hotmail.com domain (hotmial.com)', () => {
    const result = validateEmail('user@hotmial.com');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Did you mean user@hotmail.com?');
  });

  it('should return valid for email with subdomain', () => {
    const result = validateEmail('test@sub.example.com');
    expect(result.valid).toBe(true);
  });

  it('should return valid for email with plus addressing', () => {
    const result = validateEmail('test+tag@example.com');
    expect(result.valid).toBe(true);
  });

  it('should return valid for email with hyphens', () => {
    const result = validateEmail('test-user@example-domain.com');
    expect(result.valid).toBe(true);
  });
});

describe('validatePhone', () => {
  it('should return valid for a 10-digit phone number', () => {
    const result = validatePhone('1234567890');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should return valid for formatted 10-digit phone number', () => {
    const result = validatePhone('(123) 456-7890');
    expect(result.valid).toBe(true);
  });

  it('should return valid for phone number with spaces', () => {
    const result = validatePhone('123 456 7890');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for empty phone number', () => {
    const result = validatePhone('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Phone number is required');
  });

  it('should return invalid for phone number with less than 10 digits', () => {
    const result = validatePhone('123456789');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid 10-digit phone number');
  });

  it('should return invalid for phone number with more than 10 digits', () => {
    const result = validatePhone('12345678901');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid 10-digit phone number');
  });

  it('should return invalid for phone number with only non-digits', () => {
    const result = validatePhone('abc-def-ghij');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Phone number is required');
  });

  it('should handle phone number with country code (strips non-digits, but expects exactly 10)', () => {
    // validatePhone expects exactly 10 digits, so +1 (123) 456-7890 has 11 digits
    // This should be invalid
    const result = validatePhone('+1 (123) 456-7890');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Please enter a valid 10-digit phone number');
  });
});

