'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface PromptExamplesProps {
  onSelectTemplate?: (template: string) => void;
}

export function PromptExamples({ onSelectTemplate }: PromptExamplesProps) {
  const [activeTab, setActiveTab] = useState<'examples' | 'conversations'>('examples');

  const industryTemplates = [
    {
      industry: '📸 Wedding Photography',
      icon: '💍',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200',
      description: 'Perfect for photographers and event professionals',
      goodPrompt: `I'm a wedding photographer. I need to collect:
- Couple's names and contact info
- Wedding date and venue location
- Estimated guest count
- Package interest (basic, premium, or luxury)
- Budget range
- Whether they have a Pinterest board or inspiration images
- Any special requests or cultural traditions
- How they heard about me`,
      badPrompt: 'Need names, date, location, budget',
      exampleConversation: [
        { role: 'bot', text: "Hi there! 👋 Let's start with the happy couple - what are your names?" },
        { role: 'user', text: 'John and Lucy' },
        { role: 'bot', text: "That's a lovely couple name, John and Lucy! 💖 When's the big day?" },
        { role: 'user', text: 'October 15th, 2025' },
        { role: 'bot', text: "October 2025 - that's peak fall wedding season! 🍂 Where will you be celebrating?" },
        { role: 'user', text: 'Hummingbird Nest Ranch' },
        { role: 'bot', text: "Hummingbird Nest Ranch sounds like a stunning venue choice for your wedding! 🌿🥂 How many guests are you expecting?" }
      ]
    },
    {
      industry: '⚖️ Legal Services',
      icon: '📋',
      gradient: 'from-indigo-500 to-blue-500',
      bg: 'from-indigo-50 to-blue-50',
      border: 'border-indigo-200',
      description: 'For attorneys, consultants, and legal professionals',
      goodPrompt: `I'm an immigration attorney. For initial consultations I need:
- Full name and contact information
- Current immigration status (visa type)
- Desired outcome (green card, citizenship, work visa, etc.)
- Timeline urgency
- Whether they have family members to include
- Any previous immigration applications or denials
- How they found our firm
- Preferred consultation date/time`,
      badPrompt: 'Collect name, visa type, and what they need',
      exampleConversation: [
        { role: 'bot', text: "Welcome! Let's help you with your immigration needs. What's your full name?" },
        { role: 'user', text: 'Maria Rodriguez' },
        { role: 'bot', text: "Thanks, Maria! What's your current immigration status?" },
        { role: 'user', text: 'H-1B visa' },
        { role: 'bot', text: "Got it - you're on an H-1B work visa. What are you hoping to achieve? Green card, citizenship, or something else?" },
        { role: 'user', text: 'Green card for me and my spouse' },
        { role: 'bot', text: "Perfect - we can help with family-based green card applications. Since you mentioned your spouse, should we include them in this case as well?" }
      ]
    },
    {
      industry: '🏗️ Construction & Contractors',
      icon: '🔧',
      gradient: 'from-orange-500 to-amber-500',
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      description: 'For contractors, builders, and project managers',
      goodPrompt: `I'm a general contractor specializing in commercial renovations. I need:
- Project name and location
- Type of work (renovation, new build, equipment install, etc.)
- Project scale (square footage, budget range, etc.)
- Desired completion timeline
- Who's responsible for engineering
- Whether they need execution planning from us
- Whether they want us to review third-party work
- Initial budget for planning phase
- Total project budget estimate`,
      badPrompt: 'Get project details and budget',
      exampleConversation: [
        { role: 'bot', text: "Let's talk about your project! What should we call it?" },
        { role: 'user', text: 'Industrial Plant Boiler Replacement' },
        { role: 'bot', text: "Industrial Plant Boiler Replacement - that's a significant project! 🏭 What type of work is this exactly?" },
        { role: 'user', text: 'Full boiler system replacement and equipment installation' },
        { role: 'bot', text: "A full boiler replacement in an industrial plant - this will need careful planning. What's your timeline for completion?" },
        { role: 'user', text: 'December 2025' },
        { role: 'bot', text: "December 2025 - that gives us solid lead time to plan this right. What's your budget for the initial planning phase (Phase 0)?" }
      ]
    },
    {
      industry: '💻 SaaS & Tech',
      icon: '🚀',
      gradient: 'from-purple-500 to-violet-500',
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200',
      description: 'For software companies and tech consultants',
      goodPrompt: `I run a software development agency. For discovery calls I need:
- Company name and contact person
- Current tech stack
- Problem they're trying to solve
- Expected timeline
- Team size and budget range
- Whether they have existing designs/specs
- Integration requirements
- Preferred project approach (fixed bid vs time & materials)`,
      badPrompt: 'Company name, what they need, timeline, budget',
      exampleConversation: [
        { role: 'bot', text: "Thanks for reaching out! What's your company name?" },
        { role: 'user', text: 'TechFlow Solutions' },
        { role: 'bot', text: "Great to meet you, TechFlow Solutions! What challenge are you looking to solve?" },
        { role: 'user', text: 'We need to build a custom CRM for our sales team' },
        { role: 'bot', text: "A custom CRM - that's exciting! 📊 What's your current tech stack, so we can ensure compatibility?" },
        { role: 'user', text: 'React frontend, Node.js backend, PostgreSQL database' },
        { role: 'bot', text: "Perfect - we work extensively with that stack. Do you have existing designs or specs, or do you need us to help with that too?" }
      ]
    },
    {
      industry: '🏥 Healthcare & Wellness',
      icon: '💊',
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200',
      description: 'For healthcare providers and wellness coaches',
      goodPrompt: `I'm a sleep coach helping clients improve their sleep. I need:
- Name and contact information
- Current sleep challenge (insomnia, racing mind, early waking, etc.)
- How long they've struggled with this
- What they've already tried
- Whether they take sleep medications
- Work schedule (shift work, irregular hours, etc.)
- Primary goal (fall asleep faster, stay asleep, wake refreshed, etc.)
- Urgency level`,
      badPrompt: 'Name, sleep problem, what they want',
      exampleConversation: [
        { role: 'bot', text: "Welcome! I'm here to help you sleep better. What's your name?" },
        { role: 'user', text: 'Sarah Chen' },
        { role: 'bot', text: "Thanks Sarah! What's your biggest sleep challenge right now?" },
        { role: 'user', text: 'I can\'t fall asleep - my mind races for hours' },
        { role: 'bot', text: "Racing mind at bedtime - that's so frustrating. 😔 How long have you been dealing with this?" },
        { role: 'user', text: 'About 6 months' },
        { role: 'bot', text: "Six months is a long time to struggle. What have you tried so far to calm your mind at night?" }
      ]
    },
    {
      industry: '🎨 Creative Services',
      icon: '✨',
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'from-cyan-50 to-blue-50',
      border: 'border-cyan-200',
      description: 'For designers, artists, and creative agencies',
      goodPrompt: `I'm a brand designer specializing in small business rebrands. I need:
- Business name and industry
- What they currently dislike about their brand
- Target audience demographics
- Brand personality they want (modern, playful, luxury, etc.)
- Competitors they admire
- Deliverables needed (logo, website, business cards, etc.)
- Budget range
- Launch deadline
- Whether they have existing brand guidelines`,
      badPrompt: 'Business name, what they want designed, budget',
      exampleConversation: [
        { role: 'bot', text: "Excited to help with your rebrand! What's your business name?" },
        { role: 'user', text: 'Sweet Petals Bakery' },
        { role: 'bot', text: "Sweet Petals Bakery - what a lovely name! 🌸 What don't you like about your current branding?" },
        { role: 'user', text: 'It feels too corporate and doesn\'t match our handmade, artisanal vibe' },
        { role: 'bot', text: "I hear you - handmade artisanal should feel warm and authentic, not corporate. What personality do you want your new brand to have?" },
        { role: 'user', text: 'Elegant but approachable, artisanal, feminine' },
        { role: 'bot', text: "Beautiful! 'Elegant but approachable artisanal' - I can already envision this. Who's your ideal customer?" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Educational Header */}
      <Card className="p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              The Secret to Amazing Bots: Detailed Prompts
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed">
              Your bot's conversation quality is directly determined by your prompt quality. The more specific and detailed you are, the smarter and more helpful your bot becomes.
            </p>
          </div>
        </div>

        {/* Good vs Bad Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bad Prompt */}
          <div className="p-6 bg-white/80 rounded-xl border-2 border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900">❌ Vague Prompt (Poor Results)</h3>
            </div>
            <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
              <p className="text-sm text-red-800 font-mono">"Need names, date, location, budget"</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>Bot won't understand your industry</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>Generic, robotic questions</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 flex-shrink-0">•</span>
                <span>Misses important context</span>
              </p>
            </div>
          </div>

          {/* Good Prompt */}
          <div className="p-6 bg-white/80 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900">✅ Detailed Prompt (Great Results)</h3>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg mb-4 border border-emerald-200">
              <p className="text-sm text-emerald-800 font-mono">"I'm a wedding photographer. I need couple's names, wedding date, venue, guest count, package interest (basic/premium/luxury), budget, Pinterest boards..."</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                <span>Shows domain expertise</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                <span>Asks intelligent, contextual questions</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-500 flex-shrink-0">✓</span>
                <span>Connects information meaningfully</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('examples')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'examples'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Industry Templates
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'conversations'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Example Conversations
        </button>
      </div>

      {/* Industry Templates Grid */}
      {activeTab === 'examples' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {industryTemplates.map((template, idx) => (
            <Card key={idx} className={`p-6 bg-gradient-to-br ${template.bg} border-2 ${template.border} shadow-xl hover:shadow-2xl transition-all duration-300 group`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{template.industry}</h3>
                    <p className="text-sm text-slate-600">{template.description}</p>
                  </div>
                </div>
              </div>

              {/* Good Prompt Example */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Good Prompt
                  </Badge>
                </div>
                <div className="bg-white/80 p-4 rounded-lg border border-emerald-200 text-sm text-slate-700 font-mono leading-relaxed max-h-48 overflow-y-auto">
                  {template.goodPrompt}
                </div>
              </div>

              <Button
                onClick={() => onSelectTemplate?.(template.goodPrompt)}
                className={`w-full bg-gradient-to-r ${template.gradient} hover:opacity-90 shadow-lg`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use This Template
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Example Conversations */}
      {activeTab === 'conversations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {industryTemplates.map((template, idx) => (
            <Card key={idx} className={`p-6 bg-gradient-to-br ${template.bg} border-2 ${template.border} shadow-xl`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center text-xl shadow-lg`}>
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{template.industry}</h3>
                  <p className="text-xs text-slate-600">Example conversation flow</p>
                </div>
              </div>

              <div className="space-y-3">
                {template.exampleConversation.map((message, msgIdx) => (
                  <div key={msgIdx} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                        : 'bg-white border-2 border-purple-200'
                    }`}>
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className={`flex-1 p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-white/80 text-slate-700 border border-slate-200'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-white/60 rounded-lg border border-emerald-300">
                <p className="text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Notice how the bot shows domain knowledge and connects each answer
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
