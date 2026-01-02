'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, Loader2, CheckCircle, FileText, RotateCcw } from 'lucide-react';
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
      <Card className="w-full h-[700px] flex flex-col bg-gradient-to-br from-white via-white to-slate-50/40 border-2 border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden backdrop-blur-sm">

        {/* Beautiful Header with Gradient */}
        <div className="px-6 py-6 border-b border-slate-200/60 bg-gradient-to-r from-white via-slate-50/30 to-white">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  {effectiveBusinessName}
                </h2>
                {bot.schema?.goal && (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {bot.schema.goal}
                  </p>
                )}
              </div>
              {simulatorMode && (
                <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-sm">
                  Test Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area with Subtle Pattern */}
        <div className={`flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/60 custom-scrollbar ${conversationState.phase === 'completed' ? 'opacity-60' : ''}`}>
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-medium">Start a conversation</p>
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
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.role === 'bot'
                        ? 'bg-white text-slate-900 border border-slate-200/60 rounded-tl-md shadow-slate-100'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-md shadow-blue-200'
                    }`}
                  >
                    {message.content.startsWith('[IMAGE]') ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                          <img
                            src={message.content.replace('[IMAGE] ', '')}
                            alt="Uploaded"
                            className="w-full"
                          />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Image uploaded</p>
                      </div>
                    ) : message.content.startsWith('[DOCUMENT]') ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-slate-900">
                            {message.content.split(' | ')[1] || 'Document uploaded'}
                          </p>
                          <p className="text-xs text-slate-500">Document uploaded</p>
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
                <div className="bg-white border border-slate-200/60 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">Typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Simulation Result Card with Better Design */}
          {showSimulationResult && simulationData && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl mx-6 mb-6 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Test Complete</h3>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Collected Information:</h4>
                  <div className="space-y-2">
                    {Object.entries(simulationData.gatheredInfo).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-600 min-w-[120px] uppercase tracking-wide">{key}:</span>
                        <span className="text-sm text-slate-900 flex-1 font-medium">{String(value)}</span>
                      </div>
                    ))}
                    {simulationData.uploadedFiles?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-600 mb-3 block uppercase tracking-wide">Uploaded Files:</span>
                        {simulationData.uploadedFiles.map((file: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-slate-900 font-medium">{file.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">JSON Payload:</h4>
                  <pre className="text-xs text-slate-700 font-mono overflow-x-auto bg-slate-900 text-slate-100 p-4 rounded-lg border border-slate-700 shadow-inner">
                    {JSON.stringify(simulationData.gatheredInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area with Elegant Design */}
        {conversationState.phase !== 'completed' && (
          <div className="relative border-t border-slate-200/60 bg-gradient-to-r from-white via-slate-50/50 to-white p-5">
            {/* Processing Overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
                  <p className="text-sm font-medium text-slate-600">Processing...</p>
                </div>
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
                  className={`p-2.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer inline-block transition-all ${
                    loading || isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </label>
              </div>

              {/* Input with Better Styling */}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-5 py-3 text-[15px] placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              />

              {/* Reset Button */}
              {messages.length > 0 && (
                <button
                  onClick={resetConversation}
                  disabled={loading}
                  className="p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
                  title="Reset conversation"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              {/* Send Button with Gradient */}
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="default"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all font-medium"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Success Overlay with Beautiful Design */}
        {conversationState.phase === 'completed' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-white/95 via-slate-50/95 to-white/95 backdrop-blur-sm">
            <div className="bg-white border-2 border-green-200 rounded-2xl p-10 max-w-md shadow-2xl shadow-green-500/10">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Thank You!
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {effectiveBusinessName} has received your information and will be in touch soon.
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
