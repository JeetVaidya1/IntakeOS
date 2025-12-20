'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Send, Paperclip, User, Bot } from 'lucide-react';

type Message = {
  role: 'bot' | 'user';
  content: string;
};

type BotType = {
  id: string;
  name: string;
  schema: any[];
};

export function ChatInterface({ bot }: { bot: BotType }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      content: `Hi there! 👋 I'm here to help you get a quote from ${bot.name}. Let's get started!` 
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentField = bot.schema[currentFieldIndex];
  const progress = (currentFieldIndex / bot.schema.length) * 100;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial Question
  useEffect(() => {
    if (currentFieldIndex === 0 && messages.length === 1) {
      setTimeout(async () => {
        const firstQuestion = await generateAIQuestion(bot.schema[0], '');
        setMessages(prev => [...prev, { role: 'bot', content: firstQuestion }]);
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAIQuestion = async (field: any, previousAnswer: string) => {
    try {
      const conversationHistory = messages
        .slice(-4)
        .map(m => `${m.role === 'bot' ? 'Assistant' : 'User'}: ${m.content}`)
        .join('\n');

      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: bot.name,
          field,
          previousAnswer,
          conversationHistory,
          isFirstQuestion: currentFieldIndex === 0,
        }),
      });

      const data = await response.json();
      return data.question;
    } catch (error) {
      console.error('Failed to generate AI question:', error);
      return `What is your ${field.label}?`;
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const valueToSend = overrideInput !== undefined ? overrideInput : input;
    if (!valueToSend?.trim()) return;

    // 1. Update UI immediately
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: valueToSend }]);
    setLoading(true);

    try {
      // 2. Persist Data Locally
      const newData = { ...collectedData, [currentField.id]: valueToSend };
      setCollectedData(newData);

      // 3. Move to Next Step
      if (currentFieldIndex < bot.schema.length - 1) {
        const nextField = bot.schema[currentFieldIndex + 1];
        const nextQuestion = await generateAIQuestion(nextField, valueToSend);
        
        setCurrentFieldIndex(prev => prev + 1);
        setMessages(prev => [...prev, { role: 'bot', content: nextQuestion }]);
      } else {
        // 4. Submit Final
        setMessages(prev => [
          ...prev,
          { role: 'bot', content: "Perfect! Submitting your info..." },
        ]);
        await handleSubmit(newData); // Pass the fresh data directly
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (finalData: any) => {
    try {
      const response = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: bot.id,
          data: finalData,
          conversation: messages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'bot', 
            content: `✅ All set! I've sent your details to the team. Reference #${result.submissionId.slice(0, 8)}.` 
          },
        ]);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "❌ Something went wrong saving your data. Please try again." },
      ]);
    }
  };

  // --- RENDER INPUT HELPERS ---
  const renderInput = () => {
    if (loading || currentFieldIndex >= bot.schema.length) return null;

    // KEY FIX: The key={currentField.id} forces React to reset this component when the field changes
    return (
      <div key={currentField.id} className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {(() => {
          switch (currentField.type) {
            case 'select':
              return (
                <div className="flex flex-wrap gap-2">
                  {currentField.options?.map((option: string) => (
                    <Button
                      key={option}
                      variant="outline"
                      className="rounded-full border-indigo-200 hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 transition-all"
                      onClick={() => handleSend(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              );

            case 'date':
              return (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    className="flex-1 bg-white border-slate-200"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    autoFocus
                  />
                  <Button onClick={() => handleSend()} disabled={!input}>Next</Button>
                </div>
              );

            case 'file_upload':
              return (
                <div className="space-y-3">
                  <div className="relative p-8 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSend(`[File: ${file.name}]`);
                      }}
                    />
                    <div className="group-hover:scale-105 transition-transform duration-200">
                      <Paperclip className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
                      <p className="text-sm font-medium text-indigo-900">Tap to Upload {currentField.label}</p>
                      <p className="text-xs text-indigo-400 mt-1">Images or PDFs</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-400 hover:text-slate-600"
                    onClick={() => handleSend("Skipped")}
                  >
                    Skip this step
                  </Button>
                </div>
              );

            // 👇 NEW: Explicit Phone Handler
            case 'phone':
              return (
                <div className="flex gap-2 shadow-sm rounded-lg p-1 bg-white border border-slate-200">
                  <Input
                    type="tel"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="555-0123"
                    className="border-none shadow-none focus-visible:ring-0"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              );

            // 👇 NEW: Explicit Email Handler
            case 'email':
              return (
                <div className="flex gap-2 shadow-sm rounded-lg p-1 bg-white border border-slate-200">
                  <Input
                    type="email"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="name@example.com"
                    className="border-none shadow-none focus-visible:ring-0"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              );

            // Default Text Handler
            default: 
              return (
                <div className="flex gap-2 shadow-sm rounded-lg p-1 bg-white border border-slate-200">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Type your answer...`}
                    className="border-none shadow-none focus-visible:ring-0"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              );
          }
        })()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto md:justify-center">
      {/* Header Progress */}
      <Card className="mb-6 border-none shadow-none bg-transparent">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider bg-indigo-100 px-2 py-1 rounded">
            {bot.name}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-1.5 bg-slate-100" />
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-6 p-2 scrollbar-hide pb-32">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Avatars */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-slate-200'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-indigo-600" />
              )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-in fade-in duration-300">
             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
               <Bot className="w-4 h-4 text-indigo-600" />
             </div>
             <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-0"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent backdrop-blur-sm md:static md:bg-none">
        <div className="max-w-2xl mx-auto">
          {renderInput()}
        </div>
      </div>
    </div>
  );
}