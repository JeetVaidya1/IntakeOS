import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadFile } from '@/lib/supabase';
import type { AgenticBotSchema, ConversationState, UploadedFile, BotDisplayMode } from '@/types/agentic';

type Message = {
  role: 'bot' | 'user';
  content: string;
};

type BotType = {
  id: string;
  name: string;
  schema: AgenticBotSchema;
  user_id: string;
  display_mode?: BotDisplayMode;
};

export function useAgentChat({
  bot,
  businessName,
  simulatorMode = false,
}: {
  bot: BotType;
  businessName: string;
  simulatorMode?: boolean;
}) {
  const storageKey = `intakeOS_agentic_chat_${bot.id}_${simulatorMode ? 'simulator' : 'live'}`;

  // Initial conversation state
  const initialState: ConversationState = {
    gathered_information: {},
    missing_info: Object.keys(bot.schema.required_info),
    phase: 'introduction',
    current_topic: undefined,
    last_user_message: undefined,
    uploaded_files: [],
    uploaded_documents: [],
  };

  const defaultMessages: Message[] = [];

  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [conversationState, setConversationState] = useState<ConversationState>(initialState);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSimulationResult, setShowSimulationResult] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from localStorage after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Don't restore if completed
        if (parsed.conversationState?.phase === 'completed') {
          localStorage.removeItem(storageKey);
          setIsHydrated(true);
          return;
        }

        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.conversationState) setConversationState(parsed.conversationState);
      }
    } catch (error) {
      console.error('Failed to load agentic chat state:', error);
    }

    setIsHydrated(true);
  }, [storageKey]);

  // Save state to localStorage with debouncing to prevent race conditions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (conversationState.phase === 'completed') return;
    if (loading) return; // Don't save while streaming/loading

    // Debounce saves to avoid excessive writes during rapid state changes
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          messages,
          conversationState,
        }));
      } catch (error) {
        console.error('Failed to save agentic chat state:', error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [messages, conversationState, storageKey, loading]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Phase transition: When conversation completes, immediately lock UI
  useEffect(() => {
    if (conversationState.phase === 'completed' && !isSubmitting && !submissionComplete) {
      setIsSubmitting(true);
      setLoading(true);
    }
  }, [conversationState.phase, isSubmitting, submissionComplete]);

  const initiateConversation = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream', // Request streaming
        },
        body: JSON.stringify({
          messages: [], // Empty - let agent send introduction
          currentState: initialState,
          botSchema: bot.schema,
          businessName,
          botUserId: bot.user_id,
        }),
      });

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream');

      if (isStreaming) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        let botMessage = '';
        let finalState: ConversationState | null = null;
        let streamComplete = false;
        let pendingUpdate = false;

        // Batch UI updates using requestAnimationFrame for smoother rendering
        const scheduleUpdate = () => {
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              setMessages([{ role: 'bot', content: botMessage }]);
              pendingUpdate = false;
            });
          }
        };

        while (!streamComplete) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'token') {
                  botMessage += data.content;
                  // Schedule batched UI update
                  scheduleUpdate();
                } else if (data.type === 'state_update') {
                  finalState = data.state;
                } else if (data.type === 'done') {
                  // Stream complete - set flag to exit both loops
                  streamComplete = true;
                  break;
                }
              } catch (parseError) {
                console.error('Failed to parse SSE chunk:', parseError);
              }
            }
          }
        }

        // Final update to ensure all content is displayed
        setMessages([{ role: 'bot', content: botMessage }]);

        if (finalState) {
          setConversationState(finalState);
        }

      } else {
        // Fallback to JSON
        const data = await response.json();

        if (data.reply) {
          setMessages([{ role: 'bot', content: data.reply }]);
          setConversationState(data.updated_state);
        }
      }
    } catch (error) {
      console.error('Failed to initiate conversation:', error);
      setMessages([{
        role: 'bot',
        content: `Hi! I'm here to help you with ${businessName}. What brings you here today?`
      }]);
    } finally {
      setLoading(false);
    }
  }, [bot.schema, bot.user_id, businessName, initialState]);

  // Initial message - start the conversation
  useEffect(() => {
    if (!isHydrated) return;
    if (messages.length > 0) return; // Already started
    if (loading) return; // Avoid double-triggering

    // Kick off the conversation by calling the agent
    initiateConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const handleSubmit = useCallback(async (
    gatheredInfo: Record<string, string>,
    conversation: Message[],
    uploadedFiles: UploadedFile[]
  ) => {
    // If in simulator mode, show simulation result instead of submitting
    if (simulatorMode) {
      setSimulationData({
        gatheredInfo,
        uploadedFiles,
        botId: bot.id,
        botName: bot.name,
      });
      setShowSimulationResult(true);

      // Mark submission as complete
      setSubmissionComplete(true);
      setIsSubmitting(false);
      setLoading(false);
      return;
    }

    // Real submission
    try {
      const response = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: bot.id,
          data: gatheredInfo,
          conversationTranscript: conversation,
          uploadedFiles: uploadedFiles,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear storage
        localStorage.removeItem(storageKey);

        // Mark submission as complete
        setSubmissionComplete(true);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "I had trouble submitting your information. Please try again or contact us directly."
      }]);
      // Reset states on error so user can try again
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  }, [simulatorMode, bot.id, bot.name, storageKey]);

  const handleSend = useCallback(async () => {
    const userMessage = input.trim();
    const hasFiles = pendingFiles.length > 0;

    // Don't send if there's no message and no files
    if (!userMessage && !hasFiles) return;
    if (loading) return;

    setInput('');

    // Build message content - combine text and files
    const fileMessages: string[] = [];

    pendingFiles.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type.includes('pdf') ||
                         file.type.includes('msword') ||
                         file.type.includes('wordprocessingml') ||
                         file.filename.toLowerCase().endsWith('.pdf') ||
                         file.filename.toLowerCase().endsWith('.docx') ||
                         file.filename.toLowerCase().endsWith('.doc') ||
                         file.filename.toLowerCase().endsWith('.txt');

      if (isDocument) {
        fileMessages.push(`[DOCUMENT] ${file.url} | ${file.filename}`);
      } else if (isImage) {
        fileMessages.push(`[IMAGE] ${file.url}`);
      } else {
        fileMessages.push(`[FILE] ${file.url} | ${file.filename}`);
      }
    });

    // Combine text and file messages
    const fullMessage = userMessage
      ? userMessage + (fileMessages.length > 0 ? '\n' + fileMessages.join('\n') : '')
      : fileMessages.join('\n');

    // Add user message(s) to chat
    const newMessages = [...messages, { role: 'user' as const, content: fullMessage }];
    setMessages(newMessages);

    // Update conversation state with file metadata
    const updatedState = {
      ...conversationState,
      uploaded_files: [...(conversationState.uploaded_files || []), ...pendingFiles],
    };

    // Clear pending files
    setPendingFiles([]);

    // Call the agent brain with retry logic
    setLoading(true);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
          // Exponential backoff: 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream', // Request streaming
        },
        body: JSON.stringify({
          messages: newMessages,
          currentState: updatedState,
          botSchema: bot.schema,
          businessName,
          botUserId: bot.user_id,
        }),
      });

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream');

      if (isStreaming) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No reader available');

        let botMessage = '';
        let finalState: ConversationState | null = null;
        let streamComplete = false;
        let pendingUpdate = false;

        // Add placeholder bot message that we'll update
        setMessages(prev => [...prev, { role: 'bot', content: '' }]);

        // Batch UI updates using requestAnimationFrame for smoother rendering
        const scheduleUpdate = () => {
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'bot', content: botMessage };
                return updated;
              });
              pendingUpdate = false;
            });
          }
        };

        while (!streamComplete) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'token') {
                  // Append token to message
                  botMessage += data.content;
                  // Schedule batched UI update
                  scheduleUpdate();
                } else if (data.type === 'state_update') {
                  // Store state update
                  finalState = data.state;
                } else if (data.type === 'done') {
                  // Stream complete - set flag to exit both loops
                  streamComplete = true;
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE chunk:', parseError);
              }
            }
          }
        }

        // Final update to ensure all content is displayed
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'bot', content: botMessage };
          return updated;
        });

        // Update final state
        if (finalState) {
          setConversationState(finalState);

          // Check if conversation is complete
          if (finalState.phase === 'completed') {
            await handleSubmit(
              finalState.gathered_information,
              newMessages,
              finalState.uploaded_files || []
            );
          }
        }

      } else {
        // Fallback to JSON response (backward compatibility)
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Add agent's reply
        setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
        setConversationState(data.updated_state);

        // Check if conversation is complete
        if (data.updated_state.phase === 'completed') {
          if (!data.service_mismatch) {
            await handleSubmit(
              data.updated_state.gathered_information,
              newMessages,
              data.updated_state.uploaded_files || []
            );
          } else {
            console.log('🚫 Service mismatch - not submitting');
            setSubmissionComplete(true);
            setIsSubmitting(false);
            setLoading(false);
          }
        }
      }

        // If we reach here, the request succeeded - break out of retry loop
        break;

      } catch (error) {
        console.error(`Agent error (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        lastError = error as Error;

        // If this was the last attempt, show error to user
        if (attempt === maxRetries) {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: "I'm having trouble connecting. Please check your internet connection and try again."
          }]);
        }
        // Otherwise, continue to next retry attempt
      }
    }

    // Always stop loading after all retries are exhausted or success
    setLoading(false);
  }, [input, pendingFiles, loading, messages, conversationState, bot.schema, bot.user_id, businessName, handleSubmit]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading || isUploading) return;

    setIsUploading(true);

    try {
      // Upload file (image or document)
      const publicUrl = await uploadFile(file);

      if (!publicUrl) {
        throw new Error('Failed to upload file');
      }

      // Create file metadata
      const fileMetadata: UploadedFile = {
        url: publicUrl,
        filename: file.name,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      };

      // Add to pending files instead of sending immediately
      setPendingFiles(prev => [...prev, fileMetadata]);

    } catch (error) {
      console.error('File upload error:', error);
      // Could show a toast or error message here
    } finally {
      setIsUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  }, [loading, isUploading]);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetConversation = useCallback(() => {
    if (confirm('Are you sure you want to reset the conversation? All progress will be lost.')) {
      // Clear localStorage
      localStorage.removeItem(storageKey);

      // Reset state
      setMessages([]);
      setConversationState(initialState);
      setInput('');
      setPendingFiles([]);

      // Re-initiate conversation
      setTimeout(() => {
        initiateConversation();
      }, 100);
    }
  }, [storageKey, initialState, initiateConversation]);

  return {
    messages,
    input,
    setInput,
    handleSend,
    handleFileUpload,
    removePendingFile,
    pendingFiles,
    loading,
    isUploading,
    conversationState,
    isSubmitting,
    submissionComplete,
    resetConversation,
    messagesEndRef,
    showSimulationResult,
    simulationData,
  };
}

