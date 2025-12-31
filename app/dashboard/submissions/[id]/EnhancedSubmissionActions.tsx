'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Download, Trash2 } from 'lucide-react';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

// Helper function to get field label from either schema type
function getFieldLabel(key: string, schema: any): string {
  if (isLegacySchema(schema)) {
    const field = schema.find((f: any) => f.id === key);
    return field?.label || formatKey(key);
  }

  if (isAgenticSchema(schema)) {
    const info = schema.required_info[key];
    return info?.description || formatKey(key);
  }

  return formatKey(key);
}

function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to extract phone number from submission data
function extractPhone(data: Record<string, any>): string | null {
  const phoneKeys = ['phone', 'phone_number', 'mobile', 'contact_number', 'tel', 'telephone'];

  for (const key of Object.keys(data)) {
    if (phoneKeys.some(pk => key.toLowerCase().includes(pk))) {
      const value = String(data[key]).replace(/\D/g, ''); // Remove non-digits
      if (value.length >= 10) return value;
    }
  }

  return null;
}

// Helper to extract name from submission data
function extractName(data: Record<string, any>): string {
  const nameKeys = ['name', 'full_name', 'contact_name', 'customer_name'];

  for (const key of Object.keys(data)) {
    if (nameKeys.some(nk => key.toLowerCase().includes(nk))) {
      return String(data[key]);
    }
  }

  // Fallback to first string value
  for (const value of Object.values(data)) {
    if (typeof value === 'string' && value.length > 0 && !value.startsWith('[')) {
      return value;
    }
  }

  return 'there';
}

type EnhancedSubmissionActionsProps = {
  submissionId: string;
  botId: string;
  botName: string;
  currentStatus: string;
  submissionData: Record<string, any>;
  botSchema: any;
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'from-emerald-500 to-teal-500' },
  { value: 'contacted', label: 'Contacted', color: 'from-blue-500 to-cyan-500' },
  { value: 'booked', label: 'Booked', color: 'from-purple-500 to-pink-500' },
  { value: 'closed', label: 'Closed', color: 'from-slate-500 to-slate-600' },
];

export function EnhancedSubmissionActions({
  submissionId,
  botId,
  botName,
  currentStatus,
  submissionData,
  botSchema,
}: EnhancedSubmissionActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const phone = extractPhone(submissionData);
  const name = extractName(submissionData);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
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

  const handleWhatsApp = () => {
    if (!phone) {
      alert('No phone number found in submission data');
      return;
    }

    const message = `Hi ${name}, I'm following up on your request to ${botName}. How can I help you today?`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCall = () => {
    if (!phone) {
      alert('No phone number found in submission data');
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Field', 'Value'];
    const rows = Object.entries(submissionData).map(([key, value]) => {
      const label = getFieldLabel(key, botSchema);
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

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Speed-to-Lead Action Bar */}
      {phone && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Speed-to-Lead Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleWhatsApp}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/50 h-14 text-lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Follow-up
            </Button>
            <Button
              onClick={handleCall}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/50 h-14 text-lg"
            >
              <Phone className="mr-2 h-5 w-5" />
              Direct Call
            </Button>
          </div>
        </div>
      )}

      {/* Status Pipeline */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-lg">
        <h3 className="text-lg font-bold text-white mb-4">Status Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={loading || status === option.value}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === option.value
                  ? `bg-gradient-to-r ${option.color} border-transparent text-white shadow-lg`
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              {status === option.value && (
                <div className="text-xs mt-1 opacity-90">● Active</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Additional Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm"
          onClick={handleExport}
          disabled={loading}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 text-sm"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
