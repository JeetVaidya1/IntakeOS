'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type Message = {
  role: 'bot' | 'user';
  content: string;
};

type Bot = {
  id: string;
  name: string;
  schema: any[];
};

export function ChatInterface({ bot }: { bot: Bot }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      content: `Hi there! 👋 I'm here to help you get a quote from ${bot.name}. This will only take about 2 minutes, and you'll hear back within 24 hours.\n\nReady? Let's get started!` 
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentField = bot.schema[currentFieldIndex];
  const progress = (currentFieldIndex / bot.schema.length) * 100;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ask first question on mount
  useEffect(() => {
    if (currentFieldIndex === 0 && messages.length === 1) {
      setTimeout(async () => {
        const firstQuestion = await generateAIQuestion(bot.schema[0], '');
        setMessages(prev => [...prev, { role: 'bot', content: firstQuestion }]);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateQuestion = (field: any, previousAnswer?: string) => {
    const questions: Record<string, string> = {
      text: `What's your ${field.label.toLowerCase()}?`,
      email: `What's your ${field.label.toLowerCase()}?`,
      phone: `What's your ${field.label.toLowerCase()}?`,
      address: `What's your ${field.label.toLowerCase()}?`,
      number: `What's your ${field.label.toLowerCase()}?`,
      date: `When would you like to schedule this?`,
      select: `What ${field.label.toLowerCase()} do you need?${field.options ? '\n\nOptions: ' + field.options.join(', ') : ''}`,
      file_upload: `Please upload ${field.label.toLowerCase()}.`,
    };

    return questions[field.type] || `Please provide your ${field.label.toLowerCase()}.`;
  };

  const generateAIQuestion = async (field: any, previousAnswer: string) => {
    try {
      // Build conversation context
      const conversationHistory = messages
        .slice(-4) // Last 4 messages for context
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
      // Fallback to simple question
      return generateQuestion(field, previousAnswer);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Save the data
      setCollectedData(prev => ({
        ...prev,
        [currentField.id]: userMessage,
      }));

      // Move to next question
      if (currentFieldIndex < bot.schema.length - 1) {
        // Generate next question using AI
        const nextField = bot.schema[currentFieldIndex + 1];
        const nextQuestion = await generateAIQuestion(nextField, userMessage);
        
        setCurrentFieldIndex(prev => prev + 1);
        setMessages(prev => [...prev, { role: 'bot', content: nextQuestion }]);
      } else {
        // All questions answered!
        setMessages(prev => [
          ...prev,
          { role: 'bot', content: "Perfect! Let me confirm everything..." },
        ]);
        setTimeout(() => {
          handleSubmit();
        }, 1000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "Sorry, something went wrong. Can you try that again?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
  try {
    // Save to database
    const response = await fetch('/api/submit-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: bot.id,
        data: collectedData,
        conversation: messages,
      }),
    });

    const result = await response.json();

    if (result.success) {
      setMessages(prev => [
        ...prev,
        { 
          role: 'bot', 
          content: `✅ All set! Your information has been submitted.\n\nReference #${result.submissionId.slice(0, 8)}\n\nThe team will be in touch within 24 hours. Thanks!` 
        },
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "❌ Oops! Something went wrong. Please try again or contact us directly." },
      ]);
    }
  } catch (error) {
    console.error('Submit error:', error);
    setMessages(prev => [
      ...prev,
      { role: 'bot', content: "❌ Oops! Something went wrong. Please try again or contact us directly." },
    ]);
  }
};

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Progress: {currentFieldIndex}/{bot.schema.length} fields
          </span>
          <span className="text-sm text-slate-500">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} />
      </Card>

      {/* Chat Messages */}
      <Card className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg px-4 py-2">
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
      </Card>

      {/* Input */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={loading || currentFieldIndex >= bot.schema.length}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim() || currentFieldIndex >= bot.schema.length}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}