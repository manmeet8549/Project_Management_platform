'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
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
  ArrowRight,
  Bot,
  CalendarDays,
  FolderPlus,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Stat Card configuration data
  const stats = [
    {
      title: 'Total Projects',
      value: '12',
      subtext: '↑ 2 this month',
      subtextColor: 'text-[#B91C1C]',
      icon: Folder,
      iconBg: 'bg-[#FF6B6B]',
      iconColor: 'text-white',
    },
    {
      title: 'Total Tasks',
      value: '48',
      subtext: '↑ 8 this week',
      subtextColor: 'text-[#D97706]',
      icon: CheckSquare,
      iconBg: 'bg-[#FFD93D]',
      iconColor: 'text-black',
    },
    {
      title: 'Completed Tasks',
      value: '24',
      subtext: '↑ 12 this week',
      subtextColor: 'text-[#7C3AED]',
      icon: CheckCircle2,
      iconBg: 'bg-[#C4B5FD]',
      iconColor: 'text-black',
    },
    {
      title: 'Pending Tasks',
      value: '24',
      subtext: '↓ 4 this week',
      subtextColor: 'text-[#D97706]',
      icon: Clock,
      iconBg: 'bg-[#FFD93D]',
      iconColor: 'text-black',
    },
    {
      title: 'Upcoming Deadlines',
      value: '5',
      subtext: 'Next: May 28, 2025',
      subtextColor: 'text-[#7C3AED]',
      icon: Calendar,
      iconBg: 'bg-[#C4B5FD]',
      iconColor: 'text-black',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 pb-32 sm:pb-40 md:pb-44 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* Back Button to Landing Page */}
      <div className="max-w-[1440px] mx-auto mb-6">
        <Link href="/" className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Home</span>
        </Link>
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
              {"Welcome back! Here's what's happening with your projects."}
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
              <button className="bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-md border-2 border-black hover:bg-zinc-50 transition-colors cursor-pointer">
                This Month ∨
              </button>
            }
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              
              {/* Donut SVG Illustration */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Circumference = 2 * PI * r = 2 * 3.14159 * 40 = 251.3 */}
                  
                  {/* Slice 1: In Progress (5/12 = 41.7%) -> Length = 104.7 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#C4B5FD"
                    strokeWidth="12"
                    strokeDasharray="104.7 251.3"
                    strokeDashoffset="0"
                  />
                  {/* Slice 2: Completed (4/12 = 33.3%) -> Length = 83.8 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FFD93D"
                    strokeWidth="12"
                    strokeDasharray="83.8 251.3"
                    strokeDashoffset="-104.7"
                  />
                  {/* Slice 3: On Hold (2/12 = 16.7%) -> Length = 41.9 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FF6B6B"
                    strokeWidth="12"
                    strokeDasharray="41.9 251.3"
                    strokeDashoffset="-188.5"
                  />
                  {/* Slice 4: Not Started (1/12 = 8.3%) -> Length = 20.9 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#121210"
                    strokeWidth="12"
                    strokeDasharray="20.9 251.3"
                    strokeDashoffset="-230.4"
                  />
                  
                  {/* Outer black outline borders between sections (using simplified overlays or center hole) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="transparent"
                    stroke="black"
                    strokeWidth="1"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="transparent"
                    stroke="black"
                    strokeWidth="1"
                  />
                </svg>
                {/* Center Hole Cover */}
                <div className="absolute inset-[17%] bg-white rounded-full border-2 border-black flex items-center justify-center" />
              </div>

              {/* Chart Legend */}
              <div className="flex-grow space-y-2 w-full sm:w-auto">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#C4B5FD] border border-black" />
                    <span className="text-zinc-600">In Progress</span>
                  </div>
                  <span>5</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FFD93D] border border-black" />
                    <span className="text-zinc-600">Completed</span>
                  </div>
                  <span>4</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF6B6B] border border-black" />
                    <span className="text-zinc-600">On Hold</span>
                  </div>
                  <span>2</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#121210] border border-black" />
                    <span className="text-zinc-600">Not Started</span>
                  </div>
                  <span>1</span>
                </div>
              </div>
            </div>

            {/* Bottom Total Project Card Box */}
            <div className="bg-[#FAF8F5] border-2 border-black p-3.5 rounded-xl flex items-center justify-between text-xs font-black mt-4">
              <span className="text-zinc-700">Total Projects</span>
              <span>12</span>
            </div>
          </DashboardCard>

          {/* 2. Task Progress (50% Completion ring SVG) */}
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
                  {/* Circumference = 2 * PI * r = 2 * 3.14159 * 45 = 282.7 */}
                  
                  {/* Base Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#E4E4E7"
                    strokeWidth="10"
                    strokeDasharray="263.9"
                    strokeDashoffset="0"
                  />
                  {/* Progress Slice (50% Completion) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#FFD93D"
                    strokeWidth="10"
                    strokeDasharray="132 263.9"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  
                  {/* Neo-brutalist circle bounds */}
                  <circle cx="50" cy="50" r="47" fill="transparent" stroke="black" strokeWidth="1" />
                  <circle cx="50" cy="50" r="37" fill="transparent" stroke="black" strokeWidth="1" />
                </svg>
                
                {/* Center Number label */}
                <div className="absolute font-black text-2xl text-black">
                  50%
                </div>
              </div>

              {/* Metric stats below */}
              <div className="space-y-1">
                <div className="font-black text-sm uppercase tracking-wide text-black">
                  Overall Completion
                </div>
                <div className="text-xs font-bold text-zinc-500">
                  24 of 48 tasks completed
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
              {[
                { name: 'Project Landing Page', date: 'May 28', color: 'bg-[#FF6B6B]' },
                { name: 'Database Integration', date: 'May 30', color: 'bg-[#FFD93D]' },
                { name: 'AI Feature Implementation', date: 'Jun 02', color: 'bg-[#C4B5FD]' },
                { name: 'Testing & Bug Fixes', date: 'Jun 05', color: 'bg-[#121210]' },
                { name: 'Project Documentation', date: 'Jun 08', color: 'bg-[#FF6B6B]' },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between border-b border-zinc-150 pb-2.5 last:border-0 last:pb-0 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("w-2.5 h-2.5 rounded-full border border-black shrink-0", item.color)} />
                    <span className="font-extrabold text-black truncate">{item.name}</span>
                  </div>
                  
                  {/* Date Badge */}
                  <span className="bg-[#FFEAEA] border-2 border-black text-[#B91C1C] font-black text-[10px] px-2.5 py-0.5 rounded-md shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] shrink-0">
                    {item.date}
                  </span>
                </div>
              ))}
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
              <button className="bg-white text-black font-extrabold text-xs px-3 py-1.5 rounded-md border-2 border-black hover:bg-zinc-50 transition-colors cursor-pointer">
                View All
              </button>
            }
          >
            <div className="space-y-4">
              {[
                { 
                  text: 'Created a new project "AI Dashboard"', 
                  time: '2h ago',
                  icon: FolderPlus,
                  iconBg: 'bg-[#FF6B6B]',
                  iconColor: 'text-white'
                },
                { 
                  text: 'Completed task "UI Design System"', 
                  time: '5h ago',
                  icon: CheckCircle2,
                  iconBg: 'bg-[#FFD93D]',
                  iconColor: 'text-black'
                },
                { 
                  text: 'Deadline updated for "Database Integration"', 
                  time: '1d ago',
                  icon: CalendarDays,
                  iconBg: 'bg-[#C4B5FD]',
                  iconColor: 'text-black'
                },
                { 
                  text: 'Added a new note in "Project Atlas"', 
                  time: '2d ago',
                  icon: FileText,
                  iconBg: 'bg-[#C4B5FD]',
                  iconColor: 'text-black'
                },
              ].map((activity, idx) => {
                const ActIcon = activity.icon;
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between border-b border-zinc-150 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon bubble */}
                      <div className={cn(
                        "w-9 h-9 rounded-lg border border-black flex items-center justify-center shadow-[1px_1px_0px_rgba(0,0,0,1)] shrink-0",
                        activity.iconBg,
                        activity.iconColor
                      )}>
                        <ActIcon className="w-4 h-4" />
                      </div>
                      
                      {/* Description */}
                      <span className="text-xs font-bold text-zinc-700 truncate pr-2">
                        {activity.text}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-400 shrink-0">
                      {activity.time}
                    </span>
                  </div>
                );
              })}
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
                    <span>{"You're doing great!"}</span>
                    <span>🚀</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 leading-normal max-w-sm">
                    {"You've completed 12 more tasks this week. Keep maintaining this pace!"}
                  </p>
                  
                  {/* View Full Insight link button */}
                  <div className="pt-2">
                    <button className="bg-white border-2 border-[#FF6B6B] text-[#FF6B6B] font-black text-[10px] sm:text-xs px-3.5 py-1.5 rounded-lg hover:bg-[#FFEAEA] transition-colors cursor-pointer flex items-center gap-1">
                      <span>View Full Insight</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Custom SVG Graph illustration with trend arrow */}
              <div className="flex items-end justify-between px-2 pt-2 border-t border-zinc-150 relative">
                
                {/* Graph bars custom drawing */}
                <div className="flex items-end gap-3.5 h-16 w-3/5 pb-1 relative z-10">
                  {/* Bar 1 */}
                  <div className="w-5 h-2 bg-[#FF6B6B] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                  {/* Bar 2 */}
                  <div className="w-5 h-8 bg-[#FFD93D] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                  {/* Bar 3 */}
                  <div className="w-5 h-10 bg-[#FFD93D] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                  {/* Bar 4 */}
                  <div className="w-5 h-14 bg-[#C4B5FD] border border-black rounded-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
                </div>

                {/* SVG trend line overlay */}
                <div className="absolute bottom-2 left-2 w-4/5 h-20 pointer-events-none z-20">
                  <svg className="w-full h-full" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Rising trend path with thick black stroke */}
                    <path 
                      d="M10 68 L48 48 L86 44 L126 14" 
                      stroke="black" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* Arrow head tip */}
                    <path 
                      d="M116 12 L128 12 L126 24" 
                      stroke="black" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    
                    {/* Speed tick marks around arrow */}
                    <path d="M136 10 L144 8" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    <path d="M134 22 L142 24" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    <path d="M128 2 L132 0" stroke="black" strokeWidth="2" strokeLinecap="round" />
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
        onSubmit={(p) => alert(`Project "${p.title}" created successfully!`)}
      />
    </div>
  );
}
