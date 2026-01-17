import OpenAI from 'openai';
import type { ConversationState } from '@/types/agentic';

export interface StreamChunk {
  type: 'token' | 'tool_call' | 'state_update' | 'done' | 'error';
  content?: string;
  toolCall?: {
    name: string;
    arguments: string;
  };
  state?: ConversationState;
  error?: string;
}

/**
 * Create a Server-Sent Events (SSE) stream for real-time agent responses
 */
export function createSSEStream(
  handler: (
    controller: ReadableStreamDefaultController,
    sendChunk: (chunk: StreamChunk) => void
  ) => Promise<void>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const sendChunk = (chunk: StreamChunk) => {
        const data = `data: ${JSON.stringify(chunk)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        await handler(controller, sendChunk);
        controller.close();
      } catch (error) {
        console.error('❌ Stream error:', error);
        sendChunk({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        controller.close();
      }
    }
  });
}

/**
 * Process OpenAI streaming response and extract tokens and tool calls
 */
export async function processOpenAIStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  onToken: (token: string) => void,
  onToolCall: (name: string, args: string) => void
): Promise<{ fullMessage: string; toolCalls: Array<{ name: string; arguments: string }> }> {
  let fullMessage = '';
  const toolCalls: Array<{ name: string; arguments: string; id?: string }> = [];
  const toolCallsMap = new Map<number, { name?: string; arguments: string; id?: string }>();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    // Handle content tokens
    if (delta?.content) {
      fullMessage += delta.content;
      onToken(delta.content);
    }

    // Handle tool calls
    if (delta?.tool_calls) {
      for (const toolCall of delta.tool_calls) {
        const index = toolCall.index;

        if (!toolCallsMap.has(index)) {
          toolCallsMap.set(index, { arguments: '', id: toolCall.id });
        }

        const existing = toolCallsMap.get(index)!;

        if (toolCall.function?.name) {
          existing.name = toolCall.function.name;
        }

        if (toolCall.function?.arguments) {
          existing.arguments += toolCall.function.arguments;
        }
      }
    }
  }

  // Convert tool calls map to array
  toolCallsMap.forEach((toolCall) => {
    if (toolCall.name) {
      toolCalls.push({
        name: toolCall.name,
        arguments: toolCall.arguments
      });
      onToolCall(toolCall.name, toolCall.arguments);
    }
  });

  return { fullMessage, toolCalls };
}

/**
 * Format SSE response headers
 */
export function getSSEHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  };
}

/**
 * Helper to check if request wants streaming
 */
export function isStreamingRequest(request: Request): boolean {
  const acceptHeader = request.headers.get('accept');
  return acceptHeader?.includes('text/event-stream') || false;
}
