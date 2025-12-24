'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Send, Paperclip, User, Bot, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { uploadFile } from '@/lib/supabase';
import { formatPhoneNumber, validateEmail, validatePhone, parseBudget } from '@/lib/validation';

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
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string>('');
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

  // --- LOGIC HELPERS ---
  const generateAIQuestion = async (field: any, previousAnswer: string) => {
    try {
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
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
      return `What is your ${field.label}?`;
    }
  };

  const handleInputChange = (value: string) => {
    setValidationError(''); // Clear errors on new input

    // Apply field-specific formatting
    if (currentField.type === 'phone') {
      setInput(formatPhoneNumber(value));
    } else {
      setInput(value);
    }
  };

  const validateInput = (): boolean => {
    if (!input.trim()) {
      setValidationError('This field is required');
      return false;
    }

    // Email validation
    if (currentField.type === 'email') {
      const result = validateEmail(input);
      if (!result.valid) {
        setValidationError(result.message || 'Invalid email');
        return false;
      }
    }

    // Phone validation
    if (currentField.type === 'phone') {
      const result = validatePhone(input);
      if (!result.valid) {
        setValidationError(result.message || 'Invalid phone number');
        return false;
      }
    }

    return true;
  };

  const handleSend = async (overrideInput?: string) => {
    const valueToSend = overrideInput !== undefined ? overrideInput : input;
    if (!valueToSend?.trim()) return;

    // Validate input for non-override sends (typed inputs)
    if (overrideInput === undefined && !validateInput()) {
      return; // Validation failed, don't submit
    }

    // Parse budget if it's a budget/number field
    let processedValue = valueToSend;
    if (currentField.type === 'number' &&
        (currentField.label?.toLowerCase().includes('budget') ||
         currentField.label?.toLowerCase().includes('price') ||
         currentField.label?.toLowerCase().includes('cost'))) {
      const parsed = parseBudget(valueToSend);
      processedValue = parsed.value; // Store the formatted value
    }

    setInput('');
    setValidationError('');
    setMessages(prev => [...prev, { role: 'user', content: processedValue }]);
    setLoading(true);

    try {
      const newData = { ...collectedData, [currentField.id]: processedValue };
      setCollectedData(newData);

      if (currentFieldIndex < bot.schema.length - 1) {
        const nextField = bot.schema[currentFieldIndex + 1];
        const nextQuestion = await generateAIQuestion(nextField, valueToSend);
        
        setCurrentFieldIndex(prev => prev + 1);
        setMessages(prev => [...prev, { role: 'bot', content: nextQuestion }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "Perfect! wrapping up..." }]);
        await handleSubmit(newData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (finalData: any) => {
    try {
      const response = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: bot.id, data: finalData, conversation: messages }),
      });
      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { role: 'bot', content: `✅ All done! Reference #${result.submissionId.slice(0, 8)}.` }]);
      }
    } catch (error) {}
  };

  // --- RENDER INPUT HELPERS ---
  const renderInput = () => {
    if (loading || currentFieldIndex >= bot.schema.length) return null;

    return (
      <div key={currentField.id} className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {(() => {
          switch (currentField.type) {
            case 'select':
              return (
                <div className="flex flex-wrap gap-2 justify-end">
                  {currentField.options?.map((option: string) => (
                    <Button
                      key={option}
                      variant="outline"
                      className="rounded-full px-6 py-4 border-indigo-200 bg-white/50 backdrop-blur hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all text-sm"
                      onClick={() => handleSend(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              );
            case 'date':
              return (
                <div className="flex gap-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100">
                  <Input
                    type="date"
                    className="flex-1 border-none focus-visible:ring-0 shadow-none"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    autoFocus
                  />
                  <Button onClick={() => handleSend()} disabled={!input} className="bg-indigo-600 rounded-lg">Confirm</Button>
                </div>
              );
            case 'file_upload':
              return (
                <div className="space-y-3">
                  <div className="relative p-8 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsUploading(true);
                        const publicUrl = await uploadFile(file);
                        setIsUploading(false);

                        if (publicUrl) {
                          // Send URL with special tag [IMAGE]
                          handleSend(`[IMAGE] ${publicUrl}`); 
                        } else {
                          alert('Failed to upload image. Please try again.');
                        }
                      }} 
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center text-indigo-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm font-medium">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Paperclip className="mx-auto h-8 w-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-medium text-indigo-900">
                          Tap to Upload {currentField.label}
                        </p>
                        <p className="text-xs text-indigo-400 mt-1">JPG, PNG, PDF up to 5MB</p>
                      </>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-400" 
                    onClick={() => handleSend("Skipped")}
                    disabled={isUploading}
                  >
                    Skip
                  </Button>
                </div>
              );
            default: // Text, Phone, Email
              return (
                <div className="w-full space-y-2">
                  <div className={`flex gap-2 bg-white p-1.5 rounded-full shadow-xl shadow-indigo-500/10 border ${validationError ? 'border-red-300' : 'border-slate-100'} items-center`}>
                    <Input
                      type={currentField.type === 'phone' ? 'tel' : currentField.type === 'email' ? 'email' : 'text'}
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !validationError && handleSend()}
                      placeholder={`Type your answer...`}
                      className="border-none shadow-none focus-visible:ring-0 px-4 bg-transparent text-base"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || !!validationError}
                      size="icon"
                      className="rounded-full bg-indigo-600 hover:bg-indigo-700 w-10 h-10 shrink-0 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  {validationError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 px-4 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationError}</span>
                    </div>
                  )}
                </div>
              );
          }
        })()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto md:justify-center font-sans">
      {/* Glass Header */}
      <Card className="mb-6 border-none shadow-sm bg-white/60 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700 tracking-wide">{bot.name}</span>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-white/50 px-2 py-1 rounded-full border border-slate-100">
            {Math.round(progress)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <Progress 
            value={progress} 
            className="h-0.5 bg-transparent [&>div]:bg-indigo-500" 
        />
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 p-4 scrollbar-hide pb-32">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
              message.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-white border border-slate-100'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-600" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed tracking-wide ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-indigo-500/20'
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'
            }`}>
              {/* ✅ LOGIC: Render image if content starts with [IMAGE] */}
              {message.content.startsWith('[IMAGE] ') ? (
                <div>
                  <img 
                    src={message.content.replace('[IMAGE] ', '')} 
                    alt="Uploaded" 
                    className="max-w-full rounded-lg border border-white/20"
                    style={{ maxHeight: '200px' }} 
                  />
                  <span className="text-xs opacity-70 mt-1 block">Image uploaded</span>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-in fade-in duration-300 pl-1">
             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /></div>
             <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50/90 via-slate-50/50 to-transparent backdrop-blur-[2px] md:static md:bg-none">
        <div className="max-w-2xl mx-auto pb-4 md:pb-0">
          {renderInput()}
        </div>
      </div>
    </div>
  );
}