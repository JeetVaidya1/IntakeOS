'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, Sparkles, Loader2, CheckCircle, FileText, RotateCcw, Check } from 'lucide-react';
import type { AgenticBotSchema } from '@/types/agentic';
import { useAgentChat } from '@/hooks/useAgentChat';
import { StandardForm } from './components/StandardForm';

type BotType = {
  id: string;
  name: string;
  schema: AgenticBotSchema;
  user_id: string;
  display_mode?: 'chat' | 'form' | 'hybrid';
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
  const {
    messages,
    input,
    setInput,
    handleSend,
    handleFileUpload,
    loading,
    isUploading,
    conversationState,
    isSubmitting,
    submissionComplete,
    resetConversation,
    messagesEndRef,
    showSimulationResult,
    simulationData,
    isChatActive,
    activateChat,
    displayMode,
  } = useAgentChat({ bot, businessName, simulatorMode });

  const [formSubmissionComplete, setFormSubmissionComplete] = useState(false);

  // Calculate progress based on gathered vs missing info (UI calculation)
  const totalInfo = Object.keys(bot.schema.required_info).length;
  const gatheredCount = Object.keys(conversationState.gathered_information).length;
  const progress = totalInfo > 0 ? (gatheredCount / totalInfo) * 100 : 0;

  // Use effective business name for display
  const effectiveBusinessName = businessName || bot.name || 'The business';

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle form submission (for 'form' mode)
  const handleFormSubmit = async (formData: Record<string, string>) => {
    try {
      const response = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: bot.id,
          data: formData,
          conversation: [],
          uploadedFiles: [],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormSubmissionComplete(true);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit form. Please try again.');
    }
  };

  // Handle hybrid mode activation
  const handleHybridActivate = (formData: Record<string, string>) => {
    activateChat(formData);
  };

  // Render form mode completion
  if (displayMode === 'form' && formSubmissionComplete) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Thank You!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Your submission has been received. We'll be in touch soon.
          </p>
        </div>
      </Card>
    );
  }

  // Render form or chat interface with smooth transitions
  return (
    <AnimatePresence mode="wait">
      {!isChatActive && (displayMode === 'form' || displayMode === 'hybrid') ? (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <StandardForm
            bot={bot}
            businessName={effectiveBusinessName}
            mode={displayMode}
            onSubmit={handleFormSubmit}
            onHybridActivate={handleHybridActivate}
          />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-4xl mx-auto"
        >
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
              <label
                htmlFor="file-upload-agentic"
                className={`p-2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer inline-block ${
                  loading || isUploading ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
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
              onClick={resetConversation}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
