'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type SubmissionActionsProps = {
  submissionId: string;
  botId: string;
  currentStatus: string;
  submissionData: Record<string, any>;
  botSchema: any[];
};

export function SubmissionActions({
  submissionId,
  botId,
  currentStatus,
  submissionData,
  botSchema,
}: SubmissionActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkAsContacted = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, status: 'contacted' }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Field', 'Value'];
    const rows = Object.entries(submissionData).map(([key, value]) => {
      const field = botSchema.find((f: any) => f.id === key);
      const label = field?.label || key;
      return [label, String(value)];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${submissionId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/submissions?id=${submissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/dashboard/bots/${botId}`);
        router.refresh();
      } else {
        alert('Failed to delete submission');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 flex gap-4">
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleMarkAsContacted}
        disabled={loading || currentStatus === 'contacted'}
      >
        {currentStatus === 'contacted' ? '✓ Contacted' : 'Mark as Contacted'}
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleExport}
        disabled={loading}
      >
        Export Data
      </Button>
      <Button
        variant="outline"
        className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleDelete}
        disabled={loading}
      >
        Delete
      </Button>
    </div>
  );
}
