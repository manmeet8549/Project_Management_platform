'use client';

import React, { useState } from 'react';
import { X, Sparkles, Folder } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: { title: string; dueDate: string; description: string; category: string }) => void;
}

export function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('E-Commerce');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    onSubmit({ title, dueDate, description, category });
    // Reset fields
    setTitle('');
    setDueDate('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border-3 border-black rounded-2xl w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="bg-[#FF6B6B] border-b-3 border-black p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <Folder className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-black text-sm tracking-wide">Create New Project</h3>
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
            <label className="text-xs font-black text-black">Project Name</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Portfolio Website" 
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-black">Due Date</label>
              <input 
                type="date" 
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-black">Category</label>
              <input 
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. SaaS, Design"
                className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-black">Project Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of project goals..." 
              rows={3}
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#FFD93D] hover:bg-[#FCD34D] text-black font-extrabold text-xs sm:text-sm py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>Create Project</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
