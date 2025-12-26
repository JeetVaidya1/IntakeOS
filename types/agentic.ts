/**
 * Agentic Bot Schema - New conversation-based structure
 * This replaces the rigid array of fields with flexible conversation goals
 */
export interface AgenticBotSchema {
  // The overall goal of this conversation
  goal: string;

  // System instructions for the AI agent
  system_prompt: string;

  // Information that needs to be gathered
  required_info: Record<string, RequiredInfoItem>;

  // Schema version for migration tracking
  schema_version: 'agentic_v1';
}

export interface RequiredInfoItem {
  // Description of what this information is
  description: string;

  // Is this critical information (must have) or optional (nice to have)
  critical: boolean;

  // Example of what this looks like
  example: string;

  // Optional: Type hint for validation
  type?: 'text' | 'email' | 'phone' | 'date' | 'number' | 'url';
}

/**
 * Conversation State - Tracks the dynamic flow of conversation
 */
export interface ConversationState {
  // Information we've successfully gathered
  gathered_information: Record<string, string>;

  // List of information keys we still need
  missing_info: string[];

  // Current phase of the conversation
  phase: 'introduction' | 'collecting' | 'answering_questions' | 'confirmation' | 'completed';

  // Topic currently being discussed (for multi-turn discussions)
  current_topic?: string;

  // Last user message (for context)
  last_user_message?: string;
}

/**
 * Agent Response - What the AI agent returns
 */
export interface AgentResponse {
  // The message to show the user
  reply: string;

  // Updated conversation state
  updated_state: ConversationState;

  // Reasoning/debug info (optional, for development)
  reasoning?: string;
}

/**
 * Type guard to check if a bot schema is agentic
 */
export function isAgenticSchema(schema: any): schema is AgenticBotSchema {
  return (
    schema &&
    typeof schema === 'object' &&
    !Array.isArray(schema) &&
    'goal' in schema &&
    'system_prompt' in schema &&
    'required_info' in schema &&
    'schema_version' in schema &&
    schema.schema_version === 'agentic_v1'
  );
}

/**
 * Legacy field schema (for backward compatibility)
 */
export interface LegacyFieldSchema {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

/**
 * Type guard to check if a bot schema is legacy
 */
export function isLegacySchema(schema: any): schema is LegacyFieldSchema[] {
  return Array.isArray(schema);
}
