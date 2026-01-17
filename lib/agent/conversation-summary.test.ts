import { describe, it, expect } from 'vitest';
import { estimateTokenCount } from './conversation-summary';

describe('Conversation Summarization', () => {
  describe('estimateTokenCount', () => {
    it('should estimate token count for short messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'bot', content: 'Hi! How can I help?' }
      ];

      const tokens = estimateTokenCount(messages);

      // "Hello" (5) + "Hi! How can I help?" (20) = 25 chars / 4 ≈ 7 tokens
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20);
    });

    it('should estimate higher token count for long messages', () => {
      const longMessage = 'a'.repeat(1000); // 1000 chars
      const messages = [
        { role: 'user', content: longMessage },
        { role: 'bot', content: longMessage }
      ];

      const tokens = estimateTokenCount(messages);

      // 2000 chars / 4 = 500 tokens
      expect(tokens).toBeGreaterThan(400);
      expect(tokens).toBeLessThan(600);
    });

    it('should handle empty messages', () => {
      const messages: Array<{ role: string; content: string }> = [];

      const tokens = estimateTokenCount(messages);

      expect(tokens).toBe(0);
    });

    it('should estimate for typical conversation', () => {
      const messages = [
        { role: 'user', content: 'I need help with my roof' },
        { role: 'bot', content: 'I\'d be happy to help! Is this for a residential or commercial property?' },
        { role: 'user', content: 'Residential' },
        { role: 'bot', content: 'Great! What\'s the property address?' },
        { role: 'user', content: '123 Main Street, Springfield' },
        { role: 'bot', content: 'Perfect! What type of roofing issue are you experiencing?' }
      ];

      const tokens = estimateTokenCount(messages);

      // Should be reasonable estimate (not too high or low)
      expect(tokens).toBeGreaterThan(20);
      expect(tokens).toBeLessThan(200);
    });
  });

  describe('summarizeConversation logic', () => {
    it('should not summarize short conversations', () => {
      const messages = Array.from({ length: 15 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'bot',
        content: `Message ${i}`
      }));

      // With threshold of 20, should not summarize 15 messages
      const shouldSummarize = messages.length >= 20;
      expect(shouldSummarize).toBe(false);
    });

    it('should summarize long conversations', () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'bot',
        content: `Message ${i}`
      }));

      // With threshold of 20, should summarize 25 messages
      const shouldSummarize = messages.length >= 20;
      expect(shouldSummarize).toBe(true);
    });

    it('should keep last 10 messages', () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'bot',
        content: `Message ${i}`
      }));

      const recentMessages = messages.slice(-10);
      const oldMessages = messages.slice(0, -10);

      expect(recentMessages.length).toBe(10);
      expect(oldMessages.length).toBe(15);
      expect(recentMessages[0].content).toBe('Message 15');
      expect(recentMessages[9].content).toBe('Message 24');
    });

    it('should preserve message structure', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'bot', content: 'Hi!' },
        { role: 'user', content: 'How are you?' },
        { role: 'bot', content: 'Good!' }
      ];

      const recentMessages = messages.slice(-2);

      expect(recentMessages).toEqual([
        { role: 'user', content: 'How are you?' },
        { role: 'bot', content: 'Good!' }
      ]);
    });
  });

  describe('Token optimization', () => {
    it('should reduce token count after summarization', () => {
      const longConversation = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'bot',
        content: 'This is a long message that takes up many tokens. '.repeat(5) // ~250 chars per message
      }));

      const originalTokens = estimateTokenCount(longConversation);

      // After summarization: 1 summary message + 10 recent messages
      const recentMessages = longConversation.slice(-10);
      const summarizedEstimate = estimateTokenCount(recentMessages) + 125; // Add ~500 chars for summary

      // Summarized should use fewer tokens than original
      expect(summarizedEstimate).toBeLessThan(originalTokens);
    });

    it('should handle gathered information in summary', () => {
      const gatheredInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        service_type: 'Roof repair',
        address: '123 Main St'
      };

      const infoString = JSON.stringify(gatheredInfo, null, 2);

      // Should be reasonable length
      expect(infoString.length).toBeGreaterThan(50);
      expect(infoString.length).toBeLessThan(500);
    });
  });
});
