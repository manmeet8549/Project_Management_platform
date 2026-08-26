import React from 'react';
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
  BookOpen, 
  Calendar, 
  Clock, 
  LayoutGrid, 
  List, 
  ClipboardList, 
  Sparkles, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================================================================
// DATA STRUCTURE FOR PROJECT CARDS
// =========================================================================
interface ProjectCardData {
  id: string;
  title: string;
  categoryIcon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  status: 'In Progress' | 'Planning' | 'On Hold';
  statusBg: string;
  percentage: number;
  progressColor: string;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
  updatedTime: string;
}

const projectsData: ProjectCardData[] = [
  {
    id: '1',
    title: 'E-Commerce Website',
    categoryIcon: ShoppingCart,
    iconBg: 'bg-[#FF6B6B]',
    status: 'In Progress',
    statusBg: 'bg-[#FFEAEA] text-[#B91C1C]',
    percentage: 80,
    progressColor: 'bg-[#FF6B6B]',
    completedTasks: 24,
    totalTasks: 30,
    dueDate: 'Aug 30, 2025',
    updatedTime: '2h ago',
  },
  {
    id: '2',
    title: 'Portfolio Website',
    categoryIcon: Monitor,
    iconBg: 'bg-[#FFD93D]',
    status: 'In Progress',
    statusBg: 'bg-[#FFFBEB] text-[#D97706]',
    percentage: 40,
    progressColor: 'bg-[#FFD93D]',
    completedTasks: 8,
    totalTasks: 20,
    dueDate: 'Sep 10, 2025',
    updatedTime: '5h ago',
  },
  {
    id: '3',
    title: 'Mobile App Development',
    categoryIcon: Smartphone,
    iconBg: 'bg-[#C4B5FD]',
    status: 'Planning',
    statusBg: 'bg-[#F3E8FF] text-[#7C3AED]',
    percentage: 25,
    progressColor: 'bg-[#C4B5FD]',
    completedTasks: 5,
    totalTasks: 20,
    dueDate: 'Sep 25, 2025',
    updatedTime: '1d ago',
  },
  {
    id: '4',
    title: 'Marketing Campaign',
    categoryIcon: Megaphone,
    iconBg: 'bg-[#FFD93D]',
    status: 'In Progress',
    statusBg: 'bg-[#FFFBEB] text-[#D97706]',
    percentage: 60,
    progressColor: 'bg-[#FFD93D]',
    completedTasks: 12,
    totalTasks: 20,
    dueDate: 'Aug 28, 2025',
    updatedTime: '3h ago',
  },
  {
    id: '5',
    title: 'SaaS Product Dashboard',
    categoryIcon: PieChart,
    iconBg: 'bg-[#C4B5FD]',
    status: 'In Progress',
    statusBg: 'bg-[#F3E8FF] text-[#7C3AED]',
    percentage: 70,
    progressColor: 'bg-[#C4B5FD]',
    completedTasks: 21,
    totalTasks: 30,
    dueDate: 'Sep 15, 2025',
    updatedTime: '6h ago',
  },
  {
    id: '6',
    title: 'Learning Management System',
    categoryIcon: BookOpen,
    iconBg: 'bg-[#FF6B6B]',
    status: 'On Hold',
    statusBg: 'bg-[#FFEAEA] text-[#B91C1C]',
    percentage: 10,
    progressColor: 'bg-[#FF6B6B]',
    completedTasks: 2,
    totalTasks: 20,
    dueDate: 'Oct 05, 2025',
    updatedTime: '2d ago',
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* Back Button */}
      <div className="max-w-[1440px] mx-auto mb-6">
        <Link href="/dashboard" className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="max-w-[1440px] mx-auto">
        
        {/* ========================================================================= */}
        {/* PAGE HEADER */}
        {/* ========================================================================= */}
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
            <button className="bg-[#FF6B6B] text-black font-black text-sm md:text-base px-6 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEARCH & FILTERS TOOLBAR */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative flex-grow max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-600 stroke-[2.5]" />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full bg-white text-black font-bold text-sm pl-11 pr-4 py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          {/* Filters & View Controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Status Filter */}
            <div className="relative">
              <button className="bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 cursor-pointer hover:bg-zinc-50">
                <span>All Status</span>
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <button className="bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2.5 cursor-pointer hover:bg-zinc-50">
                <span>Sort: Recent</span>
                <ChevronDown className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Grid / List View Toggle Group */}
            <div className="flex items-center bg-white border-3 border-black rounded-xl p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <button className="bg-[#FF6B6B] text-black p-1.5 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button className="bg-white text-zinc-600 hover:text-black p-1.5 rounded-lg border-2 border-transparent cursor-pointer transition-colors">
                <List className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* PROJECTS CARDS GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {projectsData.map((project) => {
            const CatIcon = project.categoryIcon;
            return (
              <div
                key={project.id}
                className="bg-white border-3 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-transform hover:scale-[1.01]"
              >
                {/* Top Section: Sticker Icon & Title */}
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {/* Category Icon Sticker */}
                    <div className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 text-black",
                      project.iconBg
                    )}>
                      <CatIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                    </div>

                    {/* Title */}
                    <div className="flex-grow min-w-0 pt-0.5">
                      <h3 className="font-black text-lg sm:text-xl text-black leading-tight tracking-tight">
                        {project.title}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge & Percentage Row */}
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

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-zinc-150 rounded-full border-2 border-black overflow-hidden relative shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]">
                    <div 
                      className={cn("h-full rounded-full border-r-2 border-black transition-all duration-500", project.progressColor)}
                      style={{ width: `${project.percentage}%` }}
                    />
                  </div>

                  {/* Tasks Counter */}
                  <div className="text-xs font-bold text-zinc-700 mt-2.5">
                    {project.completedTasks} / {project.totalTasks} tasks completed
                  </div>
                </div>

                {/* Bottom Section: Due date, Timestamp & Arrow button */}
                <div className="border-t border-zinc-200 pt-3.5 mt-5 flex items-center justify-between text-xs font-bold text-zinc-500">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600 stroke-[2.5]" />
                      <span>Due: {project.dueDate}</span>
                    </div>
                    
                    <span className="text-zinc-300">|</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-zinc-600 stroke-[2.5]" />
                      <span>Updated: {project.updatedTime}</span>
                    </div>
                  </div>

                  {/* Open Project Details Button */}
                  <Link href={`/projects/${project.id}`} className="w-8 h-8 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center justify-center hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-black shrink-0 cursor-pointer">
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SUMMARY ROW */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
          
          {/* Left Summary Box: Stat Counters */}
          <div className="lg:col-span-8 bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
            
            {/* Sticker Icon */}
            <div className="w-12 h-12 bg-[#C4B5FD] rounded-xl border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <ClipboardList className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Counters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-around w-full gap-4">
              
              <div className="sm:border-r border-zinc-200 sm:pr-8 text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">Total Projects</div>
                <div className="text-2xl font-black text-black mt-0.5">6</div>
              </div>

              <div className="sm:border-r border-zinc-200 sm:pr-8 text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">In Progress</div>
                <div className="text-2xl font-black text-[#D97706] mt-0.5">4</div>
              </div>

              <div className="sm:border-r border-zinc-200 sm:pr-8 text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">Completed</div>
                <div className="text-2xl font-black text-[#16A34A] mt-0.5">0</div>
              </div>

              <div className="text-center flex-1">
                <div className="text-xs font-black text-zinc-500 uppercase">On Hold</div>
                <div className="text-2xl font-black text-[#B91C1C] mt-0.5">1</div>
              </div>

            </div>

          </div>

          {/* Right Summary Box: Encouragement Message */}
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
    </div>
  );
}
