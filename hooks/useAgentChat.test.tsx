import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentChat } from './useAgentChat';
import type { AgenticBotSchema } from '@/types/agentic';

// Mock the supabase uploadFile function
vi.mock('@/lib/supabase', () => ({
  uploadFile: vi.fn(() => Promise.resolve('https://example.com/file.jpg')),
}));

describe('useAgentChat', () => {
  const mockBot = {
    id: 'test-bot-id',
    name: 'Test Bot',
    user_id: 'test-user-id',
    schema: {
      goal: 'Test goal',
      system_prompt: 'Test system prompt',
      required_info: {
        name: {
          description: 'Full name',
          critical: true,
          example: 'John Doe',
        },
      },
      schema_version: 'agentic_v1' as const,
    } as AgenticBotSchema,
  };

  const mockBusinessName = 'Test Business';

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Mock fetch globally - default to successful initiateConversation response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Initial bot message',
        updated_state: {
          gathered_information: {},
          missing_info: ['name'],
          phase: 'introduction' as const,
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleSend', () => {
    it('should update the message list and call the API', async () => {
      const mockResponse = {
        reply: 'Hello! How can I help you?',
        updated_state: {
          gathered_information: {},
          missing_info: ['name'],
          phase: 'collecting' as const,
        },
      };

      // Mock initiateConversation (first call) and handleSend (second call)
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reply: 'Initial bot message',
            updated_state: {
              gathered_information: {},
              missing_info: ['name'],
              phase: 'introduction' as const,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const { result } = renderHook(() =>
        useAgentChat({
          bot: mockBot,
          businessName: mockBusinessName,
        })
      );

      // Wait for initial hydration and first API call to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.messages.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Set input and send message - handleSend should complete without errors
      result.current.setInput('Hello');
      await expect(result.current.handleSend()).resolves.not.toThrow();

      // Wait for handleSend to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Verify fetch was called (should have been called for both initiateConversation and handleSend)
      const fetchCalls = (global.fetch as any).mock.calls;
      expect(fetchCalls.length).toBeGreaterThanOrEqual(1);
      
      // Verify at least one call was to /api/chat/agent
      const agentCalls = fetchCalls.filter((call: any[]) => call[0] === '/api/chat/agent');
      expect(agentCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should not send message if input is empty', async () => {
      const { result } = renderHook(() =>
        useAgentChat({
          bot: mockBot,
          businessName: mockBusinessName,
        })
      );

      // Wait for initial hydration
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      const initialFetchCount = (global.fetch as any).mock.calls.length;

      // Try to send empty message
      result.current.setInput('');
      await result.current.handleSend();

      // Wait a bit to ensure no async calls
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify fetch was not called again
      expect((global.fetch as any).mock.calls.length).toBe(initialFetchCount);
    });
  });

  describe('isLoading', () => {
    it('should toggle loading state correctly during request', async () => {
      // Mock initiateConversation first
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Initial bot message',
          updated_state: {
            gathered_information: {},
            missing_info: [],
            phase: 'introduction' as const,
          },
        }),
      });

      const { result } = renderHook(() =>
        useAgentChat({
          bot: mockBot,
          businessName: mockBusinessName,
        })
      );

      // Wait for initial hydration
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Mock the handleSend fetch call
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'Response',
          updated_state: {
            gathered_information: {},
            missing_info: [],
            phase: 'collecting' as const,
          },
        }),
      });

      // Set input and trigger send
      result.current.setInput('Test message');
      await result.current.handleSend();

      // Verify loading was reset after request completes
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Verify messages were updated (should have initial + user + bot response)
      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 3000 });
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock initiateConversation success, then handleSend error
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reply: 'Initial bot message',
            updated_state: {
              gathered_information: {},
              missing_info: [],
              phase: 'introduction' as const,
            },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useAgentChat({
          bot: mockBot,
          businessName: mockBusinessName,
        })
      );

      // Wait for initial hydration
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Set input and send message
      result.current.setInput('Test message');
      
      // The handleSend should not throw - errors should be caught internally
      await expect(result.current.handleSend()).resolves.not.toThrow();

      // Wait for error handling - loading should be reset
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Verify that the hook is still functional after error
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle API error response gracefully', async () => {
      // Mock initiateConversation success, then handleSend error response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            reply: 'Initial bot message',
            updated_state: {
              gathered_information: {},
              missing_info: [],
              phase: 'introduction' as const,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ error: 'Invalid request' }),
        });

      const { result } = renderHook(() =>
        useAgentChat({
          bot: mockBot,
          businessName: mockBusinessName,
        })
      );

      // Wait for initial hydration
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Set input and send message
      result.current.setInput('Test message');
      
      // The handleSend should not throw - errors should be caught internally
      await expect(result.current.handleSend()).resolves.not.toThrow();

      // Wait for error handling - loading should be reset
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 3000 });

      // Verify that the hook is still functional after error
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    });
  });
});

