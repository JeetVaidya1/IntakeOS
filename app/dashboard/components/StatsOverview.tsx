'use client';

import { Card } from '@/components/ui/card';
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

export function StatsOverview({ bots }: { bots: any[] | null }) {
  if (!bots || bots.length === 0) return null;

  // Calculate statistics
  const totalBots = bots.length;
  const totalSubmissions = bots.reduce((sum, bot) => sum + (bot.submissions?.[0]?.count || 0), 0);
  const activeBots = bots.filter(bot => bot.is_active).length;
  const averageFields = Math.round(bots.reduce((sum: number, bot: any) => sum + getFieldCount(bot.schema), 0) / totalBots);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-bold mb-6 text-white">
        Your Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Bots */}
        <Card className="p-6 bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/20 backdrop-blur-lg group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-1">Total Bots</p>
              <p className="text-4xl font-bold text-white mb-2">{totalBots}</p>
              <p className="text-xs text-slate-500">AI intake forms created</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        </Card>

        {/* Total Submissions */}
        <Card className="p-6 bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/20 backdrop-blur-lg group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-1">Total Submissions</p>
              <p className="text-4xl font-bold text-white mb-2">{totalSubmissions}</p>
              <p className="text-xs text-slate-500">Client responses collected</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </Card>

        {/* Active Bots */}
        <Card className="p-6 bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all shadow-xl hover:shadow-cyan-500/20 backdrop-blur-lg group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-1">Active Bots</p>
              <p className="text-4xl font-bold text-white mb-2">{activeBots}</p>
              <p className="text-xs text-slate-500">Currently accepting responses</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/50 group-hover:scale-110 transition-transform">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </Card>

        {/* Average Fields */}
        <Card className="p-6 bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all shadow-xl hover:shadow-orange-500/20 backdrop-blur-lg group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-1">Avg Fields/Bot</p>
              <p className="text-4xl font-bold text-white mb-2">{averageFields}</p>
              <p className="text-xs text-slate-500">Questions per intake form</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

