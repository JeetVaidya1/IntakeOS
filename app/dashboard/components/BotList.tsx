'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Download, BarChart3, Settings, Link2 } from 'lucide-react';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

// Helper to get field count from either schema type
function getFieldCount(schema: any): number {
  if (isLegacySchema(schema)) {
    return schema.length;
  }
  if (isAgenticSchema(schema)) {
    return Object.keys(schema.required_info).length;
  }
  return 0;
}

export function BotList({
  bots,
  onCreateBot,
}: {
  bots: any[] | null;
  onCreateBot: () => void;
}) {
  const router = useRouter();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopyLink = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const link = `${window.location.origin}/chat/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleExportCSV = () => {
    if (!bots || bots.length === 0) return;

    // CSV Header
    const headers = ['Bot Name', 'Slug', 'Total Submissions', 'Fields', 'Creation Date', 'Status'];
    const csvRows = [headers.join(',')];

    // CSV Data
    bots.forEach((bot: any) => {
      const submissionCount = bot.submissions?.[0]?.count || 0;
      const fieldCount = getFieldCount(bot.schema);
      const createdDate = new Date(bot.created_at).toLocaleDateString();
      const status = bot.is_active ? 'Active' : 'Inactive';

      const row = [
        `"${bot.name}"`,
        `"${bot.slug}"`,
        submissionCount,
        fieldCount,
        `"${createdDate}"`,
        status
      ];
      csvRows.push(row.join(','));
    });

    // Create CSV string
    const csvString = csvRows.join('\n');

    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'intakeos-bots-summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Your Bots</h2>
        <div className="flex items-center gap-3">
          {bots && bots.length > 0 && (
            <>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-emerald-500/50 hover:text-emerald-300 transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Quick Export (CSV)
              </Button>
              <span className="text-sm font-medium px-3 py-1 bg-white/10 backdrop-blur-lg rounded-full border border-white/10 text-slate-300">
                {bots.length} total
              </span>
            </>
          )}
        </div>
      </div>

      {!bots || bots.length === 0 ? (
        <Card className="p-16 text-center bg-white/5 backdrop-blur-lg border-dashed border-2 border-white/10 hover:bg-white/10 transition-colors">
          <div className="text-6xl mb-4 grayscale opacity-50">🤖</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No bots yet</h3>
          <p className="text-slate-400 mb-6">Create your first AI intake bot to get started</p>
          <Button
            onClick={onCreateBot}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Bot
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bots.map((bot: any, index: number) => {
            const submissionCount = bot.submissions?.[0]?.count || 0;

            // Cycle through vibrant color schemes - Now for borders and glows
            const colorSchemes = [
              {
                border: 'border-indigo-500/30',
                hoverBorder: 'hover:border-indigo-500/60',
                shadow: 'hover:shadow-indigo-500/20',
                text: 'text-indigo-400',
                gradient: 'from-indigo-500 via-purple-500 to-pink-500',
              },
              {
                border: 'border-cyan-500/30',
                hoverBorder: 'hover:border-cyan-500/60',
                shadow: 'hover:shadow-cyan-500/20',
                text: 'text-cyan-400',
                gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
              },
              {
                border: 'border-pink-500/30',
                hoverBorder: 'hover:border-pink-500/60',
                shadow: 'hover:shadow-pink-500/20',
                text: 'text-pink-400',
                gradient: 'from-pink-500 via-rose-500 to-red-500',
              },
              {
                border: 'border-orange-500/30',
                hoverBorder: 'hover:border-orange-500/60',
                shadow: 'hover:shadow-orange-500/20',
                text: 'text-orange-400',
                gradient: 'from-orange-500 via-amber-500 to-yellow-500',
              },
              {
                border: 'border-emerald-500/30',
                hoverBorder: 'hover:border-emerald-500/60',
                shadow: 'hover:shadow-emerald-500/20',
                text: 'text-emerald-400',
                gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
              },
              {
                border: 'border-purple-500/30',
                hoverBorder: 'hover:border-purple-500/60',
                shadow: 'hover:shadow-purple-500/20',
                text: 'text-purple-400',
                gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
              },
            ];

            const colors = colorSchemes[index % colorSchemes.length];

            return (
              <div key={bot.id}>
                <Card className={`p-6 bg-slate-900/40 backdrop-blur-lg border ${colors.border} ${colors.hoverBorder} hover:shadow-2xl ${colors.shadow} transition-all duration-300 group relative overflow-hidden flex flex-col`}>
                  {/* Animated Gradient Top Line */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-gradient`} />

                  {/* Main clickable area */}
                  <div
                    onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4 mt-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className={`font-bold text-xl mb-2 truncate text-white group-hover:scale-105 transition-transform origin-left`}>
                          {bot.name}
                        </h3>
                        <p className={`text-xs text-slate-400 font-mono truncate bg-black/20 inline-block px-2 py-1 rounded border border-white/10`}>
                          {bot.slug}
                        </p>
                      </div>
                      <Badge
                        variant={bot.is_active ? "default" : "secondary"}
                        className={`ml-2 flex-shrink-0 ${bot.is_active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}
                      >
                        {bot.is_active ? "✓ Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-3 pt-2 flex-1">
                      <div className="flex items-center justify-between text-sm p-2 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                        <span className="text-slate-300 font-medium">Submissions</span>
                        <span className={`font-bold text-lg ${colors.text} bg-white/10 px-3 py-1 rounded-full`}>
                          {submissionCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                        <span className="text-slate-300 font-medium">Fields</span>
                        <span className="font-bold text-white">
                          {getFieldCount(bot.schema)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                        <span className="text-slate-300 font-medium">Created</span>
                        <span className="text-slate-400 text-xs font-medium" suppressHydrationWarning>
                          {new Date(bot.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/bots/${bot.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg transition-all text-slate-300 hover:text-white text-sm font-medium group/action"
                      >
                        <BarChart3 className="h-4 w-4 group-hover/action:scale-110 transition-transform" />
                        <span>Activity</span>
                      </Link>
                      <Link
                        href={`/dashboard/bots/${bot.id}?tab=settings`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg transition-all text-slate-300 hover:text-white text-sm font-medium group/action"
                      >
                        <Settings className="h-4 w-4 group-hover/action:rotate-90 transition-transform" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={(e) => handleCopyLink(e, bot.slug)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg transition-all text-slate-300 hover:text-white text-sm font-medium group/action"
                      >
                        <Link2 className={`h-4 w-4 transition-transform ${copiedSlug === bot.slug ? 'scale-125 text-green-400' : 'group-hover/action:scale-110'}`} />
                        <span>{copiedSlug === bot.slug ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

