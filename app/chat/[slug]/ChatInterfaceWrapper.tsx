'use client';

import { ChatInterface } from './ChatInterface';
import { ChatInterfaceAgentic } from './ChatInterfaceAgentic';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

type BotType = {
  id: string;
  name: string;
  schema: any;
};

/**
 * ChatInterfaceWrapper - Routes to the correct chat implementation
 * based on the bot's schema type (legacy array vs agentic object)
 */
export function ChatInterfaceWrapper({ bot, businessName }: { bot: BotType; businessName: string }) {
  // Check if this is a legacy bot (array of fields)
  if (isLegacySchema(bot.schema)) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-8 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500 rounded-xl">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-orange-900 mb-2">
              Legacy Bot Format
            </h3>
            <p className="text-slate-700 mb-4">
              This bot uses the legacy field-by-field format. To use the new conversational AI experience,
              please create a new bot in your dashboard.
            </p>
            <p className="text-sm text-slate-600">
              The new agentic bots offer:
            </p>
            <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li>Natural, human-like conversations</li>
              <li>Intelligent image analysis with follow-up questions</li>
              <li>Flexible information gathering (no rigid forms)</li>
              <li>Context-aware responses</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  // Check if this is an agentic bot
  if (isAgenticSchema(bot.schema)) {
    return <ChatInterfaceAgentic bot={bot as any} businessName={businessName} />;
  }

  // Unknown schema format
  return (
    <Card className="w-full max-w-3xl mx-auto p-8 border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500 rounded-xl">
          <AlertCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-900 mb-2">
            Unknown Bot Format
          </h3>
          <p className="text-slate-700">
            This bot has an unrecognized schema format. Please contact support or create a new bot.
          </p>
        </div>
      </div>
    </Card>
  );
}
