import { describe, it, expect, vi } from 'vitest';
import { createSSEStream, getSSEHeaders, isStreamingRequest, processOpenAIStream } from './streaming';
import type { StreamChunk } from './streaming';

describe('Streaming Utilities', () => {
  describe('createSSEStream', () => {
    it('should create a readable stream', async () => {
      const stream = createSSEStream(async (controller, sendChunk) => {
        sendChunk({ type: 'token', content: 'Hello' });
      });

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should send chunks in SSE format', async () => {
      const chunks: string[] = [];

      const stream = createSSEStream(async (controller, sendChunk) => {
        sendChunk({ type: 'token', content: 'Hello' });
        sendChunk({ type: 'token', content: ' World' });
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }

      const combined = chunks.join('');

      // Should be formatted as SSE
      expect(combined).toContain('data: ');
      expect(combined).toContain('"type":"token"');
      expect(combined).toContain('"content":"Hello"');
      expect(combined).toContain('"content":" World"');
    });

    it('should handle errors gracefully', async () => {
      const chunks: StreamChunk[] = [];

      const stream = createSSEStream(async (controller, sendChunk) => {
        sendChunk({ type: 'token', content: 'Start' });
        throw new Error('Test error');
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.substring(6); // Remove 'data: '
          chunks.push(JSON.parse(data));
        }
      }

      // Should send error chunk
      const errorChunk = chunks.find(c => c.type === 'error');
      expect(errorChunk).toBeDefined();
      expect(errorChunk?.error).toBe('Test error');
    });

    it('should support different chunk types', async () => {
      const chunks: StreamChunk[] = [];

      const stream = createSSEStream(async (controller, sendChunk) => {
        sendChunk({ type: 'token', content: 'Hello' });
        sendChunk({
          type: 'tool_call',
          toolCall: { name: 'update_lead_info', arguments: '{"name":"John"}' }
        });
        sendChunk({ type: 'done' });
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.substring(6);
          chunks.push(JSON.parse(data));
        }
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].type).toBe('token');
      expect(chunks[1].type).toBe('tool_call');
      expect(chunks[2].type).toBe('done');
    });
  });

  describe('processOpenAIStream', () => {
    it('should accumulate tokens from stream', async () => {
      const tokens: string[] = [];
      const toolCalls: Array<{ name: string; args: string }> = [];

      // Mock OpenAI stream
      const mockStream = (async function* () {
        yield {
          choices: [{ delta: { content: 'Hello' } }]
        };
        yield {
          choices: [{ delta: { content: ' World' } }]
        };
      })();

      const result = await processOpenAIStream(
        mockStream as any,
        (token) => tokens.push(token),
        (name, args) => toolCalls.push({ name, args })
      );

      expect(result.fullMessage).toBe('Hello World');
      expect(tokens).toEqual(['Hello', ' World']);
      expect(toolCalls).toHaveLength(0);
    });

    it('should handle tool calls in stream', async () => {
      const tokens: string[] = [];
      const toolCalls: Array<{ name: string; args: string }> = [];

      // Mock OpenAI stream with tool calls
      const mockStream = (async function* () {
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0,
                id: 'call_123',
                function: { name: 'update_lead_info', arguments: '' }
              }]
            }
          }]
        };
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0,
                function: { arguments: '{"name":"' }
              }]
            }
          }]
        };
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0,
                function: { arguments: 'John"}' }
              }]
            }
          }]
        };
      })();

      const result = await processOpenAIStream(
        mockStream as any,
        (token) => tokens.push(token),
        (name, args) => toolCalls.push({ name, args })
      );

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('update_lead_info');
      expect(result.toolCalls[0].arguments).toBe('{"name":"John"}');
      expect(toolCalls).toHaveLength(1);
    });

    it('should handle mixed content and tool calls', async () => {
      const tokens: string[] = [];
      const toolCalls: Array<{ name: string; args: string }> = [];

      const mockStream = (async function* () {
        yield {
          choices: [{ delta: { content: 'Processing' } }]
        };
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0,
                id: 'call_1',
                function: { name: 'test_tool', arguments: '{}' }
              }]
            }
          }]
        };
        yield {
          choices: [{ delta: { content: '...' } }]
        };
      })();

      const result = await processOpenAIStream(
        mockStream as any,
        (token) => tokens.push(token),
        (name, args) => toolCalls.push({ name, args })
      );

      expect(result.fullMessage).toBe('Processing...');
      expect(tokens).toEqual(['Processing', '...']);
      expect(result.toolCalls).toHaveLength(1);
      expect(toolCalls).toHaveLength(1);
    });

    it('should handle multiple tool calls', async () => {
      const tokens: string[] = [];
      const toolCalls: Array<{ name: string; args: string }> = [];

      const mockStream = (async function* () {
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: 0,
                id: 'call_1',
                function: { name: 'tool_one', arguments: '{"a":1}' }
              }]
            }
          }]
        };
        yield {
          choices: [{
            delta: {
              tool_calls: [{
                index: 1,
                id: 'call_2',
                function: { name: 'tool_two', arguments: '{"b":2}' }
              }]
            }
          }]
        };
      })();

      const result = await processOpenAIStream(
        mockStream as any,
        (token) => tokens.push(token),
        (name, args) => toolCalls.push({ name, args })
      );

      expect(result.toolCalls).toHaveLength(2);
      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0].name).toBe('tool_one');
      expect(toolCalls[1].name).toBe('tool_two');
    });
  });

  describe('getSSEHeaders', () => {
    it('should return correct SSE headers', () => {
      const headers = getSSEHeaders();

      expect(headers['Content-Type']).toBe('text/event-stream');
      expect(headers['Cache-Control']).toBe('no-cache, no-transform');
      expect(headers['Connection']).toBe('keep-alive');
      expect(headers['X-Accel-Buffering']).toBe('no');
    });
  });

  describe('isStreamingRequest', () => {
    it('should detect streaming request from accept header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'accept': 'text/event-stream'
        }
      });

      expect(isStreamingRequest(request)).toBe(true);
    });

    it('should return false for non-streaming request', () => {
      const request = new Request('http://localhost', {
        headers: {
          'accept': 'application/json'
        }
      });

      expect(isStreamingRequest(request)).toBe(false);
    });

    it('should return false when no accept header', () => {
      const request = new Request('http://localhost');

      expect(isStreamingRequest(request)).toBe(false);
    });

    it('should detect streaming in mixed accept header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'accept': 'application/json, text/event-stream, */*'
        }
      });

      expect(isStreamingRequest(request)).toBe(true);
    });
  });
});
