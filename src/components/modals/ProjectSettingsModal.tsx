'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeDeadline } from '@/lib/deadline';

export interface ProjectSettingsData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  dueDate: string | null;
}

export interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectSettingsData;
  onProjectUpdated: (updatedProject: ProjectSettingsData) => void;
  onProjectDeleted: () => void;
}

export function ProjectSettingsModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectSettingsModalProps) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [category, setCategory] = useState(project?.category || '');
  const [status, setStatus] = useState<'planning' | 'in-progress' | 'completed' | 'on-hold'>(project?.status || 'in-progress');
  const [dueDate, setDueDate] = useState(project?.dueDate || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever project changes
  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setCategory(project.category || 'General');
      setStatus(project.status || 'in-progress');
      setDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
      setShowDeleteConfirm(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.trim() || 'General',
          status,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      setIsSaving(false);

      if (res.ok && data.success) {
        setSuccessMessage('Project settings saved successfully!');
        window.dispatchEvent(new Event('projectsUpdated'));
        if (onProjectUpdated) {
          onProjectUpdated(data.data);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(data.error || 'Failed to update project');
      }
    } catch (err) {
      console.error('Error saving project settings:', err);
      setIsSaving(false);
      setErrorMessage('An unexpected error occurred while saving.');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'DELETE',
        headers,
      });

      setIsDeleting(false);

      if (res.ok || res.status === 204) {
        window.dispatchEvent(new Event('projectsUpdated'));
        if (onProjectDeleted) {
          onProjectDeleted();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || 'Failed to delete project.');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setIsDeleting(false);
      setErrorMessage('An error occurred while deleting the project.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pb-32 sm:pb-36 pt-4">
      <div className="bg-[#FAF8F5] border-3 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col font-sans max-h-[calc(100vh-10rem)]">
        
        {/* Header */}
        <div className="bg-[#FFD93D] border-b-3 border-black p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <Settings className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide">Project Settings</h3>
              <div className="text-[10px] font-bold text-black/70">ID: {project.id}</div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="bg-[#FF6B6B] text-black border-2 border-black p-3 rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-[#A7F3D0] text-black border-2 border-black p-3 rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-black">Project Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title..." 
                className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-black">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed project summary..." 
                rows={3}
                className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-1">
                <label className="text-xs font-black text-black">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'planning' | 'in-progress' | 'completed' | 'on-hold')}
                  className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                >
                  <option value="planning">Planning 📋</option>
                  <option value="in-progress">In Progress 🚀</option>
                  <option value="completed">Completed 🎉</option>
                  <option value="on-hold">On Hold ⏸️</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-black">Target Due Date</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              />
              {dueDate ? (() => {
                const dl = analyzeDeadline(dueDate);
                return (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded border border-black/20 shadow-[1px_1px_0px_rgba(0,0,0,1)]",
                      dl.bgColor,
                      dl.textColor,
                      dl.borderColor
                    )}>
                      {dl.remainingText} ({dl.formattedDate})
                    </span>
                  </div>
                );
              })() : (
                <div className="text-[10px] font-bold text-zinc-400 mt-1">No due date set</div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="w-full bg-[#FFD93D] hover:bg-[#FACC15] text-black font-black text-xs sm:text-sm py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Project Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="pt-4 border-t-2 border-black/10">
            <div className="bg-[#FF6B6B]/10 border-2 border-[#FF6B6B] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#FF6B6B]">
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                <span>Danger Zone</span>
              </div>
              <p className="text-[11px] text-zinc-600 font-bold leading-relaxed">
                Deleting this project will permanently remove it along with all associated tasks, notes, and activity history.
              </p>

              {showDeleteConfirm && (
                <div className="bg-[#FF6B6B] text-white p-3 rounded-lg border-2 border-black text-xs font-black space-y-1">
                  <div>⚠️ Confirmation Required</div>
                  <div className="font-bold text-[11px] text-white/90">
                    Are you 100% sure? Click below to permanently delete project &quot;{project.title}&quot;.
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className={cn(
                  "w-full font-black text-xs py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
                  showDeleteConfirm
                    ? "bg-[#FF6B6B] hover:bg-[#FF5252] text-white"
                    : "bg-white hover:bg-red-50 text-[#FF6B6B] border-[#FF6B6B]"
                )}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting Project...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{showDeleteConfirm ? 'Confirm Permanent Delete' : 'Delete Project'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
