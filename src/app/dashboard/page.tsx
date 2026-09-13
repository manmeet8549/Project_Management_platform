'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { useAuth } from '@/components/auth/AuthGuard';
import { 
  Folder, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  BarChart3, 
  LineChart, 
  Sparkles, 
  Plus, 
  Activity, 
  ArrowLeft,
  Bot,
  FolderPlus,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithCache, invalidateClientCache } from '@/lib/client/clientCache';

interface ProjectApiItem {
  id: string;
  title: string;
  category?: string;
  status?: string;
  dueDate?: string | null;
}

interface TaskApiItem {
  id: string;
  title: string;
  status?: string;
  dueDate?: string | null;
}

// =========================================================================
// REUSABLE NEO-BRUTALIST COMPONENT: DashboardCard
// =========================================================================
interface DashboardCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBg: string; // Tailwind bg class
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function DashboardCard({ 
  title, 
  icon: Icon, 
  headerBg, 
  action, 
  children,
  className 
}: DashboardCardProps) {
  return (
    <div className={cn(
      "bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col",
      className
    )}>
      {/* Header bar */}
      <div className={cn("border-b-3 border-black px-4 py-3.5 flex items-center justify-between", headerBg)}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 stroke-[2.5]" />
          <h3 className="font-black uppercase tracking-wider text-sm sm:text-base text-black">
            {title}
          </h3>
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
      
      {/* Body content */}
      <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

// =========================================================================
// DASHBOARD PAGE MAIN COMPONENT
// =========================================================================
export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState<ProjectApiItem[]>([]);
  const [tasks, setTasks] = useState<TaskApiItem[]>([]);

  const fetchDashboardData = React.useCallback(async (forceRefresh = false) => {
    fetchWithCache<ProjectApiItem[]>('/api/v1/projects', 'dashboard_projects', (data) => {
      setProjects(data);
    }, { forceRefresh });

    fetchWithCache<TaskApiItem[]>('/api/v1/tasks', 'dashboard_tasks', (data) => {
      setTasks(data);
    }, { forceRefresh });
  }, []);

  useEffect(() => {
    fetchDashboardData(true);

    const handleUpdate = () => fetchDashboardData(true);
    window.addEventListener('projectsUpdated', handleUpdate);
    window.addEventListener('tasksUpdated', handleUpdate);
    window.addEventListener('taskUpdated', handleUpdate);

    return () => {
      window.removeEventListener('projectsUpdated', handleUpdate);
      window.removeEventListener('tasksUpdated', handleUpdate);
      window.removeEventListener('taskUpdated', handleUpdate);
    };
  }, [user?.id, fetchDashboardData]);

  const handleCreateProject = async (p: { title: string; description: string; category: string; dueDate: string }) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: p.title,
          description: p.description,
          category: p.category,
          dueDate: p.dueDate || null,
          status: 'planning',
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        invalidateClientCache(['dashboard_projects', 'projects_list']);
        window.dispatchEvent(new Event('projectsUpdated'));
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error('Failed to create project from dashboard:', err);
    }
  };

  // Dynamic Calculated Metrics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const inProgressProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const onHoldProjects = projects.filter(p => p.status === 'on-hold' || p.status === 'on_hold').length;
  const planningProjects = projects.filter(p => p.status === 'planning').length;

  // Upcoming Deadlines
  const upcomingItems = [
    ...projects.filter(p => p.dueDate).map(p => ({ id: p.id, name: p.title, date: p.dueDate, type: 'project' })),
    ...tasks.filter(t => t.dueDate).map(t => ({ id: t.id, name: t.title, date: t.dueDate, type: 'task' }))
  ].slice(0, 5);

  // Recent Activities
  const recentActivities = [
    ...tasks.slice(0, 3).map((t, idx) => ({
      id: `act-task-${t.id || idx}`,
      text: `Task "${t.title}" (${t.status})`,
      time: 'Recently updated',
      icon: CheckCircle2,
      iconBg: t.status === 'done' || t.status === 'completed' ? 'bg-[#C4B5FD]' : 'bg-[#FFD93D]',
      iconColor: 'text-black'
    })),
    ...projects.slice(0, 2).map((p, idx) => ({
      id: `act-proj-${p.id || idx}`,
      text: `Project "${p.title}" created in ${p.category || 'General'}`,
      time: 'Recently added',
      icon: FolderPlus,
      iconBg: 'bg-[#FF6B6B]',
      iconColor: 'text-white'
    }))
  ];

  // Stat Card configuration data
  const stats = [
    {
      title: 'Total Projects',
      value: totalProjects.toString(),
      subtext: `${inProgressProjects} in progress`,
      subtextColor: 'text-[#B91C1C]',
      icon: Folder,
      iconBg: 'bg-[#FF6B6B]',
      iconColor: 'text-white',
    },
    {
      title: 'Total Tasks',
      value: totalTasks.toString(),
      subtext: `${pendingTasks} pending`,
      subtextColor: 'text-[#D97706]',
      icon: CheckSquare,
      iconBg: 'bg-[#FFD93D]',
      iconColor: 'text-black',
    },
    {
      title: 'Completed Tasks',
      value: completedTasks.toString(),
      subtext: `${completionPercentage}% overall completion`,
      subtextColor: 'text-[#7C3AED]',
      icon: CheckCircle2,
      iconBg: 'bg-[#C4B5FD]',
      iconColor: 'text-black',
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks.toString(),
      subtext: `${completedTasks} completed`,
      subtextColor: 'text-[#D97706]',
      icon: Clock,
      iconBg: 'bg-[#FFD93D]',
      iconColor: 'text-black',
    },
    {
      title: 'Upcoming Deadlines',
      value: upcomingItems.length.toString(),
      subtext: upcomingItems[0] ? `Next: ${upcomingItems[0].date}` : 'No upcoming deadlines',
      subtextColor: 'text-[#7C3AED]',
      icon: Calendar,
      iconBg: 'bg-[#C4B5FD]',
      iconColor: 'text-black',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 pb-32 sm:pb-40 md:pb-44 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* Back Button to Landing Page & User Profile Pill */}
      <div className="max-w-[1440px] mx-auto mb-6 flex items-center justify-between">
        <Link href="/" className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Home</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <div className="bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-xs font-black text-black">
              <div className="w-5 h-5 rounded bg-[#FFD93D] border border-black flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-black stroke-[3]" />
              </div>
              <span>{user.name}</span>
              <span className="text-[10px] bg-[#C4B5FD] px-1.5 py-0.5 rounded border border-black uppercase">{user.role}</span>
            </div>

            <button
              onClick={logout}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white font-extrabold text-xs px-3 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              title="Sign out of account"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>

      <div className="max-w-[1440px] mx-auto">
        
        {/* ========================================================================= */}
        {/* DASHBOARD HEADER */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center">
              <span>Dashboard</span>
              <span className="inline-block ml-3 font-mono font-bold text-[#1E1B4B]/35 opacity-60 text-2xl md:text-3xl select-none">
                \ \ \
              </span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
              Welcome back, <span className="text-black font-black">{user?.name || 'Developer'}</span>! Here&apos;s what&apos;s happening with your projects.
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

        {/* ========================================================================= */}
        {/* ROW 1: 5 STAT CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx}
                className="bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-row items-center gap-4 transition-transform hover:scale-[1.02]"
              >
                {/* Sticker Icon Box */}
                <div className={cn(
                  "w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0",
                  stat.iconBg,
                  stat.iconColor
                )}>
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>

                {/* Info Text */}
                <div className="flex-grow min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-zinc-700 tracking-tight leading-tight">
                    {stat.title}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-black leading-tight mt-1">
                    {stat.value}
                  </div>
                  
                  {/* Thin divider & subtext */}
                  <div className="border-t border-zinc-150 pt-1.5 mt-1.5">
                    <span className={cn("text-xs font-bold tracking-tight", stat.subtextColor)}>
                      {stat.subtext}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* ROW 2: DETAILED WIDGETS GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* 1. Projects Overview (Donut Chart SVG) */}
          <DashboardCard
            title="Projects Overview"
            icon={BarChart3}
            headerBg="bg-[#FF6B6B]"
            className="lg:col-span-5"
            action={
              <button onClick={() => fetchDashboardData(true)} className="bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-md border-2 border-black hover:bg-zinc-50 transition-colors cursor-pointer">
                Refresh Database
              </button>
            }
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              
              {/* Donut SVG Illustration */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E4E4E7" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#C4B5FD" strokeWidth="12" strokeDasharray={`${(inProgressProjects / (totalProjects || 1)) * 251.3} 251.3`} strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FFD93D" strokeWidth="12" strokeDasharray={`${(completedProjects / (totalProjects || 1)) * 251.3} 251.3`} strokeDashoffset={`-${(inProgressProjects / (totalProjects || 1)) * 251.3}`} />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FF6B6B" strokeWidth="12" strokeDasharray={`${(onHoldProjects / (totalProjects || 1)) * 251.3} 251.3`} strokeDashoffset={`-${((inProgressProjects + completedProjects) / (totalProjects || 1)) * 251.3}`} />
                  
                  <circle cx="50" cy="50" r="46" fill="transparent" stroke="black" strokeWidth="1" />
                  <circle cx="50" cy="50" r="34" fill="transparent" stroke="black" strokeWidth="1" />
                </svg>
                <div className="absolute inset-[17%] bg-white rounded-full border-2 border-black flex items-center justify-center font-black text-sm">
                  {totalProjects}
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex-grow space-y-2 w-full sm:w-auto">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#C4B5FD] border border-black" />
                    <span className="text-zinc-600">In Progress</span>
                  </div>
                  <span>{inProgressProjects}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FFD93D] border border-black" />
                    <span className="text-zinc-600">Completed</span>
                  </div>
                  <span>{completedProjects}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF6B6B] border border-black" />
                    <span className="text-zinc-600">On Hold</span>
                  </div>
                  <span>{onHoldProjects}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#121210] border border-black" />
                    <span className="text-zinc-600">Planning</span>
                  </div>
                  <span>{planningProjects}</span>
                </div>
              </div>
            </div>

            {/* Bottom Total Project Card Box */}
            <div className="bg-[#FAF8F5] border-2 border-black p-3.5 rounded-xl flex items-center justify-between text-xs font-black mt-4">
              <span className="text-zinc-700">Total Database Projects</span>
              <span>{totalProjects}</span>
            </div>
          </DashboardCard>

          {/* 2. Task Progress (Completion ring SVG) */}
          <DashboardCard
            title="Task Progress"
            icon={LineChart}
            headerBg="bg-[#FFD93D]"
            className="lg:col-span-3 text-center"
          >
            <div className="flex flex-col items-center justify-center py-4 gap-6">
              
              {/* Circular Progress Gauge */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#E4E4E7" strokeWidth="10" strokeDasharray="263.9" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#FFD93D" strokeWidth="10" strokeDasharray={`${(completionPercentage / 100) * 263.9} 263.9`} strokeDashoffset="0" strokeLinecap="round" />
                  
                  <circle cx="50" cy="50" r="47" fill="transparent" stroke="black" strokeWidth="1" />
                  <circle cx="50" cy="50" r="37" fill="transparent" stroke="black" strokeWidth="1" />
                </svg>
                
                <div className="absolute font-black text-2xl text-black">
                  {completionPercentage}%
                </div>
              </div>

              {/* Metric stats below */}
              <div className="space-y-1">
                <div className="font-black text-sm uppercase tracking-wide text-black">
                  Overall Completion
                </div>
                <div className="text-xs font-bold text-zinc-500">
                  {completedTasks} of {totalTasks} tasks completed
                </div>
              </div>

            </div>
          </DashboardCard>

          {/* 3. Upcoming Deadlines (Item list with date badges) */}
          <DashboardCard
            title="Upcoming Deadlines"
            icon={Calendar}
            headerBg="bg-[#C4B5FD]"
            className="lg:col-span-4"
          >
            <div className="space-y-3.5 py-1">
              {upcomingItems.length > 0 ? (
                upcomingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-zinc-150 pb-2.5 last:border-0 last:pb-0 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn("w-2.5 h-2.5 rounded-full border border-black shrink-0", item.type === 'project' ? "bg-[#FF6B6B]" : "bg-[#FFD93D]")} />
                      <span className="font-extrabold text-black truncate">{item.name}</span>
                    </div>
                    <span className="bg-[#FFEAEA] border-2 border-black text-[#B91C1C] font-black text-[10px] px-2.5 py-0.5 rounded-md shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] shrink-0">
                      {item.date}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-bold text-zinc-500 italic py-6 text-center">
                  No upcoming deadlines found in database.
                </div>
              )}
            </div>
          </DashboardCard>

        </div>

        {/* ========================================================================= */}
        {/* ROW 3: RECENT ACTIVITY & AI PRODUCTIVITY INSIGHT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. Recent Activity Card */}
          <DashboardCard
            title="Recent Activity"
            icon={Activity}
            headerBg="bg-[#C4B5FD]"
            action={
              <button onClick={() => fetchDashboardData(true)} className="bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-md border-2 border-black hover:bg-zinc-50 transition-colors cursor-pointer">
                Refresh
              </button>
            }
          >
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const ActIcon = activity.icon;
                  return (
                    <div key={activity.id} className="flex items-center justify-between border-b border-zinc-150 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn("w-9 h-9 rounded-lg border border-black flex items-center justify-center shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0", activity.iconBg, activity.iconColor)}>
                          <ActIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-zinc-700 truncate pr-2">{activity.text}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-zinc-400 shrink-0">{activity.time}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs font-bold text-zinc-500 italic py-6 text-center">
                  No recent activities recorded yet.
                </div>
              )}
            </div>
          </DashboardCard>

          {/* 2. AI Productivity Insight Card */}
          <DashboardCard
            title="AI Productivity Insight"
            icon={Sparkles}
            headerBg="bg-[#FF6B6B]"
          >
            <div className="flex flex-col gap-6 h-full justify-between">
              
              {/* Dialogue Bubble */}
              <div className="bg-[#FAF8F5] border-2 border-black p-4 rounded-xl flex items-start gap-4 shadow-[3px_3px_0px_rgba(0,0,0,1)] relative">
                
                {/* Robot face sticker avatar */}
                <div className="w-11 h-11 rounded-lg bg-[#FF6B6B] border border-black flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] text-white shrink-0">
                  <Bot className="w-6 h-6 stroke-[2]" />
                </div>

                {/* Dialogue Text */}
                <div className="space-y-1 flex-grow">
                  <div className="font-black text-xs sm:text-sm text-black flex items-center gap-1.5">
                    <span>{`Welcome ${user?.name || 'User'}!`}</span>
                    <span>🚀</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 leading-normal max-w-sm">
                    {totalTasks > 0
                      ? `You currently have ${completedTasks} completed out of ${totalTasks} total tasks in your workspace database.`
                      : 'You have no tasks created yet. Use AI Copilot or New Task to generate your first task list!'}
                  </p>
                </div>

              </div>

              {/* Bottom Custom SVG Graph illustration with trend arrow */}
              <div className="flex items-end justify-between px-2 pt-2 border-t border-zinc-150 relative">
                
                <div className="flex items-end gap-3.5 h-16 w-3/5 pb-1 relative z-10">
                  <div className="w-5 h-4 bg-[#FF6B6B] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                  <div className="w-5 h-8 bg-[#FFD93D] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                  <div className="w-5 h-10 bg-[#FFD93D] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                  <div className="w-5 h-14 bg-[#C4B5FD] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                </div>

                <div className="absolute bottom-2 left-2 w-4/5 h-20 pointer-events-none z-20">
                  <svg className="w-full h-full" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 68 L48 48 L86 44 L126 14" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M116 12 L128 12 L126 24" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

            </div>
          </DashboardCard>

        </div>

      </div>

      <NewProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
