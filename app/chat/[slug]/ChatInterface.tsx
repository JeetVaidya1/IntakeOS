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
  const storageKey = `intakeOS_chat_${bot.id}`;

  // Always start with default values to avoid hydration mismatch
  const defaultMessages: Message[] = [
    {
      role: 'bot',
      content: `Hi there! 👋 I'm here to help you get a quote from ${bot.name}. Let's get started!`
    }
  ];

  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentField = bot.schema[currentFieldIndex];
  const progress = (currentFieldIndex / bot.schema.length) * 100;

  // Load from localStorage after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.currentFieldIndex !== undefined) setCurrentFieldIndex(parsed.currentFieldIndex);
        if (parsed.collectedData) setCollectedData(parsed.collectedData);
      }
    } catch (error) {
      console.error('Failed to load chat state:', error);
    }

    setIsHydrated(true);
  }, [storageKey]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        messages,
        currentFieldIndex,
        collectedData,
      }));
    } catch (error) {
      console.error('Failed to save chat state:', error);
    }
  }, [messages, currentFieldIndex, collectedData, storageKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initial Question - only ask if this is a fresh conversation
  useEffect(() => {
    // Wait for hydration to complete before asking initial question
    if (!isHydrated) return;

    if (currentFieldIndex === 0 && messages.length === 1) {
      // Check if this is a restored session
      const hasRestoredData = Object.keys(collectedData).length > 0;
      if (hasRestoredData) return; // Skip initial question if we restored from localStorage

      setTimeout(async () => {
        const firstQuestion = await generateAIQuestion(bot.schema[0], '');
        setMessages(prev => [...prev, { role: 'bot', content: firstQuestion }]);
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

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
        // Clear localStorage on successful submission
        try {
          localStorage.removeItem(storageKey);
        } catch (error) {
          console.error('Failed to clear chat state:', error);
        }

        const completionMessage = `✅ All done! I've sent everything to ${bot.name}.

You should hear back within 24 hours.

Reference: #${result.submissionId.slice(0, 8)}`;

        setMessages(prev => [...prev, { role: 'bot', content: completionMessage }]);

        // Add "Powered by" message after a short delay
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            content: '[POWERED_BY]' // Special marker for rendering
          }]);
        }, 1000);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '❌ Sorry, something went wrong. Please try again or contact support.'
      }]);
    }
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
                  {currentField.options?.map((option: string, idx: number) => {
                    const buttonColors = [
                      'hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 border-indigo-200',
                      'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 border-purple-200',
                      'hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 border-cyan-200',
                      'hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-500 border-orange-200',
                    ];
                    const colorClass = buttonColors[idx % buttonColors.length];

                    return (
                      <Button
                        key={option}
                        variant="outline"
                        className={`rounded-full px-6 py-4 ${colorClass} glass-vibrant hover:text-white hover:border-transparent hover:shadow-lg transition-all text-sm font-medium hover:scale-105`}
                        onClick={() => handleSend(option)}
                      >
                        {option}
                      </Button>
                    );
                  })}
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

                        // Step 1: Upload file to storage
                        const publicUrl = await uploadFile(file);

                        if (!publicUrl) {
                          setIsUploading(false);
                          alert('Failed to upload image. Please try again.');
                          return;
                        }

                        // Step 2: Show user's uploaded image
                        setMessages(prev => [...prev, { role: 'user', content: `[IMAGE] ${publicUrl}` }]);

                        // Step 3: Analyze image with GPT-4 Vision
                        setLoading(true);
                        try {
                          const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
                          const analysisResponse = await fetch('/api/analyze-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              imageUrl: publicUrl,
                              businessName: bot.name,
                              fieldLabel: currentField.label,
                              conversationHistory,
                            }),
                          });

                          const analysisResult = await analysisResponse.json();

                          if (analysisResult.success && analysisResult.analysis) {
                            // Step 4: Show AI's visual analysis
                            setMessages(prev => [...prev, {
                              role: 'bot',
                              content: analysisResult.analysis
                            }]);
                          } else {
                            // Fallback if analysis fails
                            setMessages(prev => [...prev, {
                              role: 'bot',
                              content: `Got it! I've received your ${currentField.label}. Let me continue with the next question.`
                            }]);
                          }
                        } catch (error) {
                          console.error('Image analysis error:', error);
                          setMessages(prev => [...prev, {
                            role: 'bot',
                            content: `Thanks for uploading that! Let me continue with the next question.`
                          }]);
                        } finally {
                          setIsUploading(false);
                          setLoading(false);
                        }

                        // Step 5: Store the image URL and move to next field
                        const newData = { ...collectedData, [currentField.id]: `[IMAGE] ${publicUrl}` };
                        setCollectedData(newData);

                        if (currentFieldIndex < bot.schema.length - 1) {
                          const nextField = bot.schema[currentFieldIndex + 1];
                          const nextQuestion = await generateAIQuestion(nextField, `[IMAGE] ${publicUrl}`);

                          setCurrentFieldIndex(prev => prev + 1);
                          setMessages(prev => [...prev, { role: 'bot', content: nextQuestion }]);
                        } else {
                          setMessages(prev => [...prev, { role: 'bot', content: "Perfect! wrapping up..." }]);
                          await handleSubmit(newData);
                        }
                      }} 
                    />
                    
                    {isUploading || loading ? (
                      <div className="flex flex-col items-center text-indigo-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm font-medium">
                          {isUploading ? 'Uploading...' : 'Analyzing image...'}
                        </p>
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
                  <div className={`flex gap-2 glass-vibrant p-2 rounded-full shadow-xl border-2 ${validationError ? 'border-red-300 shadow-red-500/20' : 'border-purple-200 shadow-purple-500/20'} items-center`}>
                    <Input
                      type={currentField.type === 'phone' ? 'tel' : currentField.type === 'email' ? 'email' : 'text'}
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !validationError && handleSend()}
                      placeholder={`Type your answer...`}
                      className="border-none shadow-none focus-visible:ring-0 px-4 bg-transparent text-base font-medium"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || !!validationError}
                      size="icon"
                      className="rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 w-12 h-12 shrink-0 disabled:opacity-50 shadow-lg shadow-indigo-500/30 animate-gradient"
                    >
                      <Send className="h-5 w-5 text-white" />
                    </Button>
                  </div>
                  {validationError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 px-4 animate-in fade-in slide-in-from-top-1 bg-red-50 border border-red-200 rounded-lg py-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{validationError}</span>
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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto md:justify-center font-sans relative">
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-40"></div>

      {/* Glass Header */}
      <Card className="mb-6 border-2 border-purple-200/50 shadow-lg shadow-purple-500/10 glass-vibrant sticky top-0 z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-wide">{bot.name}</span>
          </div>
          <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent px-3 py-1.5 rounded-full border-2 border-purple-200 bg-white/80">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Enhanced Progress Bar */}
        <Progress
            value={progress}
            className="h-1 bg-gradient-to-r from-slate-100 to-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:via-purple-500 [&>div]:to-pink-500 [&>div]:animate-gradient"
        />
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 p-4 scrollbar-hide pb-32">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient shadow-indigo-500/50'
                : 'bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 shadow-purple-500/20'
            }`}>
              {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent" strokeWidth={2.5} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg text-[15px] leading-relaxed ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-tr-sm shadow-purple-500/30 animate-gradient'
                : message.content === '[POWERED_BY]'
                ? 'glass-vibrant border-2 border-purple-200 shadow-purple-500/10'
                : 'glass-vibrant border-2 border-indigo-200/50 text-slate-700 rounded-tl-sm shadow-indigo-500/10'
            }`}>
              {/* Render "Powered by" section */}
              {message.content === '[POWERED_BY]' ? (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500 mb-2">
                    This bot was built with
                  </p>
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    IntakeOS
                  </a>
                  <p className="text-xs text-slate-500 mt-2">
                    Build your own in 30 seconds →
                  </p>
                </div>
              ) : message.content.startsWith('[IMAGE] ') ? (
                /* Render image */
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
                /* Regular text with line breaks */
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-in fade-in duration-300 pl-1">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 flex items-center justify-center shadow-lg shadow-purple-500/20">
               <Sparkles className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent animate-pulse" strokeWidth={2.5} />
             </div>
             <div className="glass-vibrant border-2 border-indigo-200/50 rounded-2xl rounded-tl-none px-5 py-4 shadow-lg shadow-indigo-500/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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