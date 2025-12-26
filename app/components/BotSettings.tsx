'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { Webhook, Check, ExternalLink } from 'lucide-react';

export function BotSettings({ bot }: { bot: any }) {
  const [name, setName] = useState(bot.name);
  const [notificationEmail, setNotificationEmail] = useState(bot.notification_email || '');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationSaved, setIntegrationSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  // Fetch existing integration on mount
  useEffect(() => {
    async function fetchIntegration() {
      const { data, error } = await supabase
        .from('integrations')
        .select('webhook_url, is_active')
        .eq('bot_id', bot.id)
        .single();

      if (!error && data) {
        setWebhookUrl(data.webhook_url || '');
      }
    }
    fetchIntegration();
  }, [bot.id, supabase]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bot.id,
          name,
          notification_email: notificationEmail
        }),
      });

      if (response.ok) {
        router.refresh();
        alert('Settings updated successfully!');
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegration = async () => {
    setIntegrationLoading(true);
    setIntegrationSaved(false);

    try {
      // Upsert the integration record
      const { error } = await supabase
        .from('integrations')
        .upsert({
          bot_id: bot.id,
          webhook_url: webhookUrl.trim() || null,
          is_active: true,
        }, {
          onConflict: 'bot_id'
        });

      if (error) {
        console.error('Integration error:', error);
        alert('Failed to save integration');
      } else {
        setIntegrationSaved(true);
        setTimeout(() => setIntegrationSaved(false), 3000);
      }
    } catch (error) {
      console.error(error);
      alert('Error saving integration');
    } finally {
      setIntegrationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this bot? This cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/bots?id=${bot.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        alert('Failed to delete bot');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/5 backdrop-blur-lg border border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">General Settings</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium text-slate-200">Bot Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-black/20 border-white/10 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Notification Email</label>
            <p className="text-xs text-slate-400 mt-1 mb-2">
              Where should we send new submission alerts?
            </p>
            <Input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1 bg-black/20 border-white/10 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
          </div>
          <Button
            onClick={handleUpdate}
            disabled={loading || (name === bot.name && notificationEmail === bot.notification_email)}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/50"
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {/* Integrations Section */}
      <Card className="p-6 border border-purple-500/30 bg-white/5 backdrop-blur-lg">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">Webhooks & Integrations</h3>
        </div>

        <p className="text-sm text-slate-300 mb-4">
          Automatically send submission data to external tools when a new lead comes in.
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium text-slate-200">Webhook URL</label>
            <p className="text-xs text-slate-400 mt-1 mb-2">
              We'll POST submission data to this URL. Works with Zapier, Make.com, and custom endpoints.
            </p>
            <Input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="mt-1 font-mono text-sm bg-black/20 border-white/10 text-white placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 backdrop-blur-lg">
            <p className="text-xs font-medium text-indigo-300 mb-2">Payload Example:</p>
            <pre className="text-xs text-indigo-200 font-mono overflow-x-auto">
{`{
  "event": "submission.created",
  "bot_id": "...",
  "bot_name": "...",
  "submission_id": "...",
  "submitted_at": "...",
  "field_1": "value",
  "field_2": "value"
}`}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10">
              <ExternalLink className="h-3 w-3" />
              <a href="https://zapier.com/apps/webhook/integrations" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                Zapier
              </a>
            </span>
            <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10">
              <ExternalLink className="h-3 w-3" />
              <a href="https://www.make.com/en/help/tools/webhooks" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                Make.com
              </a>
            </span>
            <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10">
              <ExternalLink className="h-3 w-3" />
              <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                Slack
              </a>
            </span>
          </div>

          <Button
            onClick={handleSaveIntegration}
            disabled={integrationLoading}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/50"
          >
            {integrationLoading ? (
              'Saving...'
            ) : integrationSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              'Save Integration'
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6 border border-red-500/20 bg-red-500/10 backdrop-blur-lg">
        <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-300 mb-4">
          Deleting this bot will remove all associated data and stop the embed from working.
        </p>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50"
        >
          {loading ? 'Deleting...' : 'Delete Bot'}
        </Button>
      </Card>
    </div>
  );
}
