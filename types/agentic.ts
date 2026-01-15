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
 * Uploaded File Metadata - Structured information about files uploaded during conversation
 */
export interface UploadedFile {
  // Public URL of the uploaded file
  url: string;

  // Original filename
  filename: string;

  // MIME type (e.g., "application/pdf", "image/jpeg")
  type: string;

  // Which field this file relates to (if any)
  field_key?: string;

  // When the file was uploaded
  uploaded_at: string;
}

/**
 * Uploaded Document with Extracted Text - For document context persistence
 */
export interface UploadedDocument {
  // Original filename
  filename: string;

  // Public URL of the document
  url: string;

  // Extracted text content from the document
  extracted_text: string;

  // When the document was uploaded
  uploaded_at: string;

  // Which turn/message this was uploaded in
  uploaded_turn: number;
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

  // Files uploaded during the conversation (metadata only)
  uploaded_files?: UploadedFile[];

  // Documents with extracted text (for persistent context)
  uploaded_documents?: UploadedDocument[];

  // Intelligence fields for dashboard insights
  // AI-generated 2-3 sentence snapshot of the submission
  summary?: string;

  // User sentiment: 'Positive', 'Neutral', or 'Frustrated'
  sentiment?: 'Positive' | 'Neutral' | 'Frustrated';

  // Submission urgency level: 'Low', 'Medium', or 'High'
  urgency?: 'Low' | 'Medium' | 'High';
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

  // Service mismatch flag - true if conversation ended due to service mismatch
  service_mismatch?: boolean;
}

/**
 * Type guard to check if a bot schema is agentic
 */
export function isAgenticSchema(schema: any): schema is AgenticBotSchema {
  return !!(
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

/**
 * Bot Display Mode - Controls how the bot interface is presented
 */
export type BotDisplayMode = 'chat' | 'form';

/**
 * Bot Interface - Represents a bot configuration
 */
export interface Bot {
  id: string;
  name: string;
  schema: AgenticBotSchema | LegacyFieldSchema[];
  user_id: string;
  display_mode?: BotDisplayMode; // Optional for backward compatibility, defaults to 'chat'
}
