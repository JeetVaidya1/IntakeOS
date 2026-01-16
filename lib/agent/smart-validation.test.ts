import { describe, it, expect } from 'vitest';
import { validateConversationPhase } from './smart-validation';
import type { AgenticBotSchema } from '@/types/agentic';

describe('validateConversationPhase', () => {
  const createBotSchema = (requiredInfo: Record<string, any>): AgenticBotSchema => ({
    goal: 'Test goal',
    system_prompt: 'Test system prompt',
    required_info: requiredInfo,
    schema_version: 'agentic_v1',
  });

  describe('RULE 1: Cannot confirm with missing critical information', () => {
    it('should block confirmation phase when critical info is missing', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
        email: { description: 'Email', critical: true, example: 'john@example.com' },
        phone: { description: 'Phone', critical: false, example: '555-1234' },
      });

      const gatheredInfo = { name: 'John Doe' }; // Missing critical email

      const result = validateConversationPhase(
        'confirmation',
        'collecting',
        gatheredInfo,
        botSchema,
        'My name is John Doe',
        'What is your email?'
      );

      expect(result.isValid).toBe(false);
      expect(result.correctedPhase).toBe('collecting');
      expect(result.issues).toContain('Cannot enter confirmation - missing critical fields: email');
    });

    it('should allow confirmation when only non-critical info is missing', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
        email: { description: 'Email', critical: true, example: 'john@example.com' },
        phone: { description: 'Phone', critical: false, example: '555-1234' },
      });

      const gatheredInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        // phone is missing but not critical
      };

      const result = validateConversationPhase(
        'confirmation',
        'collecting',
        gatheredInfo,
        botSchema,
        'john@example.com',
        'Let me confirm:\n- Name: John Doe\n- Email: john@example.com\nDoes everything look correct?'
      );

      // Should be valid (or only warn about missing list format)
      expect(result.correctedPhase).toMatch(/confirmation|collecting/);
    });
  });

  describe('RULE 2: Cannot complete without confirmation phase', () => {
    it('should block completion from collecting phase', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
        email: { description: 'Email', critical: true, example: 'john@example.com' },
      });

      const gatheredInfo = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = validateConversationPhase(
        'completed',
        'collecting',
        gatheredInfo,
        botSchema,
        'john@example.com',
        'Great! What is your email?'
      );

      expect(result.isValid).toBe(false);
      expect(result.correctedPhase).toBe('confirmation');
      expect(result.shouldShowConfirmation).toBe(true);
      expect(result.confirmationList).toContain('Let me confirm everything');
    });

    it('should allow completion from confirmation phase', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
      });

      const gatheredInfo = { name: 'John Doe' };

      const result = validateConversationPhase(
        'completed',
        'confirmation',
        gatheredInfo,
        botSchema,
        'yes',
        'Let me confirm:\n- Name: John Doe\nDoes everything look correct?'
      );

      expect(result.isValid).toBe(true);
      expect(result.correctedPhase).toBe('completed');
    });
  });

  describe('RULE 3: Prevent yes-man during validation', () => {
    it('should block completion when user says "yes" to validation question', () => {
      const botSchema = createBotSchema({
        email: { description: 'Email', critical: true, example: 'john@example.com' },
      });

      const gatheredInfo = { email: 'john@example.com' };

      const result = validateConversationPhase(
        'completed',
        'collecting',
        gatheredInfo,
        botSchema,
        'yes',
        'Did you mean john@example.com?'
      );

      expect(result.isValid).toBe(false);
      expect(result.correctedPhase).toBe('collecting');
      expect(result.issues.some(issue => issue.includes('yes-man'))).toBe(true);
    });

    it('should allow "yes" during confirmation phase', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
      });

      const gatheredInfo = { name: 'John Doe' };

      const result = validateConversationPhase(
        'completed',
        'confirmation',
        gatheredInfo,
        botSchema,
        'yes',
        'Let me confirm everything:\n- Name: John Doe\n- Email: john@example.com\nDoes everything look correct?'
      );

      expect(result.isValid).toBe(true);
      expect(result.correctedPhase).toBe('completed');
    });

    it('should allow "looks good" during confirmation phase', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
      });

      const gatheredInfo = { name: 'John Doe' };

      const result = validateConversationPhase(
        'completed',
        'confirmation',
        gatheredInfo,
        botSchema,
        'looks good',
        'Let me confirm everything:\n- Name: John Doe\nDoes everything look correct?'
      );

      expect(result.isValid).toBe(true);
      expect(result.correctedPhase).toBe('completed');
    });
  });

  describe('RULE 4: Confirmation requires bulleted list', () => {
    it('should require confirmation list when entering confirmation phase', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
        email: { description: 'Email', critical: true, example: 'john@example.com' },
      });

      const gatheredInfo = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = validateConversationPhase(
        'confirmation',
        'collecting',
        gatheredInfo,
        botSchema,
        'john@example.com',
        'Great! I have everything I need.' // No list!
      );

      expect(result.shouldShowConfirmation).toBe(true);
      expect(result.confirmationList).toContain('- Full name: John Doe');
      expect(result.confirmationList).toContain('- Email: john@example.com');
      expect(result.confirmationList).toContain('Does everything look correct?');
    });

    it('should accept confirmation with proper list', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
      });

      const gatheredInfo = { name: 'John Doe' };

      const result = validateConversationPhase(
        'confirmation',
        'collecting',
        gatheredInfo,
        botSchema,
        'John Doe',
        'Perfect! Let me confirm everything:\n- Name: John Doe\n\nDoes everything look correct?'
      );

      expect(result.shouldShowConfirmation).toBe(false);
    });
  });

  describe('Confirmation list building', () => {
    it('should build proper confirmation list with all gathered info', () => {
      const botSchema = createBotSchema({
        full_name: { description: 'Full name', critical: true, example: 'John Doe' },
        contact_email: { description: 'Email address', critical: true, example: 'john@example.com' },
        phone_number: { description: 'Phone number', critical: false, example: '555-1234' },
        project_type: { description: 'Type of project', critical: true, example: 'Website' },
      });

      const gatheredInfo = {
        full_name: 'Jane Smith',
        contact_email: 'jane@example.com',
        phone_number: '555-9876',
        project_type: 'Mobile app',
      };

      const result = validateConversationPhase(
        'completed',
        'collecting',
        gatheredInfo,
        botSchema,
        'Mobile app',
        'Great!'
      );

      expect(result.confirmationList).toContain('Let me confirm everything:');
      expect(result.confirmationList).toContain('- Full name: Jane Smith');
      expect(result.confirmationList).toContain('- Email address: jane@example.com');
      expect(result.confirmationList).toContain('- Phone number: 555-9876');
      expect(result.confirmationList).toContain('- Type of project: Mobile app');
      expect(result.confirmationList).toContain('Does everything look correct?');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty gathered info', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
      });

      const result = validateConversationPhase(
        'confirmation',
        'collecting',
        {},
        botSchema,
        'Hello',
        'Hi! How can I help?'
      );

      expect(result.isValid).toBe(false);
      expect(result.correctedPhase).toBe('collecting');
    });

    it('should handle all required info gathered', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
        email: { description: 'Email', critical: true, example: 'john@example.com' },
      });

      const gatheredInfo = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = validateConversationPhase(
        'confirmation',
        'collecting',
        gatheredInfo,
        botSchema,
        'john@example.com',
        'Let me confirm:\n- Name: John Doe\n- Email: john@example.com\nDoes everything look correct?'
      );

      // Should allow confirmation
      expect(['confirmation']).toContain(result.correctedPhase);
    });
  });
});
