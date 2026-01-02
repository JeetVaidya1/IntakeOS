import { describe, it, expect } from 'vitest';
import { isAgenticSchema, isLegacySchema } from './agentic';
import type { AgenticBotSchema, LegacyFieldSchema } from './agentic';

describe('isAgenticSchema', () => {
  it('should correctly identify a valid agentic schema', () => {
    const validAgenticSchema: AgenticBotSchema = {
      goal: 'Collect customer information',
      system_prompt: 'You are a helpful assistant',
      required_info: {
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      },
      schema_version: 'agentic_v1',
    };

    expect(isAgenticSchema(validAgenticSchema)).toBe(true);
  });

  it('should reject an array (legacy schema)', () => {
    const legacySchema: LegacyFieldSchema[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
      },
    ];

    expect(isAgenticSchema(legacySchema)).toBe(false);
  });

  it('should reject an object missing required fields', () => {
    const invalidSchema = {
      goal: 'Collect information',
      system_prompt: 'You are helpful',
      // missing required_info
      // missing schema_version
    };

    expect(isAgenticSchema(invalidSchema)).toBe(false);
  });

  it('should reject an object with wrong schema_version', () => {
    const invalidSchema = {
      goal: 'Collect information',
      system_prompt: 'You are helpful',
      required_info: {},
      schema_version: 'agentic_v2', // wrong version
    };

    expect(isAgenticSchema(invalidSchema)).toBe(false);
  });

  it('should reject null', () => {
    expect(isAgenticSchema(null)).toBe(false);
  });

  it('should reject undefined', () => {
    expect(isAgenticSchema(undefined)).toBe(false);
  });

  it('should reject a string', () => {
    expect(isAgenticSchema('not a schema')).toBe(false);
  });

  it('should reject a number', () => {
    expect(isAgenticSchema(123)).toBe(false);
  });
});

describe('isLegacySchema', () => {
  it('should correctly identify a valid legacy schema (array)', () => {
    const validLegacySchema: LegacyFieldSchema[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your name',
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
      },
      {
        id: 'country',
        type: 'select',
        label: 'Country',
        required: false,
        options: ['USA', 'Canada', 'Mexico'],
      },
    ];

    expect(isLegacySchema(validLegacySchema)).toBe(true);
  });

  it('should correctly identify an empty array as legacy schema', () => {
    expect(isLegacySchema([])).toBe(true);
  });

  it('should reject an agentic schema object', () => {
    const agenticSchema: AgenticBotSchema = {
      goal: 'Collect information',
      system_prompt: 'You are helpful',
      required_info: {},
      schema_version: 'agentic_v1',
    };

    expect(isLegacySchema(agenticSchema)).toBe(false);
  });

  it('should reject null', () => {
    expect(isLegacySchema(null)).toBe(false);
  });

  it('should reject undefined', () => {
    expect(isLegacySchema(undefined)).toBe(false);
  });

  it('should reject a string', () => {
    expect(isLegacySchema('not an array')).toBe(false);
  });

  it('should reject an object', () => {
    expect(isLegacySchema({ some: 'object' })).toBe(false);
  });

  it('should reject a number', () => {
    expect(isLegacySchema(123)).toBe(false);
  });
});

describe('Schema type guards work together', () => {
  it('should correctly distinguish between agentic and legacy schemas', () => {
    const agenticSchema: AgenticBotSchema = {
      goal: 'Test',
      system_prompt: 'Test',
      required_info: {},
      schema_version: 'agentic_v1',
    };

    const legacySchema: LegacyFieldSchema[] = [
      {
        id: 'field1',
        type: 'text',
        label: 'Field 1',
        required: true,
      },
    ];

    expect(isAgenticSchema(agenticSchema)).toBe(true);
    expect(isLegacySchema(agenticSchema)).toBe(false);

    expect(isAgenticSchema(legacySchema)).toBe(false);
    expect(isLegacySchema(legacySchema)).toBe(true);
  });
});

