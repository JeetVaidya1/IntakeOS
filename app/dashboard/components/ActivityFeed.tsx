'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

// Helper to format time ago
function getTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function ActivityFeed({ recentSubmissions }: { recentSubmissions: any[] }) {
  return (
    <div className="sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Live Activity</h2>
      </div>

      <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-xl">
        {recentSubmissions && recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {recentSubmissions.map((submission: any) => (
              <Link
                key={submission.id}
                href={`/dashboard/submissions/${submission.id}`}
                className="block p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                      New submission for{' '}
                      <span className="font-bold">{submission.bots?.name || 'Unknown Bot'}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>
                      {getTimeAgo(submission.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">No recent activity</p>
            <p className="text-slate-500 text-xs mt-1">New submissions will appear here</p>
          </div>
        )}
      </Card>
    </div>
  );
}

