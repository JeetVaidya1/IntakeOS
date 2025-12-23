'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export function BotSettings({ bot }: { bot: any }) {
  const [name, setName] = useState(bot.name);
  const [notificationEmail, setNotificationEmail] = useState(bot.notification_email || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">General Settings</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium text-slate-700">Bot Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notification Email</label>
            <p className="text-xs text-slate-500 mt-1 mb-2">
              Where should we send new submission alerts?
            </p>
            <Input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleUpdate}
            disabled={loading || (name === bot.name && notificationEmail === bot.notification_email)}
          >
            Save Changes
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-red-100 bg-red-50/50">
        <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">
          Deleting this bot will remove all associated data and stop the embed from working.
        </p>
        <Button 
          variant="destructive" 
          onClick={handleDelete} 
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete Bot'}
        </Button>
      </Card>
    </div>
  );
}