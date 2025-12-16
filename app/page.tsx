'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BotGenerator } from './components/BotGenerator';
import { useAuth } from './providers/AuthProvider';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">Intake OS</div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-slate-600">
                  {user.email}
                </span>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-slate-900">
            Kill Forms. Start Conversations.
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Turn any intake requirements into an AI agent that actually gets complete data.
          </p>
        </div>

        <BotGenerator />

        {/* Template Gallery */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">Or start with a template:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.title}
                className="bg-white p-6 rounded-lg border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="text-4xl mb-2">{template.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{template.title}</h3>
                <p className="text-sm text-slate-600">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 italic">
            &quot;I set this up in 30 seconds for my pressure washing business. Game changer.&quot;
          </p>
          <p className="text-slate-500 text-sm mt-2">- Mike S., Pressure Washing</p>
        </div>
      </main>
    </div>
  );
}

const templates = [
  {
    icon: '🏡',
    title: 'Landscaping',
    description: 'Lawn size, services, photos, access details'
  },
  {
    icon: '🏠',
    title: 'Roofing',
    description: 'Roof type, leak location, photos, urgency'
  },
  {
    icon: '🚚',
    title: 'Moving',
    description: 'Inventory, stairs, distance, date needed'
  },
  {
    icon: '💼',
    title: 'Consulting',
    description: 'Budget, timeline, goals, company size'
  },
  {
    icon: '🔧',
    title: 'HVAC',
    description: 'System type, issue, property size, photos'
  },
  {
    icon: '🏥',
    title: 'Medical',
    description: 'Symptoms, insurance, medical history, contact'
  },
];