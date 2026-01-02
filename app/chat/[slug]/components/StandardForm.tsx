'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import type { AgenticBotSchema } from '@/types/agentic';

type BotType = {
  id: string;
  name: string;
  schema: AgenticBotSchema;
  user_id: string;
};

interface StandardFormProps {
  bot: BotType;
  businessName: string;
}

export function StandardForm({ 
  bot, 
  businessName
}: StandardFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

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
        setSubmissionComplete(true);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit form. Please try again.');
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

  // Show thank you message after successful submission
  if (submissionComplete) {
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
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
