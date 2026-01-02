'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Edit2, Plus, Trash2, Check } from 'lucide-react';

interface FieldDefinition {
  key: string;
  description: string;
  critical: boolean;
  example: string;
  type: string;
  behavior: 'strict' | 'conversational';
}

interface BotBlueprint {
  botTaskName: string;
  goal: string;
  system_prompt: string;
  required_info: Record<string, any>;
}

interface BlueprintReviewProps {
  blueprint: BotBlueprint;
  onBack: () => void;
  onFinalize: (editableName: string, editableGoal: string, editableFields: FieldDefinition[]) => void;
  finalizing: boolean;
}

export function BlueprintReview({
  blueprint,
  onBack,
  onFinalize,
  finalizing,
}: BlueprintReviewProps) {
  const [editableName, setEditableName] = useState(blueprint.botTaskName);
  const [editableGoal, setEditableGoal] = useState(blueprint.goal);
  
  // Convert required_info to editable fields array
  const initialFields: FieldDefinition[] = Object.entries(blueprint.required_info).map(([key, value]: [string, any]) => ({
    key,
    description: value.description || '',
    critical: value.critical || false,
    example: value.example || '',
    type: value.type || 'text',
    behavior: value.behavior || 'conversational',
  }));

  const [editableFields, setEditableFields] = useState<FieldDefinition[]>(initialFields);

  const handleAddField = () => {
    const newField: FieldDefinition = {
      key: `custom_field_${Date.now()}`,
      description: 'New field description',
      critical: false,
      example: 'Example value',
      type: 'text',
      behavior: 'conversational',
    };
    setEditableFields([...editableFields, newField]);
  };

  const handleRemoveField = (index: number) => {
    setEditableFields(editableFields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, updates: Partial<FieldDefinition>) => {
    const updated = [...editableFields];
    updated[index] = { ...updated[index], ...updates };
    setEditableFields(updated);
  };

  const handleToggleBehavior = (index: number) => {
    const updated = [...editableFields];
    updated[index].behavior = updated[index].behavior === 'strict' ? 'conversational' : 'strict';
    setEditableFields(updated);
  };

  const handleFinalizeClick = () => {
    onFinalize(editableName, editableGoal, editableFields);
  };

  return (
    <div className="space-y-8">
      {/* Blueprint Review Header */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg shadow-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Review Your Bot Blueprint</h2>
          </div>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>
        </div>

        {/* Editable Name and Goal */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Bot Name</label>
            <Input
              value={editableName}
              onChange={(e) => setEditableName(e.target.value)}
              className="bg-black/20 border-white/10 text-white text-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Goal</label>
            <Textarea
              value={editableGoal}
              onChange={(e) => setEditableGoal(e.target.value)}
              className="bg-black/20 border-white/10 text-white min-h-[100px]"
            />
          </div>
        </div>

        {/* Personality Preview */}
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-6">
          <h3 className="text-sm font-bold text-indigo-300 mb-2">Personality Preview</h3>
          <p className="text-sm text-slate-300 line-clamp-3">
            {blueprint.system_prompt.substring(0, 200)}...
          </p>
        </div>

        {/* Fields List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Fields to Collect ({editableFields.length})</h3>
            <Button
              onClick={handleAddField}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="space-y-3">
            {editableFields.map((field, index) => (
              <div
                key={field.key}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        value={field.key}
                        onChange={(e) => handleUpdateField(index, { key: e.target.value })}
                        className="bg-black/20 border-white/10 text-white font-mono text-sm flex-1"
                        placeholder="field_key"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(index, { type: e.target.value })}
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                        <option value="url">URL</option>
                      </select>
                    </div>

                    <Input
                      value={field.description}
                      onChange={(e) => handleUpdateField(index, { description: e.target.value })}
                      className="bg-black/20 border-white/10 text-white text-sm"
                      placeholder="Field description"
                    />

                    <div className="flex items-center gap-3">
                      <Input
                        value={field.example}
                        onChange={(e) => handleUpdateField(index, { example: e.target.value })}
                        className="bg-black/20 border-white/10 text-white text-sm flex-1"
                        placeholder="Example value"
                      />
                      <button
                        onClick={() => handleToggleBehavior(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          field.behavior === 'strict'
                            ? 'bg-orange-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {field.behavior === 'strict' ? 'Strict' : 'Flexible'}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finalize Button */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <Button
            onClick={handleFinalizeClick}
            disabled={finalizing}
            className="w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 text-lg font-bold py-7 shadow-2xl rounded-2xl"
          >
            {finalizing ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching Bot...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                <span>Finalize & Launch Bot</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

