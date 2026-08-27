'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface CredentialField {
  name: string;
  value: string;
}

interface NewCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (credential: { title: string; category: string; fields: CredentialField[] }) => void;
}

export function NewCredentialModal({ isOpen, onClose, onSubmit }: NewCredentialModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [fields, setFields] = useState<CredentialField[]>([
    { name: 'Username', value: '' },
    { name: 'Password', value: '' }
  ]);

  if (!isOpen) return null;

  const handleAddField = () => {
    setFields([...fields, { name: '', value: '' }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index: number, key: 'name' | 'value', val: string) => {
    const updated = [...fields];
    updated[index][key] = val;
    setFields(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;
    
    // Filter out fields with empty names or values
    const activeFields = fields.filter(f => f.name.trim() !== '' || f.value.trim() !== '');
    if (activeFields.length === 0) {
      alert('Please add at least one field name and value.');
      return;
    }

    onSubmit({ title, category, fields: activeFields });

    // Reset
    setTitle('');
    setCategory('');
    setFields([
      { name: 'Username', value: '' },
      { name: 'Password', value: '' }
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-3 border-black rounded-2xl w-full max-w-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col font-sans max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#FF6B6B] border-b-3 border-black p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] animate-pulse">
              <ShieldAlert className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-black text-sm tracking-wide">Add Project Credential</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-black">Credential Name / Service</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GitHub OAuth Client" 
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-black">Category</label>
            <input 
              type="text" 
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Authentication, Database, Payment" 
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          {/* Fields list */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black uppercase tracking-wider">Credential Fields</label>
              <button
                type="button"
                onClick={handleAddField}
                className="bg-white hover:bg-zinc-50 text-black font-black text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Value</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {fields.map((field, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      required
                      value={field.name}
                      onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                      placeholder="Name (e.g. API_KEY)" 
                      className="bg-zinc-50 text-black font-bold text-xs px-2.5 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-400"
                    />
                    <input 
                      type="text" 
                      required
                      value={field.value}
                      onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                      placeholder="Value" 
                      className="bg-zinc-50 text-black font-mono text-xs px-2.5 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-400"
                    />
                  </div>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="w-8 h-8 rounded-lg border-2 border-black bg-white hover:bg-red-50 text-red-600 flex items-center justify-center shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-[#FFD93D] hover:bg-[#FCD34D] text-black font-extrabold text-sm py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer text-center"
            >
              Save Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
