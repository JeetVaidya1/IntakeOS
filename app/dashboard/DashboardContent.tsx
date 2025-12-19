'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BotGenerator } from '../components/BotGenerator';
import { User } from '@supabase/supabase-js';

export function DashboardContent({ 
  user, 
  bots 
}: { 
  user: User; 
  bots: any[] | null;
}) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Create New Bot Section */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Create New Bot</h1>
        <p className="text-slate-600 mb-6">Describe what information you need and AI will build your intake form</p>
        <BotGenerator />
      </div>

      {/* Existing Bots */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Bots</h2>
          {bots && bots.length > 0 && (
            <p className="text-sm text-slate-500">{bots.length} total</p>
          )}
        </div>

        {!bots || bots.length === 0 ? (
          <Card className="p-12 text-center bg-slate-50">
            <div className="text-6xl mb-4">👆</div>
            <h3 className="text-xl font-semibold mb-2">Create your first bot above</h3>
            <p className="text-slate-600">Once created, it will appear here</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot: any) => {
              const submissionCount = bot.submissions?.[0]?.count || 0;
              
              return (
                <Link key={bot.id} href={`/dashboard/bots/${bot.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 truncate">{bot.name}</h3>
                        <p className="text-sm text-slate-500 font-mono truncate">{bot.slug}</p>
                      </div>
                      <Badge variant={bot.is_active ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                        {bot.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Submissions:</span>
                        <span className="font-semibold text-indigo-600">{submissionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Fields:</span>
                        <span className="font-semibold">{bot.schema.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Created:</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(bot.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-indigo-600 font-medium">
                        View Details →
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}