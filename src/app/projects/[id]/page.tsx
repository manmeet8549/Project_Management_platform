'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { NewTaskModal } from '@/components/modals/NewTaskModal';
import { EditTaskModal } from '@/components/modals/EditTaskModal';
import { NewCredentialModal } from '@/components/modals/NewCredentialModal';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { clientCache, fetchWithCache, invalidateClientCache } from '@/lib/client/clientCache';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Settings, 
  ShoppingCart, 
  Calendar, 
  Plus, 
  CheckSquare, 
  FileText, 
  Activity, 
  MoreVertical, 
  MessageSquare, 
  CheckCircle2, 
  BarChart3, 
  GripVertical,
  Search,
  ChevronDown,
  ShieldCheck,
  Lock,
  Trash2,
  SlidersHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CredentialField {
  name: string;
  value: string;
}

interface CredentialItem {
  id: string;
  title: string;
  category: string;
  categoryBg: string;
  addedOn: string;
  fields: CredentialField[];
}

interface NoteItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  updated: string;
  sections: {
    heading: string;
    items: string[];
  }[];
}






interface RawProjectApiDetail {
  id: string;
  title: string;
  category?: string;
  status?: string;
  description?: string;
  dueDate?: string | null;
}

interface RawTaskApiDetail {
  id: string;
  projectId: string;
  title: string;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  description?: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  prio: string;
  prioBg: string;
  date: string;
  count: number;
  status: 'To Do' | 'In Progress' | 'Completed';
  comment?: string;
  time?: string;
}

function mapRawTasks(tasksList: RawTaskApiDetail[], rawProjectId: string, projData: RawProjectApiDetail | null): TaskItem[] {
  const matchingTasks: RawTaskApiDetail[] = tasksList.filter((t: RawTaskApiDetail) => 
    !rawProjectId || t.projectId === rawProjectId || rawProjectId.startsWith('proj-') || (projData && t.projectId === projData.id)
  );

  return matchingTasks.map((t: RawTaskApiDetail) => {
    const rawPrio = t.priority === 'urgent' || t.priority === 'high' ? 'High Priority' : t.priority === 'medium' ? 'Medium Priority' : 'Low Priority';
    const prioBg = rawPrio === 'High Priority' ? 'bg-[#FF6B6B]' : rawPrio === 'Medium Priority' ? 'bg-[#FFD93D]' : 'bg-[#C4B5FD]';

    const mappedStatus: 'To Do' | 'In Progress' | 'Completed' = 
      (t.status === 'done' || t.status === 'completed') ? 'Completed' : 
      (t.status === 'in_progress' || t.status === 'in-progress') ? 'In Progress' : 'To Do';

    return {
      id: t.id,
      title: t.title,
      prio: rawPrio,
      prioBg,
      date: t.dueDate || 'No Due Date',
      count: 0,
      status: mappedStatus,
      comment: t.description || undefined,
      time: 'DB record'
    };
  });
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawProjectId = (params?.id as string) || '';

  const currentProjRef = React.useRef<RawProjectApiDetail | null>(null);
  const currentTasksRef = React.useRef<RawTaskApiDetail[]>([]);

  const [projectDetail, setProjectDetail] = useState<RawProjectApiDetail | null>(() => {
    if (typeof window !== 'undefined' && rawProjectId) {
      const cached = clientCache.get<RawProjectApiDetail>(`project_detail_${rawProjectId}`).data;
      if (cached) currentProjRef.current = cached;
      return cached;
    }
    return null;
  });
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'credentials' | 'notes' | 'activity'>('tasks');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('1');

  const [allTasks, setAllTasks] = useState<TaskItem[]>(() => {
    if (typeof window !== 'undefined' && rawProjectId) {
      const cachedTasks = clientCache.get<RawTaskApiDetail[]>(`tasks_list_${rawProjectId}`).data;
      const cachedProj = clientCache.get<RawProjectApiDetail>(`project_detail_${rawProjectId}`).data;
      if (cachedTasks && cachedTasks.length > 0) {
        currentTasksRef.current = cachedTasks;
        return mapRawTasks(cachedTasks, rawProjectId, cachedProj);
      }
    }
    return [];
  });

  const fetchProjectAndTasks = React.useCallback((forceRefresh = false) => {
    if (!rawProjectId) return;
    try {
      // 1. Immediately hydrate from cache (0ms render on reload)
      const cachedProj = clientCache.get<RawProjectApiDetail>(`project_detail_${rawProjectId}`).data;
      const cachedTasks = clientCache.get<RawTaskApiDetail[]>(`tasks_list_${rawProjectId}`).data;
      if (cachedProj) {
        currentProjRef.current = cachedProj;
        setProjectDetail(cachedProj);
      }
      if (cachedTasks && cachedTasks.length > 0) {
        currentTasksRef.current = cachedTasks;
        setAllTasks(mapRawTasks(cachedTasks, rawProjectId, cachedProj || currentProjRef.current));
      }

      // 2. Non-blocking SWR background revalidations
      fetchWithCache<RawProjectApiDetail>(`/api/v1/projects/${rawProjectId}`, `project_detail_${rawProjectId}`, (data) => {
        currentProjRef.current = data;
        setProjectDetail(data);
        if (currentTasksRef.current.length > 0) {
          setAllTasks(mapRawTasks(currentTasksRef.current, rawProjectId, data));
        }
      }, { forceRefresh });

      fetchWithCache<RawTaskApiDetail[]>(`/api/v1/tasks?projectId=${rawProjectId}`, `tasks_list_${rawProjectId}`, (data) => {
        currentTasksRef.current = data;
        setAllTasks(mapRawTasks(data, rawProjectId, currentProjRef.current));
      }, { forceRefresh });
    } catch (err) {
      console.error('Failed to load project details and tasks:', err);
    }
  }, [rawProjectId]);

  const fetchCredentials = React.useCallback(async (forceRefresh = false) => {
    if (!rawProjectId) return;
    try {
      await fetchWithCache<CredentialItem[]>(
        `/api/v1/credentials?projectId=${rawProjectId}`,
        `credentials_${rawProjectId}`,
        (data) => {
          if (Array.isArray(data)) setCredentials(data);
        },
        { forceRefresh }
      );
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    }
  }, [rawProjectId]);

  const fetchNotes = React.useCallback(async (forceRefresh = false) => {
    if (!rawProjectId) return;
    try {
      await fetchWithCache<NoteItem[]>(
        `/api/v1/notes?projectId=${rawProjectId}`,
        `notes_${rawProjectId}`,
        (data) => {
          if (Array.isArray(data) && data.length > 0) setNotes(data);
        },
        { forceRefresh }
      );
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  }, [rawProjectId]);

  React.useEffect(() => {
    fetchProjectAndTasks(false);
    fetchCredentials(false);
    fetchNotes(false);

    const handleUpdate = () => {
      fetchProjectAndTasks(true);
    };
    const handleCredsUpdate = () => {
      fetchCredentials(true);
    };
    const handleNotesUpdate = () => {
      fetchNotes(true);
    };

    window.addEventListener('projectsUpdated', handleUpdate);
    window.addEventListener('tasksUpdated', handleUpdate);
    window.addEventListener('taskUpdated', handleUpdate);
    window.addEventListener('credentialsUpdated', handleCredsUpdate);
    window.addEventListener('notesUpdated', handleNotesUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleUpdate);
      window.removeEventListener('tasksUpdated', handleUpdate);
      window.removeEventListener('taskUpdated', handleUpdate);
      window.removeEventListener('credentialsUpdated', handleCredsUpdate);
      window.removeEventListener('notesUpdated', handleNotesUpdate);
    };
  }, [fetchProjectAndTasks, fetchCredentials, fetchNotes]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTaskColumn, setActiveTaskColumn] = useState<'To Do' | 'In Progress' | 'Completed'>('To Do');
  const [dragOverColumn, setDragOverColumn] = useState<'To Do' | 'In Progress' | 'Completed' | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleAddTask = async (newTask: { title: string; priority: 'High Priority' | 'Medium Priority' | 'Low Priority' }) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const mappedPrio = newTask.priority === 'High Priority' ? 'high' : newTask.priority === 'Medium Priority' ? 'medium' : 'low';
      const mappedStatus = activeTaskColumn === 'Completed' ? 'completed' : activeTaskColumn === 'In Progress' ? 'in-progress' : 'todo';

      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTask.title,
          priority: mappedPrio,
          status: mappedStatus,
          projectId: projectDetail?.id || rawProjectId || 'proj-1',
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        invalidateClientCache(['tasks_list', 'dashboard_tasks', 'projects_list', `project_detail_${rawProjectId}`]);
        window.dispatchEvent(new Event('tasksUpdated'));
        fetchProjectAndTasks(true);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleMoveTask = async (taskId: string, targetStatus: 'To Do' | 'In Progress' | 'Completed') => {
    // 1. Optimistic Update IMMEDIATELY (0ms latency!)
    const previousTasks = [...allTasks];
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const mappedStatus = targetStatus === 'Completed' ? 'completed' : targetStatus === 'In Progress' ? 'in-progress' : 'todo';

      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: mappedStatus }),
      });

      const resData = await res.json();
      if (resData.success) {
        invalidateClientCache(['tasks_list', 'dashboard_tasks', `project_detail_${rawProjectId}`]);
        window.dispatchEvent(new Event('tasksUpdated'));
      } else {
        setAllTasks(previousTasks);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      setAllTasks(previousTasks);
    }
  };

  // Edit Task States
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const handleUpdateTask = async (updated: { id: string; title: string; priority: 'High Priority' | 'Medium Priority' | 'Low Priority'; comment?: string }) => {
    const previousTasks = [...allTasks];
    setAllTasks(prev => prev.map(t => t.id === updated.id ? { 
      ...t, 
      title: updated.title, 
      prio: updated.priority, 
      prioBg: updated.priority === 'High Priority' ? 'bg-[#FF6B6B]' : updated.priority === 'Medium Priority' ? 'bg-[#FFD93D]' : 'bg-[#C4B5FD]', 
      comment: updated.comment || t.comment 
    } : t));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const mappedPrio = updated.priority === 'High Priority' ? 'high' : updated.priority === 'Medium Priority' ? 'medium' : 'low';

      const res = await fetch(`/api/v1/tasks/${updated.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: updated.title,
          priority: mappedPrio,
          description: updated.comment || '',
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        invalidateClientCache(['tasks_list', 'dashboard_tasks', `project_detail_${rawProjectId}`]);
        window.dispatchEvent(new Event('tasksUpdated'));
      } else {
        setAllTasks(previousTasks);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setAllTasks(previousTasks);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const previousTasks = [...allTasks];
    setAllTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        invalidateClientCache(['tasks_list', 'dashboard_tasks', `project_detail_${rawProjectId}`]);
        window.dispatchEvent(new Event('tasksUpdated'));
      } else {
        setAllTasks(previousTasks);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      setAllTasks(previousTasks);
    }
  };

  // Credentials States
  const [credentials, setCredentials] = useState<CredentialItem[]>(() => {
    if (typeof window !== 'undefined' && rawProjectId) {
      return clientCache.get<CredentialItem[]>(`credentials_${rawProjectId}`).data || [];
    }
    return [];
  });
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleFieldVisibility = (credId: string, idx: number) => {
    const key = `${credId}-${idx}`;
    setVisibleFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCreateCredential = async (newCred: { title: string; category: string; fields: CredentialField[] }) => {
    const catBgs: Record<string, string> = {
      'Development': 'bg-[#FFEAEA] text-[#B91C1C]',
      'Backend': 'bg-[#DCFCE7] text-[#15803D]',
      'Deployment': 'bg-[#F3E8FF] text-[#7C3AED]',
      'Payment': 'bg-[#FEF3C7] text-[#D97706]',
      'Email Service': 'bg-[#E0F2FE] text-[#0369A1]',
      'Storage': 'bg-[#E0F2FE] text-[#0369A1]',
      'Database & Auth': 'bg-[#DCFCE7] text-[#15803D]',
    };

    const bg = catBgs[newCred.category] || 'bg-[#F3E8FF] text-[#7C3AED]';

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/credentials', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: rawProjectId,
          title: newCred.title,
          category: newCred.category,
          categoryBg: bg,
          addedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          fields: newCred.fields,
        }),
      });

      if (res.ok) {
        invalidateClientCache([`credentials_${rawProjectId}`]);
        window.dispatchEvent(new Event('credentialsUpdated'));
        fetchCredentials(true);
      }
    } catch (err) {
      console.error('Error creating credential:', err);
    }
  };

  const handleDeleteCredential = async (credId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/v1/credentials/${credId}`, { method: 'DELETE', headers });
      invalidateClientCache([`credentials_${rawProjectId}`]);
      window.dispatchEvent(new Event('credentialsUpdated'));
      fetchCredentials(true);
    } catch (err) {
      console.error('Error deleting credential:', err);
      setCredentials(prev => prev.filter(c => c.id !== credId));
    }
  };

  // Derive columns
  const todoTasks = allTasks.filter(t => t.status === 'To Do');
  const inProgressTasks = allTasks.filter(t => t.status === 'In Progress');
  const completedTasksState = allTasks.filter(t => t.status === 'Completed');

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    if (typeof window !== 'undefined' && rawProjectId) {
      return clientCache.get<NoteItem[]>(`notes_${rawProjectId}`).data || [];
    }
    return [];
  });
  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  const handleAddNewNote = async () => {
    const title = prompt('Enter note title:');
    if (!title) return;
    const excerptText = prompt('Enter a short summary / description for this note:') || 'New project note created.';
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: rawProjectId,
          title,
          excerpt: excerptText,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          sections: [
            {
              heading: '1. Technical Specifications & Requirements',
              items: ['Initial requirement statement', 'Review specs and checklist'],
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        invalidateClientCache([`notes_${rawProjectId}`]);
        window.dispatchEvent(new Event('notesUpdated'));
        await fetchNotes(true);
        if (data.data?.id) setSelectedNoteId(data.data.id);
      }
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/v1/notes/${noteId}`, { method: 'DELETE', headers });
      invalidateClientCache([`notes_${rawProjectId}`]);
      window.dispatchEvent(new Event('notesUpdated'));
      fetchNotes(true);
    } catch (err) {
      console.error('Error deleting note:', err);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 pb-32 sm:pb-40 md:pb-44 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 mb-6">
        <Link href="/projects" className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Projects</span>
        </Link>

        <button 
          onClick={() => setIsProjectSettingsOpen(true)}
          className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Settings className="w-4 h-4 stroke-[2.5]" />
          <span>Project Settings</span>
        </button>
      </div>

      <div className="max-w-[1440px] mx-auto">
        
        {/* ========================================================================= */}
        {/* PROJECT SUMMARY HEADER */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          
          {/* Left: Sticker Icon & Title & Description */}
          <div className="flex items-start gap-4 max-w-2xl">
            <div className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-3 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0 text-black",
              activeTab === 'activity' ? 'bg-[#C4B5FD]' : activeTab === 'notes' ? 'bg-[#FFD93D]' : 'bg-[#FF6B6B]'
            )}>
              {activeTab === 'activity' ? (
                <Activity className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              ) : activeTab === 'notes' ? (
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              ) : activeTab === 'credentials' ? (
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              ) : (
                <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-2">
                <span>{projectDetail?.title || 'Project Workspace'}</span>
                <span className="inline-block font-mono font-bold text-[#1E1B4B]/35 opacity-60 text-2xl md:text-3xl select-none">
                  \ \ \
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-bold text-zinc-600 mt-1.5 leading-relaxed">
                {activeTab === 'activity'
                  ? "Track all the activities and changes happening in this project."
                  : activeTab === 'notes'
                  ? "Manage and organize all your project notes in one place."
                  : activeTab === 'credentials'
                  ? "Manage all your project credentials and secure keys in one place."
                  : projectDetail?.description || "Manage project tasks, notes, and credentials."
                }
              </p>
            </div>
          </div>

          {/* Center/Right Info Boxes & Add CTA Button */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            
            {/* Overall Progress Box */}
            <div className="bg-white border-3 border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[220px]">
              <div className="flex items-center justify-between text-xs font-black mb-1.5">
                <span className="text-zinc-600">Project Progress</span>
                <span className="text-[#FF6B6B] text-sm">
                  {allTasks.length > 0 ? Math.round((completedTasksState.length / allTasks.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-150 rounded-full border-2 border-black overflow-hidden relative mb-1.5">
                <div 
                  className="h-full bg-[#FF6B6B] rounded-full border-r-2 border-black" 
                  style={{ width: `${allTasks.length > 0 ? Math.round((completedTasksState.length / allTasks.length) * 100) : 0}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-zinc-500">
                {completedTasksState.length} of {allTasks.length} tasks completed
              </div>
            </div>

            {/* Due Date Box */}
            <div className="bg-white border-3 border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-50 border-2 border-black flex items-center justify-center text-zinc-700 shrink-0">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-zinc-400">Due Date</div>
                <div className="text-xs sm:text-sm font-black text-[#B91C1C]">
                  {projectDetail?.dueDate || 'No Due Date'}
                </div>
              </div>
            </div>

            {/* Add Action Button */}
            <button 
              onClick={() => {
                if (activeTab === 'notes') {
                  handleAddNewNote();
                } else if (activeTab === 'credentials') {
                  setIsCredentialModalOpen(true);
                } else {
                  setActiveTaskColumn('To Do');
                  setIsTaskModalOpen(true);
                }
              }}
              className="bg-[#FF6B6B] text-black font-black text-sm px-5 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>
                {activeTab === 'notes' ? 'Add Note' : activeTab === 'credentials' ? 'Add Credential' : 'Add Task'}
              </span>
            </button>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* TAB BAR NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {/* Tab: Tasks */}
          <button 
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl border-3 border-black flex items-center gap-2 cursor-pointer shrink-0 transition-all",
              activeTab === 'tasks'
                ? "bg-[#FF6B6B] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-zinc-50 text-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            )}
          >
            <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Tasks</span>
          </button>

          {/* Tab: Credentials */}
          <button 
            onClick={() => setActiveTab('credentials')}
            className={cn(
              "font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl border-3 border-black flex items-center gap-2 cursor-pointer shrink-0 transition-all",
              activeTab === 'credentials'
                ? "bg-[#FF6B6B] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-zinc-50 text-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            )}
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Credentials</span>
          </button>

          {/* Tab: Notes */}
          <button 
            onClick={() => setActiveTab('notes')}
            className={cn(
              "font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl border-3 border-black flex items-center gap-2 cursor-pointer shrink-0 transition-all",
              activeTab === 'notes'
                ? "bg-[#FF6B6B] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-zinc-50 text-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            )}
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>Notes</span>
          </button>


        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT: TASKS VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            
            {/* KANBAN BOARD SECTION (9 Columns) */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* COLUMN 1: TO DO */}
              <div className="bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-full">
                <div className="bg-[#FF6B6B] border-b-3 border-black p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-black stroke-[2.5]" />
                    <span className="font-black text-sm text-black uppercase tracking-wider">To Do</span>
                    <span className="w-5 h-5 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      {todoTasks.length}
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTaskColumn('To Do');
                      setIsTaskModalOpen(true);
                    }}
                    className="bg-white text-black font-black text-[10px] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverColumn !== 'To Do') setDragOverColumn('To Do');
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain');
                    handleMoveTask(taskId, 'To Do');
                    setDragOverColumn(null);
                    setDraggedTaskId(null);
                  }}
                  className={cn(
                    "p-3.5 space-y-3.5 bg-[#FAF8F5] flex-1 transition-all duration-200 min-h-[450px]",
                    dragOverColumn === 'To Do' ? "bg-red-50/70 border-t-2 border-dashed border-[#FF6B6B]" : ""
                  )}
                >
                  {todoTasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      layout
                      draggable
                      onDragStart={(e) => {
                        const dragEvent = e as unknown as React.DragEvent<HTMLDivElement>;
                        dragEvent.dataTransfer.setData('text/plain', task.id);
                        dragEvent.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => setDraggedTaskId(null)}
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 1 }}
                      className={cn(
                        "cursor-grab active:cursor-grabbing bg-white border-2 border-black p-4 rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] space-y-3 transition-all duration-200",
                        draggedTaskId === task.id ? "opacity-25 border-dashed scale-95 shadow-none bg-zinc-50/50" : "opacity-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-sm text-black">{task.title}</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setIsEditTaskModalOpen(true);
                          }}
                          className="text-zinc-400 hover:text-black cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-600">
                        <div className="flex items-center gap-1">
                          <span className={cn("w-2 h-2 rounded-full", task.prioBg)} />
                          <span>{task.prio}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{task.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 pt-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{task.count} {task.count === 1 ? 'Comment' : 'Comments'}</span>
                      </div>

                      {/* Personal Task Note Callout */}
                      {task.comment && (
                        <div className="bg-[#F3E8FF] border border-black/20 p-2.5 rounded-lg flex items-start gap-2 text-xs">
                          <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED] stroke-[2.5] shrink-0 mt-0.5" />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-black text-[11px]">Note</span>
                              <span className="text-[10px] font-bold text-zinc-400">{task.time}</span>
                            </div>
                            <p className="text-[11px] font-bold text-zinc-600 leading-tight mt-0.5">
                              {task.comment}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* COLUMN 2: IN PROGRESS */}
              <div className="bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-full">
                <div className="bg-[#FFD93D] border-b-3 border-black p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-black stroke-[2.5]" />
                    <span className="font-black text-sm text-black uppercase tracking-wider">In Progress</span>
                    <span className="w-5 h-5 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      {inProgressTasks.length}
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTaskColumn('In Progress');
                      setIsTaskModalOpen(true);
                    }}
                    className="bg-white text-black font-black text-[10px] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverColumn !== 'In Progress') setDragOverColumn('In Progress');
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain');
                    handleMoveTask(taskId, 'In Progress');
                    setDragOverColumn(null);
                    setDraggedTaskId(null);
                  }}
                  className={cn(
                    "p-3.5 space-y-3.5 bg-[#FAF8F5] flex-1 transition-all duration-200 min-h-[450px]",
                    dragOverColumn === 'In Progress' ? "bg-amber-50/70 border-t-2 border-dashed border-[#FFD93D]" : ""
                  )}
                >
                  {inProgressTasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      layout
                      draggable
                      onDragStart={(e) => {
                        const dragEvent = e as unknown as React.DragEvent<HTMLDivElement>;
                        dragEvent.dataTransfer.setData('text/plain', task.id);
                        dragEvent.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => setDraggedTaskId(null)}
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 1 }}
                      className={cn(
                        "cursor-grab active:cursor-grabbing bg-white border-2 border-black p-4 rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] space-y-3 transition-all duration-200",
                        draggedTaskId === task.id ? "opacity-25 border-dashed scale-95 shadow-none bg-zinc-50/50" : "opacity-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-sm text-black">{task.title}</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setIsEditTaskModalOpen(true);
                          }}
                          className="text-zinc-400 hover:text-black cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-600">
                        <div className="flex items-center gap-1">
                          <span className={cn("w-2 h-2 rounded-full", task.prioBg)} />
                          <span>{task.prio}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{task.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 pt-0.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{task.count} Comments</span>
                      </div>

                      {/* Personal Task Note Callout */}
                      {task.comment && (
                        <div className="bg-[#F3E8FF] border border-black/20 p-2.5 rounded-lg flex items-start gap-2 text-xs">
                          <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED] stroke-[2.5] shrink-0 mt-0.5" />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-black text-[11px]">Note</span>
                              <span className="text-[10px] font-bold text-zinc-400">{task.time}</span>
                            </div>
                            <p className="text-[11px] font-bold text-zinc-600 leading-tight mt-0.5">
                              {task.comment}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* COLUMN 3: COMPLETED */}
              <div className="bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-full">
                <div className="bg-[#C4B5FD] border-b-3 border-black p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-black stroke-[2.5]" />
                    <span className="font-black text-sm text-black uppercase tracking-wider">Completed</span>
                    <span className="w-5 h-5 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      {completedTasksState.length}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setActiveTaskColumn('Completed');
                      setIsTaskModalOpen(true);
                    }}
                    className="bg-white text-black font-black text-[10px] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverColumn !== 'Completed') setDragOverColumn('Completed');
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain');
                    handleMoveTask(taskId, 'Completed');
                    setDragOverColumn(null);
                    setDraggedTaskId(null);
                  }}
                  className={cn(
                    "p-3.5 space-y-3.5 bg-[#FAF8F5] flex-1 transition-all duration-200 min-h-[450px]",
                    dragOverColumn === 'Completed' ? "bg-purple-50/70 border-t-2 border-dashed border-[#C4B5FD]" : ""
                  )}
                >
                  {completedTasksState.map((task) => (
                    <motion.div 
                      key={task.id} 
                      layout
                      draggable
                      onDragStart={(e) => {
                        const dragEvent = e as unknown as React.DragEvent<HTMLDivElement>;
                        dragEvent.dataTransfer.setData('text/plain', task.id);
                        dragEvent.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => setDraggedTaskId(null)}
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 1 }}
                      className={cn(
                        "cursor-grab active:cursor-grabbing bg-white border-2 border-black p-4 rounded-xl shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-all duration-200",
                        draggedTaskId === task.id ? "opacity-25 border-dashed scale-95 shadow-none bg-zinc-50/50" : "opacity-100"
                      )}
                    >
                      <div>
                        <h4 className="font-black text-sm text-black">{task.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-600 mt-1">
                          <div className="flex items-center gap-1">
                            <span className={cn("w-2 h-2 rounded-full", task.prioBg)} />
                            <span>Priority</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{task.date}</span>
                          </div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#16A34A] fill-[#DCFCE7] stroke-[2.5] shrink-0" />
                    </motion.div>
                  ))}

                  <div className="bg-[#DCFCE7] border-2 border-black p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                    <div className="text-2xl">🎉</div>
                    <div>
                      <div className="font-black text-xs text-black">Great job!</div>
                      <div className="text-[11px] font-bold text-zinc-600">
                        {"You're making excellent progress."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR PANEL SECTION (3 Columns) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* WIDGET 1: Project Summary */}
              <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-150 pb-3">
                  <BarChart3 className="w-5 h-5 text-black stroke-[2.5]" />
                  <h3 className="font-black text-sm uppercase tracking-wide text-black">
                    Project Summary
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs font-bold">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Total Tasks</span>
                    <span className="font-black text-black">30</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Completed</span>
                    <span className="font-black text-[#16A34A]">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">In Progress</span>
                    <span className="font-black text-[#D97706]">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">To Do</span>
                    <span className="font-black text-[#B91C1C]">6</span>
                  </div>

                  <div className="border-t border-zinc-200 pt-2.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Completion Rate</span>
                      <span className="font-black text-[#7C3AED] text-sm">80%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Days Remaining</span>
                      <span className="font-black text-[#B91C1C] text-sm">12 days</span>
                    </div>
                  </div>
                </div>
              </div>



            </div>

          </div>
        )}



        {/* ========================================================================= */}
        {/* TAB CONTENT: NOTES VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-xl text-black">All Notes</h3>

                  <div className="flex items-center gap-2">
                    <div className="relative w-36 sm:w-48">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                      <input 
                        type="text"
                        placeholder="Search notes..."
                        className="w-full bg-white text-black font-bold text-xs pl-8 pr-2 py-1.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-400"
                      />
                    </div>

                    <button className="bg-white text-black p-1.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer">
                      <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {notes.map((note) => {
                    const isSelected = note.id === selectedNoteId;
                    return (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 border-black cursor-pointer transition-all space-y-1.5",
                          isSelected
                            ? "bg-[#FFFBEB] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[1px]"
                            : "bg-white hover:bg-zinc-50/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-sm text-black">{note.title}</h4>
                          <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{note.date}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 line-clamp-1">
                          {note.excerpt}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={handleAddNewNote}
                  className="w-full bg-white hover:bg-[#FFFBEB] text-black font-extrabold text-xs py-3 rounded-xl border-2 border-black border-dashed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add New Note</span>
                </button>
              </div>

              <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-around text-center">
                <div className="w-10 h-10 bg-[#FFD93D] border-2 border-black rounded-xl flex items-center justify-center text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                </div>
                
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-500">Total Notes</div>
                  <div className="text-xl font-black text-[#7C3AED] mt-0.5">{notes.length}</div>
                </div>

                <div className="h-8 w-px bg-zinc-200" />

                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-500">Last Updated</div>
                  <div className="text-xs font-black text-black mt-1">{notes[0]?.date || 'N/A'}</div>
                </div>
              </div>
            </div>

            {selectedNote ? (
              <div className="lg:col-span-7 bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                      {selectedNote.title}
                    </h2>
                    <div className="text-xs font-bold text-zinc-400 mt-1">
                      Created on {selectedNote.date} • {selectedNote.updated}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="bg-white hover:bg-red-50 text-[#B91C1C] font-extrabold text-xs px-3.5 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] border-2 border-black/10 rounded-xl p-6 space-y-6 text-sm font-bold text-zinc-800">
                  {selectedNote.sections.map((section, idx) => (
                    <div key={idx} className="space-y-3 border-b border-zinc-200/60 last:border-0 pb-5 last:pb-0">
                      <h3 className="font-black text-base text-black">{section.heading}</h3>
                      <ul className="space-y-2 pl-4 list-disc marker:text-black">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="leading-relaxed text-zinc-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lg:col-span-7 bg-white border-3 border-black p-8 sm:p-12 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 bg-[#FFFBEB] border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <FileText className="w-7 h-7 text-[#D97706] stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-black uppercase tracking-wider">No Notes Created</h3>
                  <p className="text-xs font-bold text-zinc-500 max-w-sm mt-1">
                    Create a new note using the button on the left or ask AI Copilot to record architecture requirements!
                  </p>
                </div>
                <button
                  onClick={handleAddNewNote}
                  className="bg-[#FFD93D] hover:bg-[#FACC15] text-black font-black text-xs px-5 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add New Note</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB CONTENT: CREDENTIALS VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    Project Credentials
                  </h2>
                  <p className="text-xs font-bold text-zinc-500 mt-1">
                    {"All sensitive information related to this project is stored securely."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setIsCredentialModalOpen(true)}
                    className="bg-[#FFD93D] hover:bg-[#FACC15] text-black font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Credential</span>
                  </button>

                  <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Search className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search credentials..."
                      className="w-full bg-white text-black font-bold text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
                    />
                  </div>

                  <button className="bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer hover:bg-zinc-50">
                    <span>All Categories</span>
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto rounded-xl border-2 border-black bg-white">
                <table className="w-full text-left border-collapse border-b-2 border-black">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b-2 border-black text-xs font-black text-black uppercase tracking-wider">
                      <th className="px-5 py-4">Title & Fields</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Added On</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {credentials.map((cred) => (
                      <tr key={cred.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-5 py-4 space-y-2">
                          <div className="font-black text-sm text-black">{cred.title}</div>
                          
                          {/* Dynamic Key-Value Fields */}
                          <div className="space-y-1.5 mt-2">
                            {cred.fields.map((field, idx) => {
                              const isVisible = !!visibleFields[`${cred.id}-${idx}`];
                              return (
                                <div key={idx} className="flex items-center gap-2 bg-[#FAF8F5] border border-black/35 p-2 rounded-lg text-xs font-bold w-full max-w-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="text-zinc-500 shrink-0">{field.name}:</span>
                                  <span className="font-mono text-black truncate flex-1 select-all">
                                    {isVisible ? field.value : '••••••••••••••••'}
                                  </span>
                                  
                                  {/* Eye Option */}
                                  <button 
                                    onClick={() => toggleFieldVisibility(cred.id, idx)}
                                    className="text-zinc-500 hover:text-black p-1 cursor-pointer transition-colors"
                                    title={isVisible ? "Hide Value" : "Show Value"}
                                  >
                                    {isVisible ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  {/* Copy Option */}
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(field.value);
                                      alert(`${field.name} copied to clipboard!`);
                                    }}
                                    className="bg-white hover:bg-[#FFEAEA] text-black font-extrabold text-[10px] px-2 py-1 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-black/20 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                            cred.categoryBg
                          )}>
                            {cred.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-zinc-700 whitespace-nowrap">
                          {cred.addedOn}
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button 
                            onClick={() => {
                              const allVals = cred.fields.map(f => `${f.name}: ${f.value}`).join('\n');
                              navigator.clipboard.writeText(allVals);
                              alert(`All values for ${cred.title} copied to clipboard!`);
                            }}
                            className="bg-white hover:bg-[#FFEAEA] text-black font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>Copy All</span>
                          </button>

                          <button 
                            onClick={() => handleDeleteCredential(cred.id)}
                            className="bg-white hover:bg-red-50 text-[#B91C1C] font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Delete credential"
                          >
                            <Trash2 className="w-3 h-3 stroke-[2.5]" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-around text-center">
                <div className="w-10 h-10 bg-[#FAF8F5] border-2 border-black rounded-lg flex items-center justify-center text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <Calendar className="w-5 h-5 stroke-[2.5]" />
                </div>
                
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-500">Total Credentials</div>
                  <div className="text-xl font-black text-[#7C3AED] mt-0.5">{credentials.length}</div>
                </div>
 
                <div className="h-8 w-px bg-zinc-200" />
 
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-500">Last Updated</div>
                  <div className="text-xs font-black text-black mt-1">May 22, 2025</div>
                </div>
              </div>

              <div className="md:col-span-6 bg-[#F0FDF4] border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5">
                <div className="w-9 h-9 bg-white border-2 border-black rounded-lg text-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5] text-[#16A34A]" />
                </div>
                <div>
                  <div className="font-black text-xs sm:text-sm text-black">
                    {"Your data is encrypted"}
                  </div>
                  <div className="text-[11px] font-bold text-zinc-600 mt-0.5">
                    {"All credentials are securely encrypted and stored safely."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <NewTaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleAddTask}
        columnName={activeTaskColumn}
      />

      <NewCredentialModal 
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        onSubmit={handleCreateCredential}
      />

      <EditTaskModal 
        isOpen={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        task={editingTask}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {projectDetail && (
        <ProjectSettingsModal
          isOpen={isProjectSettingsOpen}
          onClose={() => setIsProjectSettingsOpen(false)}
          project={{
            id: projectDetail.id,
            title: projectDetail.title,
            description: projectDetail.description || '',
            category: projectDetail.category || 'General',
            status: (projectDetail.status as 'planning' | 'in-progress' | 'completed' | 'on-hold') || 'in-progress',
            dueDate: projectDetail.dueDate || null,
          }}
          onProjectUpdated={(updatedProject) => {
            setProjectDetail((prev) => prev ? { ...prev, ...updatedProject } : { id: updatedProject.id, title: updatedProject.title, description: updatedProject.description, category: updatedProject.category, status: updatedProject.status, dueDate: updatedProject.dueDate });
            fetchProjectAndTasks();
          }}
          onProjectDeleted={() => {
            router.push('/projects');
          }}
        />
      )}
    </div>
  );
}
