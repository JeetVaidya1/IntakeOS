'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, User, Bot, Sparkles, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { uploadFile } from '@/lib/supabase';
import type { AgenticBotSchema, ConversationState } from '@/types/agentic';

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
  };

  const defaultMessages: Message[] = [
    {
      role: 'bot',
      content: `Hi there! 👋 I'm an assistant for ${businessName}. How can I help you today?`
    }
  ];

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
    if (messages.length > 1) return; // Already started

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
          messages: [{ role: 'bot', content: 'Starting conversation' }],
          currentState: conversationState,
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
      console.error('Failed to initiate conversation:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "Hmm, I'm having trouble connecting. Let me try again - what brings you here today?"
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
        // Submit the gathered information
        await handleSubmit(data.updated_state.gathered_information, newMessages);
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

      // Call agent to analyze and respond
      setLoading(true);

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

  const handleSubmit = async (gatheredInfo: Record<string, string>, conversation: Message[]) => {
    try {
      const response = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: bot.id,
          data: gatheredInfo,
          conversationTranscript: conversation,
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

  return (
    <Card className="w-full max-w-3xl mx-auto h-[600px] flex flex-col shadow-2xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
      {/* Header */}
      <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{bot.name}</h3>
              <p className="text-xs text-slate-600">Powered by AI</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-right">
            <p className="text-xs text-slate-600 mb-1">
              {gatheredCount} of {totalInfo} collected
            </p>
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`p-2 rounded-lg ${message.role === 'bot' ? 'bg-indigo-100' : 'bg-purple-100'}`}>
              {message.role === 'bot' ? (
                <Bot className="h-5 w-5 text-indigo-600" />
              ) : (
                <User className="h-5 w-5 text-purple-600" />
              )}
            </div>

            <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block p-3 rounded-2xl max-w-[80%] ${
                  message.role === 'bot'
                    ? 'bg-white border border-indigo-200 text-slate-900'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                }`}
              >
                {message.content.startsWith('[IMAGE]') ? (
                  <div className="space-y-2">
                    <img
                      src={message.content.replace('[IMAGE] ', '')}
                      alt="Uploaded"
                      className="max-w-full rounded-lg border-2 border-white/50"
                    />
                    <p className="text-xs opacity-75">Image uploaded</p>
                  </div>
                ) : message.content.startsWith('[DOCUMENT]') ? (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.content.split(' | ')[1] || 'Document uploaded'}
                      </p>
                      <p className="text-xs opacity-75">Document uploaded</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Bot className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="bg-white border border-indigo-200 p-3 rounded-2xl">
              <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - hide if completed */}
      {conversationState.phase !== 'completed' && (
        <div className="p-4 border-t border-purple-200 bg-white">
          <div className="flex items-end gap-2">
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
                  className="border-indigo-300 hover:bg-indigo-50"
                  disabled={loading || isUploading}
                  asChild
                >
                  <div className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    ) : (
                      <Paperclip className="h-5 w-5 text-indigo-600" />
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
              className="flex-1 border-indigo-300 focus:border-indigo-500"
            />

            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
