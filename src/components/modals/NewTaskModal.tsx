'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; priority: 'High Priority' | 'Medium Priority' | 'Low Priority' }) => void;
  columnName: string;
}

export function NewTaskModal({ isOpen, onClose, onSubmit, columnName }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'High Priority' | 'Medium Priority' | 'Low Priority'>('Medium Priority');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, priority });
    setTitle('');
    setPriority('Medium Priority');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-3 border-black rounded-2xl w-full max-w-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="bg-[#FFD93D] border-b-3 border-black p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <Plus className="w-4 h-4 text-black stroke-[3]" />
            </div>
            <h3 className="font-black text-sm tracking-wide">Add Task to {columnName}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-black">Task Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement checkout flow" 
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-black">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'High Priority' | 'Medium Priority' | 'Low Priority')}
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="High Priority">High Priority</option>
              <option value="Medium Priority">Medium Priority</option>
              <option value="Low Priority">Low Priority</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-extrabold text-xs sm:text-sm py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Create Task</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
