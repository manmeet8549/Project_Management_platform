'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Trash2, Edit } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: { id: string; title: string; prio: string; comment?: string } | null;
  onSubmit: (updated: { id: string; title: string; priority: 'High Priority' | 'Medium Priority' | 'Low Priority'; comment?: string }) => void;
  onDelete: (id: string) => void;
}

export function EditTaskModal({ isOpen, onClose, task, onSubmit, onDelete }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'High Priority' | 'Medium Priority' | 'Low Priority'>('Medium Priority');
  const [comment, setComment] = useState('');

  // Sync state with selected task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(
        task.prio === 'High Priority' || task.prio === 'Medium Priority' || task.prio === 'Low Priority'
          ? (task.prio as 'High Priority' | 'Medium Priority' | 'Low Priority')
          : 'Medium Priority'
      );
      setComment(task.comment || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      id: task.id,
      title,
      priority,
      comment: comment.trim() || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-3 border-black rounded-2xl w-full max-w-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="bg-[#FFD93D] border-b-3 border-black p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <Edit className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-black text-sm tracking-wide">Edit Task / Comment</h3>
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

          <div className="space-y-1">
            <label className="text-xs font-black text-black">Task Comment / Note</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Please use Supabase Auth for better security." 
              rows={2}
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400 resize-none"
            />
          </div>

          <div className="pt-2 grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="col-span-2 bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-extrabold text-xs sm:text-sm py-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4 stroke-[2]" />
              <span>Delete</span>
            </button>

            <button
              type="submit"
              className="col-span-3 bg-[#FFD93D] hover:bg-[#FCD34D] text-black font-extrabold text-xs sm:text-sm py-3 rounded-xl border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
