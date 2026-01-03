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

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (conversationState.phase === 'completed') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        messages,
        conversationState,
      }));
    } catch (error) {
      console.error('Failed to save agentic chat state:', error);
    }
  }, [messages, conversationState, storageKey]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [], // Empty - let agent send introduction
          currentState: initialState,
          botSchema: bot.schema,
          businessName,
          botUserId: bot.user_id,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages([{ role: 'bot', content: data.reply }]);
        setConversationState(data.updated_state);
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

    // Call the agent brain
    setLoading(true);

    try {
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentState: updatedState,
          botSchema: bot.schema,
          businessName,
          botUserId: bot.user_id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add agent's reply
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
      setConversationState(data.updated_state);

      // Check if conversation is complete
      if (data.updated_state.phase === 'completed') {
        // Submit the gathered information with uploaded files
        await handleSubmit(
          data.updated_state.gathered_information,
          newMessages,
          data.updated_state.uploaded_files || []
        );
      }

    } catch (error) {
      console.error('Agent error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "I'm sorry, I had trouble understanding that. Could you try rephrasing?"
      }]);
    } finally {
      setLoading(false);
    }
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

