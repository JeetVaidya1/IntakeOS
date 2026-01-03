'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, Loader2, CheckCircle, FileText, RotateCcw, X } from 'lucide-react';
import type { AgenticBotSchema, BotDisplayMode } from '@/types/agentic';
import { useAgentChat } from '@/hooks/useAgentChat';
import { StandardForm } from './components/StandardForm';

type BotType = {
  id: string;
  name: string;
  schema: AgenticBotSchema;
  user_id: string;
  display_mode?: BotDisplayMode;
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
  const displayMode = bot.display_mode || 'chat';

  // If form mode, render StandardForm directly
  if (displayMode === 'form') {
    return (
      <StandardForm
        bot={bot}
        businessName={businessName || bot.name || 'The business'}
      />
    );
  }

  // Otherwise, render chat interface (only call hook when in chat mode)
  return <ChatInterfaceContent bot={bot} businessName={businessName} simulatorMode={simulatorMode} />;
}

function ChatInterfaceContent({
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
  } = useAgentChat({ bot, businessName, simulatorMode });

  // Calculate progress based on gathered vs missing info (UI calculation)
  const totalInfo = Object.keys(bot.schema.required_info).length;
  const gatheredCount = Object.keys(conversationState.gathered_information).length;
  const progress = totalInfo > 0 ? (gatheredCount / totalInfo) * 100 : 0;

  // Use business name - don't fall back to bot.name, as bot.name might be the purpose
  const effectiveBusinessName = businessName || 'The business';

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render chat interface
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <Card className="w-full h-[700px] flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden backdrop-blur-sm">

        {/* Beautiful Header with IntakeOS Branding */}
        <div className="px-6 py-6 border-b border-indigo-500/30 bg-gradient-to-r from-slate-900/80 via-indigo-950/40 to-slate-900/80 backdrop-blur-xl">
          <div className="flex flex-col gap-3">
            {/* IntakeOS Branding */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/50">
                I
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                IntakeOS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white">
                  {effectiveBusinessName}
                </h2>
                {bot.schema?.goal && (
                  <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                    {bot.schema.goal}
                  </p>
                )}
              </div>
              {simulatorMode && (
                <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white rounded-full shadow-lg shadow-indigo-500/50">
                  Test Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area with Dark Theme */}
        <div className={`flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 custom-scrollbar ${conversationState.phase === 'completed' ? 'opacity-60' : ''}`}>
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Start a conversation</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animation: 'fadeIn 0.3s ease-out' }}
              >
                <div className={`max-w-[75%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg ${
                      message.role === 'bot'
                        ? 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 text-slate-100 border border-indigo-500/30 rounded-tl-md shadow-indigo-500/10'
                        : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 text-white rounded-tr-md shadow-indigo-500/30'
                    }`}
                  >
                    {message.content.startsWith('[IMAGE]') ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-indigo-500/30 shadow-inner">
                          <img
                            src={message.content.replace('[IMAGE] ', '')}
                            alt="Uploaded"
                            className="w-full"
                          />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Image uploaded</p>
                      </div>
                    ) : message.content.startsWith('[DOCUMENT]') ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-indigo-500/30">
                        <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-lg border border-indigo-500/30">
                          <FileText className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-slate-100">
                            {message.content.split(' | ')[1] || 'Document uploaded'}
                          </p>
                          <p className="text-xs text-slate-400">Document uploaded</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-indigo-500/30 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg shadow-indigo-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-slate-300 font-medium">Typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Simulation Result Card with Dark Theme */}
          {showSimulationResult && simulationData && (
            <div className="p-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-indigo-500/40 rounded-2xl mx-6 mb-6 shadow-xl shadow-indigo-500/10">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-lg shadow-lg shadow-indigo-500/50">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Test Complete</h3>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-slate-900/80 border border-indigo-500/30 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-white mb-4">Collected Information:</h4>
                  <div className="space-y-2">
                    {Object.entries(simulationData.gatheredInfo).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-indigo-500/20">
                        <span className="text-xs font-semibold text-cyan-400 min-w-[120px] uppercase tracking-wide">{key}:</span>
                        <span className="text-sm text-slate-100 flex-1 font-medium">{String(value)}</span>
                      </div>
                    ))}
                    {simulationData.uploadedFiles?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-indigo-500/30">
                        <span className="text-xs font-bold text-cyan-400 mb-3 block uppercase tracking-wide">Uploaded Files:</span>
                        {simulationData.uploadedFiles.map((file: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-indigo-500/20 mb-2">
                            <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-lg border border-indigo-500/30">
                              <FileText className="h-4 w-4 text-cyan-400" />
                            </div>
                            <span className="text-sm text-slate-100 font-medium">{file.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-slate-900/80 border border-indigo-500/30 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-white mb-3">JSON Payload:</h4>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto bg-slate-950 text-slate-100 p-4 rounded-lg border border-indigo-500/20 shadow-inner">
                    {JSON.stringify(simulationData.gatheredInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area with Dark Theme */}
        {conversationState.phase !== 'completed' && (
          <div className="relative border-t border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 backdrop-blur-xl p-5">
            {/* Processing Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
                  <p className="text-sm font-medium text-slate-300">Processing...</p>
                </div>
              </div>
            )}

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 border border-indigo-500/30 rounded-lg"
                  >
                    <FileText className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-slate-200">{file.filename}</span>
                    <button
                      onClick={() => removePendingFile(index)}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* File Upload */}
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
                  className={`p-2.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 cursor-pointer inline-block transition-all ${
                    loading || isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </label>
              </div>

              {/* Input with Dark Theme Styling */}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 bg-slate-800/90 border-2 border-indigo-500/30 rounded-xl px-5 py-3 text-[15px] text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
              />

              {/* Reset Button */}
              {messages.length > 0 && (
                <button
                  onClick={resetConversation}
                  disabled={loading}
                  className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
                  title="Reset conversation"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              {/* Send Button with IntakeOS Brand Gradient */}
              <Button
                onClick={handleSend}
                disabled={loading || (!input.trim() && pendingFiles.length === 0)}
                size="default"
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/50 disabled:opacity-50 disabled:shadow-none transition-all font-medium"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Success Overlay with Dark Theme */}
        {conversationState.phase === 'completed' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/50 rounded-2xl p-10 max-w-md shadow-2xl shadow-emerald-500/20">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full shadow-lg shadow-emerald-500/50">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    Thank You!
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {effectiveBusinessName} has received your information and will be in touch soon.
                  </p>
                  {/* IntakeOS Branding Footer */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-700">
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      I
                    </div>
                    <span className="text-xs text-slate-400">Powered by IntakeOS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
