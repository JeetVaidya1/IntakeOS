'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, User, Bot, Sparkles, Loader2, AlertCircle, CheckCircle, FileText, RotateCcw } from 'lucide-react';
import { uploadFile } from '@/lib/supabase';
import type { AgenticBotSchema, ConversationState, UploadedFile } from '@/types/agentic';

type Message = {
  role: 'bot' | 'user';
  content: string;
};

type BotType = {
  id: string;
  name: string;
  schema: AgenticBotSchema;
  user_id: string;
};

export function ChatInterfaceAgentic({ bot, businessName }: { bot: BotType; businessName: string }) {
  const storageKey = `intakeOS_agentic_chat_${bot.id}`;

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
  const [isHydrated, setIsHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate progress based on gathered vs missing info
  const totalInfo = Object.keys(bot.schema.required_info).length;
  const gatheredCount = Object.keys(conversationState.gathered_information).length;
  const progress = totalInfo > 0 ? (gatheredCount / totalInfo) * 100 : 0;

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

  // Initial message - start the conversation
  useEffect(() => {
    if (!isHydrated) return;
    if (messages.length > 0) return; // Already started
    if (loading) return; // Avoid double-triggering

    // Kick off the conversation by calling the agent
    initiateConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const initiateConversation = async () => {
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
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    // Call the agent brain
    setLoading(true);

    try {
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentState: conversationState,
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
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;

    setIsUploading(true);

    try {
      // Upload file (image or document)
      const publicUrl = await uploadFile(file);

      // Determine if it's an image or document
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type.includes('pdf') ||
                         file.type.includes('msword') ||
                         file.type.includes('wordprocessingml') ||
                         file.name.toLowerCase().endsWith('.pdf') ||
                         file.name.toLowerCase().endsWith('.docx') ||
                         file.name.toLowerCase().endsWith('.doc') ||
                         file.name.toLowerCase().endsWith('.txt');

      // Create file metadata
      const fileMetadata: UploadedFile = {
        url: publicUrl,
        filename: file.name,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      };

      // Add appropriate message
      let fileMessage: string;
      if (isDocument) {
        fileMessage = `[DOCUMENT] ${publicUrl} | ${file.name}`;
      } else if (isImage) {
        fileMessage = `[IMAGE] ${publicUrl}`;
      } else {
        fileMessage = `[FILE] ${publicUrl} | ${file.name}`;
      }

      const newMessages = [...messages, { role: 'user' as const, content: fileMessage }];
      setMessages(newMessages);

      // Update conversation state with file metadata
      const updatedState = {
        ...conversationState,
        uploaded_files: [...(conversationState.uploaded_files || []), fileMetadata],
      };

      // Call agent to analyze and respond
      setLoading(true);

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

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
        setConversationState(data.updated_state);
      }

    } catch (error) {
      console.error('File upload error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "I had trouble processing that file. Could you try uploading it again?"
      }]);
    } finally {
      setIsUploading(false);
      setLoading(false);

      // Reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (
    gatheredInfo: Record<string, string>,
    conversation: Message[],
    uploadedFiles: UploadedFile[]
  ) => {
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

        // Show success message
        setMessages(prev => [...prev, {
          role: 'bot',
          content: "✅ Perfect! Your information has been submitted successfully. We'll be in touch soon!"
        }]);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "I had trouble submitting your information. Please try again or contact us directly."
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetConversation = () => {
    if (confirm('Are you sure you want to reset the conversation? All progress will be lost.')) {
      // Clear localStorage
      localStorage.removeItem(storageKey);

      // Reset state
      setMessages([]);
      setConversationState(initialState);
      setInput('');

      // Re-initiate conversation
      setTimeout(() => {
        initiateConversation();
      }, 100);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[700px] flex flex-col shadow-2xl border border-white/10 bg-slate-950 backdrop-blur-xl">
      {/* Header - Professional Dark Style */}
      <div className="p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Simple Bot Icon */}
            <div className="p-3 bg-slate-800 rounded-xl border border-white/10">
              <Bot className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">
                {businessName || 'Loading...'}
              </h3>
              <p className="text-sm text-slate-400">Powered by AI</p>
            </div>
          </div>

          {/* Progress indicator and Reset button */}
          <div className="flex items-center gap-4">
            {/* Reset Conversation Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetConversation}
              disabled={loading || messages.length === 0}
              className="border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            {/* Progress indicator - Solid Professional */}
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-2">
                {gatheredCount} of {totalInfo} collected
              </p>
              <div className="w-40 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages - Professional Dark Style */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              {/* Simple Bot Icon */}
              <div className="mx-auto w-16 h-16 p-4 bg-slate-800 rounded-2xl border border-white/10">
                <Bot className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm">Start a conversation...</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Simple Avatar Icons */}
            <div className={`p-2.5 rounded-xl ${message.role === 'bot' ? 'bg-slate-800 border border-white/10' : 'bg-slate-700 border border-white/10'}`}>
              {message.role === 'bot' ? (
                <Bot className="h-5 w-5 text-slate-300" />
              ) : (
                <User className="h-5 w-5 text-slate-300" />
              )}
            </div>

            <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block p-4 rounded-2xl max-w-[85%] ${
                  message.role === 'bot'
                    ? 'bg-white/5 backdrop-blur-lg border border-white/10 text-slate-200'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {message.content.startsWith('[IMAGE]') ? (
                  <div className="space-y-2">
                    <img
                      src={message.content.replace('[IMAGE] ', '')}
                      alt="Uploaded"
                      className="max-w-full rounded-lg border border-white/20 shadow-lg"
                    />
                    <p className="text-xs opacity-75">Image uploaded</p>
                  </div>
                ) : message.content.startsWith('[DOCUMENT]') ? (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="p-2 bg-indigo-500/30 rounded-lg">
                      <FileText className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.content.split(' | ')[1] || 'Document uploaded'}
                      </p>
                      <p className="text-xs opacity-75">Document uploaded</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-4">
            {/* Simple Bot Avatar */}
            <div className="p-2.5 rounded-xl bg-slate-800 border border-white/10">
              <Bot className="h-5 w-5 text-slate-300" />
            </div>
            {/* Simple Typing Indicator */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Professional Dark Style */}
      {conversationState.phase !== 'completed' && (
        <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-end gap-3">
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-agentic"
                disabled={loading || isUploading}
              />
              <label htmlFor="file-upload-agentic">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/10 bg-slate-800 hover:bg-slate-700 transition-all"
                  disabled={loading || isUploading}
                  asChild
                >
                  <div className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    ) : (
                      <Paperclip className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                </Button>
              </label>
            </div>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 bg-slate-800 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />

            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* Powered by IntakeOS Branding */}
          <div className="text-center py-3 mt-3 border-t border-white/5">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Powered by IntakeOS
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
