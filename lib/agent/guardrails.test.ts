import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enforceGuardrails } from './guardrails';
import type { AgenticBotSchema, ConversationState } from '@/types/agentic';

// Mock console.log to avoid cluttering test output
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('enforceGuardrails', () => {
  const createBotSchema = (requiredInfo: Record<string, any>): AgenticBotSchema => ({
    goal: 'Test goal',
    system_prompt: 'Test system prompt',
    required_info: requiredInfo,
    schema_version: 'agentic_v1',
  });

  const createCurrentState = (
    phase: ConversationState['phase'],
    gatheredInfo: Record<string, string> = {}
  ): ConversationState => ({
    gathered_information: gatheredInfo,
    missing_info: [],
    phase,
  });

  describe('Scenario 1: Critical information missing', () => {
    it('should return phase: collecting if critical information is missing, even if AI tries to say phase: confirmation', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
        email: {
          description: 'Email address',
          critical: true,
          example: 'john@example.com',
        },
        phone: {
          description: 'Phone number',
          critical: false,
          example: '123-456-7890',
        },
      });

      const currentState = createCurrentState('collecting', {
        name: 'John Doe',
        // email is missing (critical)
      });

      const parsed = {
        updated_phase: 'confirmation',
        reply: 'Let me confirm everything:\n- Name: John Doe\n- Email: (missing)\nDoes everything look correct?',
        extracted_information: {},
      };

      const messages = [
        { role: 'user', content: 'My name is John Doe' },
        { role: 'bot', content: 'Thank you! What is your email?' },
      ];

      const updatedGatheredInfo = {
        ...currentState.gathered_information,
        ...parsed.extracted_information,
      };
      const allRequiredKeys = Object.keys(botSchema.required_info);

      const result = enforceGuardrails(
        parsed,
        currentState,
        messages,
        botSchema,
        updatedGatheredInfo,
        allRequiredKeys
      );

      expect(result.finalPhase).toBe('collecting');
      expect(result.enforcementApplied).toBe(true);
    });
  });

  describe('Scenario 2: Hard Confirmation Gate', () => {
    it('should block completed phase if the previous phase was NOT confirmation', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
        email: {
          description: 'Email address',
          critical: true,
          example: 'john@example.com',
        },
      });

      const currentState = createCurrentState('collecting', {
        name: 'John Doe',
        email: 'john@example.com',
      });

      const parsed = {
        updated_phase: 'completed',
        reply: 'Thank you! Your information has been submitted.',
        extracted_information: {},
      };

      const messages = [
        { role: 'user', content: 'My name is John Doe and email is john@example.com' },
        { role: 'bot', content: 'Thank you!' },
      ];

      const updatedGatheredInfo = {
        ...currentState.gathered_information,
        ...parsed.extracted_information,
      };
      const allRequiredKeys = Object.keys(botSchema.required_info);

      const result = enforceGuardrails(
        parsed,
        currentState,
        messages,
        botSchema,
        updatedGatheredInfo,
        allRequiredKeys
      );

      // Should be forced to confirmation, not completed
      expect(result.finalPhase).toBe('confirmation');
      expect(parsed.reply).toContain('Let me confirm everything');
      expect(parsed.reply).toContain('name: John Doe');
      expect(parsed.reply).toContain('email: john@example.com');
    });

    it('should block completed phase if in collecting phase (Rule 2)', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      });

      const currentState = createCurrentState('collecting', {
        name: 'John Doe',
      });

      const parsed = {
        updated_phase: 'completed',
        reply: 'Done!',
        extracted_information: {},
      };

      const messages = [
        { role: 'user', content: 'My name is John Doe' },
        { role: 'bot', content: 'Got it!' },
      ];

      const updatedGatheredInfo = {
        ...currentState.gathered_information,
        ...parsed.extracted_information,
      };
      const allRequiredKeys = Object.keys(botSchema.required_info);

      const result = enforceGuardrails(
        parsed,
        currentState,
        messages,
        botSchema,
        updatedGatheredInfo,
        allRequiredKeys
      );

      // Should stay in current phase (collecting) or go to confirmation, not completed
      expect(result.finalPhase).not.toBe('completed');
      expect(['collecting', 'confirmation']).toContain(result.finalPhase);
    });
  });

  describe('Scenario 3: Allow completion from confirmation phase', () => {
    it('should allow completion if user says "yes" AND we are currently in confirmation phase', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
        email: {
          description: 'Email address',
          critical: true,
          example: 'john@example.com',
        },
      });

      const currentState = createCurrentState('confirmation', {
        name: 'John Doe',
        email: 'john@example.com',
      });

      const parsed = {
        updated_phase: 'completed',
        reply: 'Perfect! Your information has been submitted. We\'ll be in touch soon!',
        extracted_information: {},
      };

      const messages = [
        { role: 'user', content: 'My name is John Doe and email is john@example.com' },
        {
          role: 'bot',
          content: 'Let me confirm everything:\n- Name: John Doe\n- Email: john@example.com\nDoes everything look correct?',
        },
        { role: 'user', content: 'yes' },
      ];

      const updatedGatheredInfo = {
        ...currentState.gathered_information,
        ...parsed.extracted_information,
      };
      const allRequiredKeys = Object.keys(botSchema.required_info);

      const result = enforceGuardrails(
        parsed,
        currentState,
        messages,
        botSchema,
        updatedGatheredInfo,
        allRequiredKeys
      );

      // Should allow completion since we're in confirmation phase and user said "yes"
      expect(result.finalPhase).toBe('completed');
    });

    it('should allow completion if user says "looks good" AND we are in confirmation phase', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      });

      const currentState = createCurrentState('confirmation', {
        name: 'John Doe',
      });

      const parsed = {
        updated_phase: 'completed',
        reply: 'Perfect! We\'ll process your submission. Have a great day!',
        extracted_information: {},
      };

      const messages = [
        {
          role: 'bot',
          content: 'Let me confirm everything:\n- Name: John Doe\n- Phone: (optional)\nDoes everything look correct?',
        },
        { role: 'user', content: 'looks good' },
      ];

      const updatedGatheredInfo = {
        ...currentState.gathered_information,
        ...parsed.extracted_information,
      };
      const allRequiredKeys = Object.keys(botSchema.required_info);

      const result = enforceGuardrails(
        parsed,
        currentState,
        messages,
        botSchema,
        updatedGatheredInfo,
        allRequiredKeys
      );

      // Should allow completion
      expect(result.finalPhase).toBe('completed');
    });

    it('should block completion if user says "yes" but NOT in confirmation phase', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      });

      const currentState = createCurrentState('collecting', {
        name: 'John Doe',
      });

      const parsed = {
        updated_phase: 'completed',
        reply: 'Done!',
        extracted_information: {},
      };

      const messages = [
        { role: 'bot', content: 'Did you mean John Doe?' },
        { role: 'user', content: 'yes' },
      ];

      const updatedGatheredInfo = {
        ...currentState.gathered_information,
        ...parsed.extracted_information,
      };
      const allRequiredKeys = Object.keys(botSchema.required_info);

      const result = enforceGuardrails(
        parsed,
        currentState,
        messages,
        botSchema,
        updatedGatheredInfo,
        allRequiredKeys
      );

      // Should NOT allow completion - should force back to collecting or stay in collecting
      expect(result.finalPhase).not.toBe('completed');
      expect(['collecting', 'confirmation']).toContain(result.finalPhase);
    });
  });
});

