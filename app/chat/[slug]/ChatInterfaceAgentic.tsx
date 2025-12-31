'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, User, Bot, Sparkles, Loader2, AlertCircle, CheckCircle, FileText, RotateCcw, Check } from 'lucide-react';
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

export function ChatInterfaceAgentic({
  bot,
  businessName,
  simulatorMode = false
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSimulationResult, setShowSimulationResult] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate progress based on gathered vs missing info
  const totalInfo = Object.keys(bot.schema.required_info).length;
  const gatheredCount = Object.keys(conversationState.gathered_information).length;
  const progress = totalInfo > 0 ? (gatheredCount / totalInfo) * 100 : 0;

  // Use effective business name for display
  const effectiveBusinessName = businessName || bot.name || 'The business';

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
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Background with subtle grid pattern */}
      <div className="absolute inset-0 bg-slate-950 rounded-3xl opacity-5">
        <div className="bg-grid-pattern w-full h-full" />
      </div>

      {/* Aurora orbs for depth - very subtle */}
      <div className="aurora-orb aurora-orb-1" style={{ opacity: 0.08 }} />
      <div className="aurora-orb aurora-orb-2" style={{ opacity: 0.05 }} />
      <div className="aurora-orb aurora-orb-3" style={{ opacity: 0.06 }} />

      <Card className="relative w-full h-[700px] flex flex-col shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/5 bg-slate-950/90 backdrop-blur-xl overflow-hidden">

        {/* Ultra-thin progress line at very top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-900">
          <div
            className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimalist Header - Centered */}
        <div className="p-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center justify-center gap-3">
            {/* Live Badge with pulsing dot */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
            </div>

            {/* Business Name - Centered & Prominent */}
            <h3 className="text-2xl font-semibold text-white tracking-tight">
              {effectiveBusinessName}
            </h3>

            {simulatorMode && (
              <span className="px-2 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-md">
                Test Drive
              </span>
            )}
          </div>
        </div>

      {/* Messages - Minimalist Luxury */}
      <div className={`flex-1 overflow-y-auto p-8 space-y-10 bg-slate-950 transition-opacity duration-500 ${conversationState.phase === 'completed' ? 'opacity-50' : 'opacity-100'}`}>
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-slate-500 text-sm font-light">Start a conversation</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Text label instead of avatar */}
            <span className="text-[11px] text-slate-500 font-medium mb-2 px-1 tracking-wide">
              {message.role === 'bot' ? 'Consultant' : 'You'}
            </span>

            <div className={`max-w-[75%]`}>
              <div
                className={`p-5 ${
                  message.role === 'bot'
                    ? 'rounded-3xl rounded-bl-none bg-slate-900/50 backdrop-blur-2xl text-slate-200 text-[15px] leading-relaxed'
                    : 'rounded-3xl rounded-br-none bg-indigo-600 text-white text-[15px]'
                }`}
              >
                {message.content.startsWith('[IMAGE]') ? (
                  <div className="relative space-y-2 p-4 bg-white/5 rounded-lg border border-white/10 shadow-xl">
                    {/* Polaroid style image */}
                    <img
                      src={message.content.replace('[IMAGE] ', '')}
                      alt="Uploaded"
                      className="w-full rounded-md border-4 border-white/20 shadow-lg"
                    />
                    {/* Check badge */}
                    <div className="absolute top-2 right-2 p-1.5 bg-emerald-500 rounded-full shadow-lg">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-xs text-slate-400 text-center pt-2">Image processed by AI</p>
                  </div>
                ) : message.content.startsWith('[DOCUMENT]') ? (
                  <div className="relative flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 shadow-xl">
                    <div className="p-2.5 bg-indigo-500/20 rounded-lg">
                      <FileText className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {message.content.split(' | ')[1] || 'Document uploaded'}
                      </p>
                      <p className="text-xs text-slate-400">Document processed by AI</p>
                    </div>
                    {/* Check badge */}
                    <div className="p-1.5 bg-emerald-500 rounded-full shadow-lg">
                      <Check className="h-3 w-3 text-white" />
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
          <div className="flex flex-col items-start">
            <span className="text-[11px] text-slate-500 font-medium mb-2 px-1 tracking-wide">
              Consultant
            </span>
            <div className="bg-slate-900/50 backdrop-blur-2xl p-5 rounded-3xl rounded-bl-none">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                <span className="text-sm text-slate-400 font-light">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Simulation Result Card */}
        {showSimulationResult && simulationData && (
          <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-2xl backdrop-blur-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Simulation Complete!</h3>
            </div>

            <div className="space-y-4">
              {/* What Business Owner Will Receive */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h4 className="text-sm font-bold text-cyan-300 mb-3">What the Business Owner Will Receive:</h4>
                <div className="space-y-2">
                  {Object.entries(simulationData.gatheredInfo).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 p-2 bg-black/20 rounded-lg">
                      <span className="text-xs font-mono text-slate-400 min-w-[120px]">{key}:</span>
                      <span className="text-sm text-white flex-1">{String(value)}</span>
                    </div>
                  ))}
                  {simulationData.uploadedFiles?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs font-bold text-slate-400 mb-2 block">Uploaded Files:</span>
                      {simulationData.uploadedFiles.map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg mb-2">
                          <FileText className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm text-white">{file.filename}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* JSON Preview */}
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                <h4 className="text-sm font-bold text-cyan-300 mb-2">JSON Payload:</h4>
                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                  {JSON.stringify(simulationData.gatheredInfo, null, 2)}
                </pre>
              </div>

              {/* Automation Status */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl">
                <h4 className="text-sm font-bold text-emerald-300 mb-2">Automation Status:</h4>
                <div className="flex items-center gap-2 text-sm text-emerald-200">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Webhook would have fired with this data</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  In live mode, this data would be sent to your configured integrations and notification email.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submission Success Card - HIDDEN (using new celebratory completion state below instead) */}
        {submissionComplete && simulatorMode && (
          <div className="w-full p-8 bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50 rounded-2xl backdrop-blur-lg animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Success Icon */}
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full shadow-lg animate-in zoom-in duration-300">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  ✅ Test Drive Complete!
                </h3>
                <p className="text-base text-emerald-100 max-w-md mx-auto">
                  Check out the simulation results above to see what data was collected.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input - Minimalist Messaging Style */}
      {conversationState.phase !== 'completed' && (
        <div className="relative p-6 border-t border-white/5 bg-transparent">
          {/* Processing Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-sm font-light text-white">Processing...</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* File Upload - Minimal */}
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
                <button
                  className="p-2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-30"
                  disabled={loading || isUploading}
                  type="button"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>
              </label>
            </div>

            {/* Transparent Input */}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              disabled={loading}
              className="flex-1 bg-transparent border-0 border-b border-white/10 rounded-none text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-[15px] font-light"
            />

            {/* Ghost Reset Button */}
            <button
              onClick={handleResetConversation}
              disabled={loading || messages.length === 0}
              className="p-2 text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-20"
              title="Reset conversation"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Send Button - Minimal */}
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-30 h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Subtle Branding */}
          <div className="text-center pt-4">
            <p className="text-[9px] text-slate-600 font-light tracking-widest">
              POWERED BY INTAKEOS
            </p>
          </div>
        </div>
      )}

      {/* Floating Success Overlay - Cinematic */}
      {conversationState.phase === 'completed' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-700">
          <div className="bg-slate-900/90 border border-emerald-500/20 rounded-3xl p-12 max-w-md shadow-2xl shadow-emerald-500/10 animate-in zoom-in duration-700">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Large Floating CheckCircle Icon */}
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl" />
                <div className="relative p-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full">
                  <CheckCircle className="h-20 w-20 text-white" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  Intake Finalized
                </h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  {effectiveBusinessName} has received your details and will be in touch shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </Card>
    </div>
  );
}
