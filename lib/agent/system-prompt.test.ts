import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './system-prompt';
import type { AgenticBotSchema, ConversationState } from '@/types/agentic';

describe('buildSystemPrompt', () => {
  const createBotSchema = (requiredInfo: Record<string, any>): AgenticBotSchema => ({
    goal: 'Test goal',
    system_prompt: 'Test system prompt',
    required_info: requiredInfo,
    schema_version: 'agentic_v1',
  });

  const createConversationState = (
    phase: ConversationState['phase'],
    gatheredInfo: Record<string, string> = {}
  ): ConversationState => ({
    gathered_information: gatheredInfo,
    missing_info: [],
    phase,
  });

  describe('Few-Shot Examples', () => {
    it('should include few-shot conversational examples in the prompt', () => {
      const botSchema = createBotSchema({
        service_type: {
          description: 'Type of service needed',
          critical: true,
          example: 'Roof repair',
        },
      });

      const state = createConversationState('collecting', {});
      const allRequiredKeys = Object.keys(botSchema.required_info);
      const missingInfo = ['service_type'];

      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        allRequiredKeys,
        missingInfo
      );

      // Should contain few-shot examples
      expect(prompt).toContain('CONVERSATIONAL GUIDELINES - Learn from these examples:');
      expect(prompt).toContain('EXAMPLE 1 - Natural Chaining');
      expect(prompt).toContain('EXAMPLE 2 - Handling Uncertainty');
      expect(prompt).toContain('EXAMPLE 3 - Multi-Part Natural Response');
      expect(prompt).toContain('EXAMPLE 4 - Asking One Thing at a Time');
      expect(prompt).toContain('EXAMPLE 5 - User Exploring');
      expect(prompt).toContain('EXAMPLE 6 - Handling Documents/Images');
    });

    it('should include anti-patterns (what not to do)', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      });

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['name'],
        ['name']
      );

      // Should contain anti-patterns
      expect(prompt).toContain('WHAT NOT TO DO - Avoid these patterns:');
      expect(prompt).toContain('Thank you for that information. Is there anything else you\'d like to add?');
      expect(prompt).toContain('I have noted your response');
      expect(prompt).toContain('Asking multiple questions at once');
    });

    it('should include key principles for natural conversation', () => {
      const botSchema = createBotSchema({
        email: {
          description: 'Email address',
          critical: true,
          example: 'test@example.com',
        },
      });

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['email'],
        ['email']
      );

      // Should contain key principles
      expect(prompt).toContain('KEY PRINCIPLES:');
      expect(prompt).toContain('Use the \'update_lead_info\' tool silently');
      expect(prompt).toContain('Ask for ONE piece of information at a time');
      expect(prompt).toContain('Keep it conversational and natural');
    });

    it('should NOT contain old rule-based instructions', () => {
      const botSchema = createBotSchema({
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      });

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['name'],
        ['name']
      );

      // Should NOT contain old rule-based headers
      expect(prompt).not.toContain('UNIVERSAL OPERATING RULES:');
      expect(prompt).not.toContain('The "Chain" Rule (Most Important)');
      expect(prompt).not.toContain('⛔️ NEVER SAY:');
    });
  });

  describe('Business Context', () => {
    it('should include business profile information when provided', () => {
      const botSchema = createBotSchema({
        service: { description: 'Service type', critical: true, example: 'Cleaning' },
      });
      const businessProfile = {
        name: 'Acme Services',
        business_name: 'Acme Services',
        industry: 'Home Services',
        description: 'Professional cleaning company',
        services: ['Deep cleaning', 'Regular maintenance'],
      };

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'Acme Services',
        botSchema,
        businessProfile,
        state,
        [],
        ['service'],
        ['service']
      );

      expect(prompt).toContain('BUSINESS CONTEXT:');
      expect(prompt).toContain('Acme Services');
      expect(prompt).toContain('Home Services');
      expect(prompt).toContain('Professional cleaning company');
      expect(prompt).toContain('Deep cleaning');
    });

    it('should use effective business name when profile is null', () => {
      const botSchema = createBotSchema({
        service: { description: 'Service type', critical: true, example: 'Repair' },
      });

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'My Business',
        botSchema,
        null,
        state,
        [],
        ['service'],
        ['service']
      );

      expect(prompt).toContain('You represent My Business');
    });
  });

  describe('Dynamic Strategy', () => {
    it('should include first message greeting strategy', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
      });

      const state = createConversationState('introduction', {});
      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['name'],
        ['name'],
        undefined,
        [] // Empty messages = first message
      );

      expect(prompt).toContain('🧠 BATTLE PLAN:');
      expect(prompt).toContain('high-energy Greeting');
      expect(prompt).toContain('Ask ONE open-ended question');
      expect(prompt).toContain('Do NOT ask for contact info yet');
    });

    it('should include core field collection strategy', () => {
      const botSchema = createBotSchema({
        service_type: { description: 'Service needed', critical: true, example: 'Repair' },
        address: { description: 'Property address', critical: true, example: '123 Main St' },
        email: { description: 'Email', critical: true, example: 'test@example.com' },
      });

      const state = createConversationState('collecting', {});
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'bot', content: 'Hi! How can I help?' },
      ];

      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['service_type', 'address', 'email'],
        ['service_type', 'address', 'email'],
        undefined,
        messages
      );

      expect(prompt).toContain('🧠 BATTLE PLAN:');
      expect(prompt).toContain('CURRENT TARGET:');
      expect(prompt).toContain('THE CHAIN MOVE:');
    });

    it('should track missing information in internal note', () => {
      const botSchema = createBotSchema({
        name: { description: 'Full name', critical: true, example: 'John' },
        email: { description: 'Email', critical: true, example: 'john@example.com' },
        phone: { description: 'Phone', critical: false, example: '555-1234' },
      });

      const state = createConversationState('collecting', { name: 'John Doe' });
      const messages = [{ role: 'user', content: 'My name is John Doe' }];

      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['name', 'email', 'phone'],
        ['email', 'phone'],
        undefined,
        messages
      );

      expect(prompt).toContain('Internal Note: Remaining fields to capture:');
      expect(prompt).toContain('email');
      expect(prompt).toContain('phone');
      expect(prompt).not.toContain('[name,'); // name is not missing
    });
  });

  describe('Image and Document Context', () => {
    it('should include image analysis when provided', () => {
      const botSchema = createBotSchema({
        issue: { description: 'Issue description', critical: true, example: 'Leak' },
      });

      const state = createConversationState('collecting', {});
      const imageAnalysis = 'Image shows water damage on ceiling with brown stains';

      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['issue'],
        ['issue'],
        imageAnalysis
      );

      expect(prompt).toContain('IMAGE CONTEXT:');
      expect(prompt).toContain('water damage on ceiling');
    });

    it('should include uploaded documents information', () => {
      const botSchema = createBotSchema({
        request: { description: 'Service request', critical: true, example: 'Quote' },
      });

      const state = createConversationState('collecting', {});
      const uploadedDocuments = [
        { filename: 'floor-plans.pdf', url: 'https://example.com/file.pdf', extracted_text: 'Floor plans...' },
        { filename: 'requirements.docx', url: 'https://example.com/file2.docx', extracted_text: 'Requirements...' },
      ];

      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        uploadedDocuments,
        ['request'],
        ['request']
      );

      expect(prompt).toContain('DOCUMENTS:');
      expect(prompt).toContain('floor-plans.pdf');
      expect(prompt).toContain('requirements.docx');
    });

    it('should not include image/document sections when not provided', () => {
      const botSchema = createBotSchema({
        name: { description: 'Name', critical: true, example: 'John' },
      });

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'Test Business',
        botSchema,
        null,
        state,
        [],
        ['name'],
        ['name']
      );

      expect(prompt).not.toContain('IMAGE CONTEXT:');
      expect(prompt).not.toContain('DOCUMENTS:');
    });
  });

  describe('Identity and Tone', () => {
    it('should establish clear identity as AI Intake Coordinator', () => {
      const botSchema = createBotSchema({
        query: { description: 'User query', critical: true, example: 'Help' },
      });

      const state = createConversationState('collecting', {});
      const prompt = buildSystemPrompt(
        'Premium Auto Services',
        botSchema,
        null,
        state,
        [],
        ['query'],
        ['query']
      );

      expect(prompt).toContain('IDENTITY:');
      expect(prompt).toContain('You are the AI Intake Coordinator for Premium Auto Services');
      expect(prompt).toContain('Tone: Natural, fluid, efficient');
      expect(prompt).toContain('You text like a human (short, casual), not a robot');
    });
  });
});
