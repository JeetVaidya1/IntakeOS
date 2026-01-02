'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { AgenticBotSchema, BotDisplayMode } from '@/types/agentic';

type BotType = {
  id: string;
  name: string;
  schema: AgenticBotSchema;
  user_id: string;
  display_mode?: BotDisplayMode;
};

interface StandardFormProps {
  bot: BotType;
  businessName: string;
  mode: BotDisplayMode;
  onSubmit?: (formData: Record<string, string>) => void;
  onHybridActivate?: (formData: Record<string, string>) => void;
}

export function StandardForm({ 
  bot, 
  businessName, 
  mode, 
  onSubmit,
  onHybridActivate 
}: StandardFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiredInfo = bot.schema.required_info;
  const fields = Object.entries(requiredInfo);

  // Get basic fields that are commonly shown first (name, email, problem/description)
  const basicFields = fields.filter(([key]) => 
    ['name', 'email', 'problem', 'description', 'issue', 'query'].some(
      common => key.toLowerCase().includes(common)
    )
  );

  // Other fields
  const otherFields = fields.filter(([key]) => 
    !basicFields.some(([bk]) => bk === key)
  );

  // Prioritize: basic fields first, then others
  const orderedFields = [...basicFields, ...otherFields].slice(0, 5); // Limit to 5 fields for form

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    orderedFields.forEach(([key, info]) => {
      if (info.critical && (!formData[key] || formData[key].trim() === '')) {
        newErrors[key] = `This field is required`;
      }
      
      // Email validation
      if (info.type === 'email' && formData[key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[key])) {
          newErrors[key] = 'Please enter a valid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'hybrid' && onHybridActivate) {
        // Hybrid mode: activate chat with form data
        onHybridActivate(formData);
      } else if (mode === 'form' && onSubmit) {
        // Form mode: submit directly
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling can be added here
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputType = (info: { type?: string; description: string }) => {
    if (info.type) {
      if (info.type === 'email') return 'email';
      if (info.type === 'phone') return 'tel';
      if (info.type === 'number') return 'number';
      if (info.type === 'date') return 'date';
      if (info.type === 'url') return 'url';
    }
    return 'text';
  };

  const getPlaceholder = (info: { example?: string; description: string }) => {
    return info.example || info.description || '';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {businessName || bot.name}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Please fill out the form below to get started
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {orderedFields.map(([key, info]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {info.description}
                {info.critical && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <Input
                id={key}
                type={getInputType(info)}
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={getPlaceholder(info)}
                className={errors[key] ? 'border-red-500 focus-visible:ring-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors[key] && (
                <p className="text-sm text-red-500">{errors[key]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {mode === 'hybrid' ? 'Starting conversation...' : 'Submitting...'}
              </>
            ) : (
              mode === 'hybrid' ? 'Continue with AI Assistant' : 'Submit'
            )}
          </Button>
        </div>

        {/* Helper Text */}
        {mode === 'hybrid' && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
            After submitting, you'll be connected with our AI assistant for a personalized consultation.
          </p>
        )}
      </form>
    </Card>
  );
}
