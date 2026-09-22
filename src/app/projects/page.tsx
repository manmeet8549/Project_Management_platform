'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  ShoppingCart, 
  Monitor, 
  Smartphone, 
  Megaphone, 
  PieChart, 
  Calendar, 
  Clock, 
  LayoutGrid, 
  List, 
  ClipboardList, 
  Sparkles, 
  ChevronDown,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { ProjectSettingsModal } from '@/components/modals/ProjectSettingsModal';
import { clientCache, fetchWithCache, invalidateClientCache } from '@/lib/client/clientCache';
import { analyzeDeadline } from '@/lib/deadline';

interface ProjectCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  rawStatus: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  categoryIcon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  status: 'In Progress' | 'Planning' | 'On Hold' | 'Completed';
  statusBg: string;
  percentage: number;
  progressColor: string;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
  updatedTime: string;
}

interface RawProjectApiItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  status?: string;
  dueDate?: string | null;
}

interface RawTaskApiItem {
  id: string;
  projectId: string;
  status?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'E-Commerce': ShoppingCart,
  'SaaS Platform': PieChart,
  'Mobile App': Smartphone,
  'Marketing': Megaphone,
  'Backend': Monitor,
  'Design & Dev': Monitor,
};

const categoryBgs: Record<string, string> = {
  'E-Commerce': 'bg-[#FF6B6B]',
  'SaaS Platform': 'bg-[#FFD93D]',
  'Mobile App': 'bg-[#C4B5FD]',
  'Marketing': 'bg-[#FFD93D]',
  'Backend': 'bg-[#C4B5FD]',
};

function formatProjectCards(rawProjects: RawProjectApiItem[], rawTasks: RawTaskApiItem[]): ProjectCardData[] {
  return rawProjects.map((p: RawProjectApiItem) => {
    const projTasks = rawTasks.filter((t: RawTaskApiItem) => t.projectId === p.id);
    const completedCount = projTasks.filter((t: RawTaskApiItem) => t.status === 'done' || t.status === 'completed').length;
    const totalTasksCount = projTasks.length;
    const pct = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

    const rawStatus = p.status === 'in_progress' ? 'In Progress' : p.status === 'on_hold' ? 'On Hold' : p.status === 'completed' ? 'Completed' : 'Planning';
    const statusBg = rawStatus === 'Completed' ? 'bg-[#DCFCE7] text-[#15803D]' : rawStatus === 'In Progress' ? 'bg-[#FFEAEA] text-[#B91C1C]' : rawStatus === 'On Hold' ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#F3E8FF] text-[#7C3AED]';

    return {
      id: p.id,
      title: p.title,
      description: p.description || '',
      category: p.category || 'General',
      rawStatus: (p.status as 'planning' | 'in-progress' | 'completed' | 'on-hold') || 'in-progress',
      categoryIcon: categoryIcons[p.category] || ShoppingCart,
      iconBg: categoryBgs[p.category] || 'bg-[#FF6B6B]',
      status: rawStatus as ProjectCardData['status'],
      statusBg,
      percentage: pct,
      progressColor: pct > 75 ? 'bg-[#16A34A]' : pct > 40 ? 'bg-[#FFD93D]' : 'bg-[#FF6B6B]',
      completedTasks: completedCount,
      totalTasks: totalTasksCount,
      dueDate: p.dueDate || 'No Due Date',
      updatedTime: 'Recently',
    };
  });
}

export default function ProjectsPage() {
  const currentProjectsRef = React.useRef<RawProjectApiItem[]>([]);
  const currentTasksRef = React.useRef<RawTaskApiItem[]>([]);

  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Planning' | 'On Hold' | 'Completed'>('All');
  const [sortFilter, setSortFilter] = useState<'Recent' | 'Title' | 'Percentage'>('Recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [selectedSettingsProject, setSelectedSettingsProject] = useState<ProjectCardData | null>(null);

  const fetchProjectsData = React.useCallback((forceRefresh = false) => {
    try {
      // 1. Immediately hydrate from cache if available (0ms render on reload)
      const cachedP = clientCache.get<RawProjectApiItem[]>('projects_list').data;
      const cachedT = clientCache.get<RawTaskApiItem[]>('tasks_list').data;
      if (cachedP && cachedP.length > 0) {
        currentProjectsRef.current = cachedP;
        currentTasksRef.current = cachedT || [];
        setProjects(formatProjectCards(cachedP, cachedT || []));
      }

      // 2. Non-blocking SWR background revalidations
      fetchWithCache<RawProjectApiItem[]>('/api/v1/projects', 'projects_list', (data) => {
        currentProjectsRef.current = data;
        setProjects(formatProjectCards(data, currentTasksRef.current));
      }, { forceRefresh });

      fetchWithCache<RawTaskApiItem[]>('/api/v1/tasks', 'tasks_list', (data) => {
        currentTasksRef.current = data;
        if (currentProjectsRef.current.length > 0) {
          setProjects(formatProjectCards(currentProjectsRef.current, data));
        }
      }, { forceRefresh });
    } catch (err) {
      console.error('Failed to load projects from DB:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchProjectsData(false);

    const handleUpdate = () => {
      fetchProjectsData(true);
    };
    window.addEventListener('projectsUpdated', handleUpdate);
    window.addEventListener('tasksUpdated', handleUpdate);
    window.addEventListener('taskUpdated', handleUpdate);
    return () => {
      window.removeEventListener('projectsUpdated', handleUpdate);
      window.removeEventListener('tasksUpdated', handleUpdate);
      window.removeEventListener('taskUpdated', handleUpdate);
    };
  }, [fetchProjectsData]);

  const handleAddProject = async (newProj: { title: string; dueDate: string; description: string; category: string }) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newProj.title,
          description: newProj.description,
          category: newProj.category,
          dueDate: newProj.dueDate || null,
          status: 'planning',
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        invalidateClientCache(['projects_list', 'dashboard_projects']);
        window.dispatchEvent(new Event('projectsUpdated'));
        fetchProjectsData(true);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  };

  // Filter Projects list
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortFilter === 'Title') return a.title.localeCompare(b.title);
      if (sortFilter === 'Percentage') return b.percentage - a.percentage;
      return 0; // Default recent/unshift order
    });

  // Calculate totals
  const totalCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const onHoldCount = projects.filter(p => p.status === 'On Hold').length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 pb-32 sm:pb-40 md:pb-44 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* Back Button */}
      <div className="max-w-[1440px] mx-auto mb-6">
        <Link href="/dashboard" className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="max-w-[1440px] mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center">
              <span>Projects</span>
              <span className="inline-block ml-3 font-mono font-bold text-[#1E1B4B]/35 opacity-60 text-2xl md:text-3xl select-none">
                \ \ \
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2 max-w-xl">
              {"All your projects in one place. Select a project to view and manage its tasks, notes, and credentials."}
            </p>
          </div>

          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-black text-sm md:text-base px-6 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative flex-grow max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-600 stroke-[2.5]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-white text-black font-bold text-sm pl-11 pr-4 py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          {/* Filters & View Controls */}
          <div className="flex flex-wrap items-center gap-3 relative z-30">
            
            {/* Status Filter */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowSortDropdown(false);
                }}
                className="bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 cursor-pointer hover:bg-zinc-50"
              >
                <span>Status: {statusFilter}</span>
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 bg-white border-2 border-black rounded-xl p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] w-44 flex flex-col text-xs font-black">
                  {(['All', 'In Progress', 'Planning', 'On Hold', 'Completed'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setShowStatusDropdown(false);
                      }}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors w-full cursor-pointer",
                        statusFilter === s ? "bg-zinc-100 text-[#FF6B6B]" : "text-black"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowStatusDropdown(false);
                }}
                className="bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 cursor-pointer hover:bg-zinc-50"
              >
                <span>Sort: {sortFilter}</span>
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 bg-white border-2 border-black rounded-xl p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] w-40 flex flex-col text-xs font-black">
                  {(['Recent', 'Title', 'Percentage'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setSortFilter(s);
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors w-full cursor-pointer",
                        sortFilter === s ? "bg-zinc-100 text-[#FF6B6B]" : "text-black"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List View Toggle Group */}
            <div className="flex items-center bg-white border-3 border-black rounded-xl p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg border-2 cursor-pointer transition-colors",
                  viewMode === 'grid' ? "bg-[#FF6B6B] text-black border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-zinc-600 border-transparent"
                )}
              >
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-lg border-2 cursor-pointer transition-colors",
                  viewMode === 'list' ? "bg-[#FF6B6B] text-black border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-zinc-600 border-transparent"
                )}
              >
                <List className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>

        {/* PROJECTS LISTING RENDERING */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border-3 border-black p-8 sm:p-12 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#FFD93D] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mx-auto flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-black stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-wider mb-2">No Projects Found</h3>
            <p className="text-xs font-bold text-zinc-500 mb-6">
              There are no projects saved in the database matching your query. Create a new project or refine ideas using AI Copilot!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-black text-xs sm:text-sm px-6 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredProjects.map((project) => {
              const CatIcon = project.categoryIcon;
              return (
                <div
                  key={project.id}
                  className="bg-white border-3 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-transform hover:scale-[1.01]"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 text-black",
                        project.iconBg
                      )}>
                        <CatIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                      </div>

                      <div className="flex-grow min-w-0 pt-0.5 flex items-start justify-between">
                        <h3 className="font-black text-lg sm:text-xl text-black leading-tight tracking-tight">
                          {project.title}
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedSettingsProject(project);
                          }}
                          className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ml-2 shrink-0"
                          title="Project Settings"
                        >
                          <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={cn(
                        "px-3 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider border border-black/20 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
                        project.statusBg
                      )}>
                        {project.status}
                      </span>

                      <span className={cn("font-black text-sm sm:text-base", project.statusBg.split(' ')[1])}>
                        {project.percentage}%
                      </span>
                    </div>

                    <div className="w-full h-3 bg-zinc-150 rounded-full border-2 border-black overflow-hidden relative shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]">
                      <div 
                        className={cn("h-full rounded-full border-r-2 border-black transition-all duration-500", project.progressColor)}
                        style={{ width: `${project.percentage}%` }}
                      />
                    </div>

                    <div className="text-xs font-bold text-zinc-700 mt-2.5">
                      {project.completedTasks} / {project.totalTasks} tasks completed
                    </div>
                  </div>

                  {(() => {
                    const dl = analyzeDeadline(project.dueDate);
                    return (
                      <div className="border-t border-zinc-200 pt-3.5 mt-5 flex items-center justify-between text-xs font-bold text-zinc-500">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-zinc-600 stroke-[2.5]" />
                            <span>Due: {dl.formattedDate}</span>
                          </div>
                          {dl.hasDueDate && (
                            <span className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
                              dl.bgColor,
                              dl.textColor,
                              dl.borderColor
                            )}>
                              {dl.badgeText}
                            </span>
                          )}
                          <span className="text-zinc-300">|</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-zinc-600 stroke-[2.5]" />
                            <span>Updated: {project.updatedTime}</span>
                          </div>
                        </div>

                        <Link href={`/projects/${project.id}`} className="w-8 h-8 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-black shrink-0 cursor-pointer">
                          <ArrowRight className="w-4 h-4 stroke-[3]" />
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {filteredProjects.map((project) => {
              const CatIcon = project.categoryIcon;
              const dl = analyzeDeadline(project.dueDate);
              return (
                <div 
                  key={project.id}
                  className="bg-white border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black",
                      project.iconBg
                    )}>
                      <CatIcon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-black">{project.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold mt-0.5 flex-wrap">
                        <span>Due: {dl.formattedDate}</span>
                        {dl.hasDueDate && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded border",
                              dl.bgColor,
                              dl.textColor,
                              dl.borderColor
                            )}>
                              {dl.badgeText}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Updated: {project.updatedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded border border-black/20 text-[10px] font-black uppercase tracking-wider",
                      project.statusBg
                    )}>
                      {project.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2.5 bg-zinc-150 rounded-full border border-black overflow-hidden">
                        <div className={cn("h-full", project.progressColor)} style={{ width: `${project.percentage}%` }} />
                      </div>
                      <span className="text-xs font-black text-black">{project.percentage}%</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedSettingsProject(project);
                        }}
                        className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        title="Project Settings"
                      >
                        <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <Link href={`/projects/${project.id}`} className="w-7 h-7 bg-white border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center hover:bg-zinc-100 text-black cursor-pointer">
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM SUMMARY ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
          <div className="lg:col-span-8 bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
            
            <div className="w-12 h-12 bg-[#C4B5FD] rounded-xl border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <ClipboardList className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-around w-full gap-4">
              <div className="sm:border-r border-zinc-200 sm:pr-8 text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">Total Projects</div>
                <div className="text-2xl font-black text-black mt-0.5">{totalCount}</div>
              </div>

              <div className="sm:border-r border-zinc-200 sm:pr-8 text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">In Progress</div>
                <div className="text-2xl font-black text-[#D97706] mt-0.5">{inProgressCount}</div>
              </div>

              <div className="sm:border-r border-zinc-200 sm:pr-8 text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">Completed</div>
                <div className="text-2xl font-black text-[#16A34A] mt-0.5">{completedCount}</div>
              </div>

              <div className="text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">On Hold</div>
                <div className="text-2xl font-black text-[#B91C1C] mt-0.5">{onHoldCount}</div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-4 bg-[#F3E8FF] border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-[#7C3AED] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            
            <div>
              <div className="font-black text-sm text-black">
                {"Keep up the good work!"}
              </div>
              <p className="text-xs font-bold text-zinc-600 mt-0.5">
                {"You're making great progress."}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* New Project Modal Popup */}
      <NewProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProject}
      />

      {/* Project Settings Modal */}
      {selectedSettingsProject && (
        <ProjectSettingsModal
          isOpen={!!selectedSettingsProject}
          onClose={() => setSelectedSettingsProject(null)}
          project={{
            id: selectedSettingsProject.id,
            title: selectedSettingsProject.title,
            description: selectedSettingsProject.description || '',
            category: selectedSettingsProject.category || 'General',
            status: (selectedSettingsProject.rawStatus || 'in-progress'),
            dueDate: selectedSettingsProject.dueDate === 'No Due Date' ? null : selectedSettingsProject.dueDate,
          }}
          onProjectUpdated={() => {
            fetchProjectsData();
          }}
          onProjectDeleted={() => {
            setSelectedSettingsProject(null);
            fetchProjectsData();
          }}
        />
      )}
    </div>
  );
}
