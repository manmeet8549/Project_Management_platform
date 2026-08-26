'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Users, 
  UserPlus,
  GripVertical,
  Search,
  ChevronDown,
  ShieldCheck,
  Lock,
  Edit3,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CredentialItem {
  id: string;
  title: string;
  subtext: string;
  category: string;
  categoryBg: string;
  addedOn: string;
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

const credentialsData: CredentialItem[] = [
  {
    id: '1',
    title: 'GitHub Repository',
    subtext: 'Username: project-admin',
    category: 'Development',
    categoryBg: 'bg-[#FFEAEA] text-[#B91C1C]',
    addedOn: 'May 18, 2025',
  },
  {
    id: '2',
    title: 'Supabase Project',
    subtext: 'Project URL: https://abcxyz.supabase.co',
    category: 'Backend',
    categoryBg: 'bg-[#DCFCE7] text-[#15803D]',
    addedOn: 'May 18, 2025',
  },
  {
    id: '3',
    title: 'Vercel Deployment',
    subtext: 'Team: ecommerce-team',
    category: 'Deployment',
    categoryBg: 'bg-[#F3E8FF] text-[#7C3AED]',
    addedOn: 'May 19, 2025',
  },
  {
    id: '4',
    title: 'Stripe Account',
    subtext: 'Publishable Key: pk_test_************************************',
    category: 'Payment',
    categoryBg: 'bg-[#FEF3C7] text-[#D97706]',
    addedOn: 'May 20, 2025',
  },
  {
    id: '5',
    title: 'SendGrid Email',
    subtext: 'API Key: SG.************************************',
    category: 'Email Service',
    categoryBg: 'bg-[#E0F2FE] text-[#0369A1]',
    addedOn: 'May 21, 2025',
  },
  {
    id: '6',
    title: 'Cloudinary Storage',
    subtext: 'Cloud Name: dz8xyzabc',
    category: 'Storage',
    categoryBg: 'bg-[#E0F2FE] text-[#0369A1]',
    addedOn: 'May 22, 2025',
  },
];

const notesData: NoteItem[] = [
  {
    id: '1',
    title: 'Project Requirements',
    excerpt: 'Define the core requirements for the e-commerce website...',
    date: 'May 22, 2025',
    updated: 'Updated 2 hours ago',
    sections: [
      {
        heading: '1. Core Features',
        items: [
          'User Authentication (Login, Register, Forgot Password)',
          'Product Listing with Search and Filters',
          'Product Details Page',
          'Shopping Cart and Checkout',
          'Payment Integration',
          'Order Tracking',
          'Admin Dashboard'
        ]
      },
      {
        heading: '2. Tech Stack',
        items: [
          'Frontend: Next.js, Tailwind CSS',
          'Backend: Node.js, Express.js',
          'Database: PostgreSQL (Supabase)',
          'Authentication: Supabase Auth',
          'Storage: Supabase Storage'
        ]
      },
      {
        heading: '3. Design Guidelines',
        items: [
          'Clean and modern UI',
          'Mobile-first responsive design',
          'Follow brand colors and typography',
          'Focus on user experience and performance'
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Client Meeting Notes',
    excerpt: 'Discussed design preferences, features and timeline...',
    date: 'May 20, 2025',
    updated: 'Updated 2 days ago',
    sections: [
      {
        heading: '1. Meeting Highlights',
        items: [
          'Aligned on neobrutalist design system with high contrast borders.',
          'Target launch date confirmed for August 30, 2025.',
          'Weekly sync scheduled for every Tuesday.'
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Database Schema Ideas',
    excerpt: 'Initial thoughts on how to structure the database...',
    date: 'May 18, 2025',
    updated: 'Updated 4 days ago',
    sections: [
      {
        heading: '1. Schema Tables',
        items: [
          'users (id, email, role, created_at)',
          'projects (id, name, status, due_date)',
          'tasks (id, project_id, title, priority, status)'
        ]
      }
    ]
  },
  {
    id: '4',
    title: 'API Integration Plan',
    excerpt: 'List of third-party services and APIs to integrate...',
    date: 'May 15, 2025',
    updated: 'Updated 1 week ago',
    sections: [
      {
        heading: '1. Integrations',
        items: [
          'Stripe API for secure checkout & webhook handling.',
          'SendGrid API for transactional notification emails.',
          'Cloudinary for media assets and image hosting.'
        ]
      }
    ]
  },
  {
    id: '5',
    title: 'UI/UX Design Notes',
    excerpt: 'Notes from the design brainstorming session...',
    date: 'May 12, 2025',
    updated: 'Updated 1 week ago',
    sections: [
      {
        heading: '1. Design Principles',
        items: [
          'Use bright sticker icons (red, yellow, purple).',
          'Solid drop shadows (3px/4px/6px) for neobrutalist cards.',
          'Clear typography hierarchy and bold callouts.'
        ]
      }
    ]
  },
  {
    id: '6',
    title: 'Deployment Checklist',
    excerpt: 'Steps to deploy the application to production...',
    date: 'May 10, 2025',
    updated: 'Updated 2 weeks ago',
    sections: [
      {
        heading: '1. Checklist',
        items: [
          'Configure environment variables on Vercel.',
          'Run automated TypeScript and lint verification.',
          'Verify SSL certificates and custom domain DNS.'
        ]
      }
    ]
  }
];

export default function ProjectDetailsPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'credentials' | 'notes' | 'activity'>('notes');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('1');

  const selectedNote = notesData.find(n => n.id === selectedNoteId) || notesData[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 mb-6">
        <Link href="/projects" className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Projects</span>
        </Link>

        <button className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer">
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
              activeTab === 'notes' ? 'bg-[#FFD93D]' : 'bg-[#FF6B6B]'
            )}>
              {activeTab === 'notes' ? (
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              ) : activeTab === 'credentials' ? (
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              ) : (
                <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-2">
                <span>E-Commerce Website</span>
                <span className="inline-block font-mono font-bold text-[#1E1B4B]/35 opacity-60 text-2xl md:text-3xl select-none">
                  \ \ \
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-bold text-zinc-600 mt-1.5 leading-relaxed">
                {activeTab === 'notes'
                  ? "Manage and organize all your project notes in one place."
                  : activeTab === 'credentials'
                  ? "Manage all your project credentials and secure keys in one place."
                  : "Build a fully functional e-commerce website with payment integration and admin dashboard."
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
                <span className="text-[#FF6B6B] text-sm">80%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-150 rounded-full border-2 border-black overflow-hidden relative mb-1.5">
                <div className="h-full bg-[#FF6B6B] rounded-full border-r-2 border-black w-[80%]" />
              </div>
              <div className="text-[10px] font-bold text-zinc-500">
                24 of 30 tasks completed
              </div>
            </div>

            {/* Due Date Box */}
            <div className="bg-white border-3 border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-50 border-2 border-black flex items-center justify-center text-zinc-700 shrink-0">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-zinc-400">Due Date</div>
                <div className="text-xs sm:text-sm font-black text-[#B91C1C]">Aug 30, 2025</div>
              </div>
            </div>

            {/* Add Action Button */}
            <button className="bg-[#FF6B6B] text-black font-black text-sm px-5 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer">
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

          {/* Tab: Activity */}
          <button 
            onClick={() => setActiveTab('activity')}
            className={cn(
              "font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl border-3 border-black flex items-center gap-2 cursor-pointer shrink-0 transition-all",
              activeTab === 'activity'
                ? "bg-[#FF6B6B] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-zinc-50 text-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            )}
          >
            <Activity className="w-4 h-4 stroke-[2.5]" />
            <span>Activity</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT: NOTES VIEW (MASTER-DETAIL SPLIT) */}
        {/* ========================================================================= */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
            
            {/* LEFT PANEL: NOTES LIST & SUMMARY (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Main List Box */}
              <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5">
                
                {/* Header & Search / Filter */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-xl text-black">All Notes</h3>

                  <div className="flex items-center gap-2">
                    {/* Search notes input */}
                    <div className="relative w-36 sm:w-48">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                      <input 
                        type="text"
                        placeholder="Search notes..."
                        className="w-full bg-white text-black font-bold text-xs pl-8 pr-2 py-1.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-400"
                      />
                    </div>

                    {/* Filter Icon Button */}
                    <button className="bg-white text-black p-1.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer">
                      <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Note Items List */}
                <div className="space-y-3">
                  {notesData.map((note) => {
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

                {/* Add New Note Button */}
                <button className="w-full bg-white hover:bg-zinc-50 text-black font-extrabold text-xs py-3 rounded-xl border-2 border-black border-dashed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add New Note</span>
                </button>

              </div>

              {/* Bottom Summary Box */}
              <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-around text-center">
                <div className="w-10 h-10 bg-[#FFD93D] border-2 border-black rounded-xl flex items-center justify-center text-black shrink-0 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                </div>
                
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-500">Total Notes</div>
                  <div className="text-xl font-black text-[#7C3AED] mt-0.5">6</div>
                </div>

                <div className="h-8 w-px bg-zinc-200" />

                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-zinc-500">Last Updated</div>
                  <div className="text-xs font-black text-black mt-1">May 22, 2025</div>
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: NOTE DETAIL VIEWER (7 Columns) */}
            <div className="lg:col-span-7 bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
              
              {/* Header Row: Title, Metadata, Edit & Delete Buttons */}
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
                  <button className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs px-3.5 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Edit</span>
                  </button>

                  <button className="bg-white hover:bg-red-50 text-[#B91C1C] font-extrabold text-xs px-3.5 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Formatted Content Viewer Box */}
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b-2 border-black text-xs font-black text-black uppercase tracking-wider">
                      <th className="px-5 py-4">Title</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Added On</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {credentialsData.map((cred) => (
                      <tr key={cred.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-black text-sm text-black">{cred.title}</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">{cred.subtext}</div>
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
                        <td className="px-5 py-4 text-right">
                          <button className="text-zinc-500 hover:text-black p-1 rounded-md transition-colors cursor-pointer">
                            <MoreVertical className="w-5 h-5 stroke-[2]" />
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
                  <div className="text-xl font-black text-[#7C3AED] mt-0.5">6</div>
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

        {/* ========================================================================= */}
        {/* TAB CONTENT: TASKS VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* COLUMN 1: TO DO */}
              <div className="space-y-4">
                <div className="bg-[#FF6B6B] border-3 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-black stroke-[2.5]" />
                    <span className="font-black text-sm text-black uppercase tracking-wider">To Do</span>
                    <span className="w-5 h-5 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      6
                    </span>
                  </div>

                  <button className="bg-white text-black font-black text-[10px] px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Design Homepage', prio: 'High Priority', prioBg: 'bg-[#FF6B6B]', date: 'May 28', count: 2 },
                    { title: 'Setup Product Database', prio: 'Medium Priority', prioBg: 'bg-[#FFD93D]', date: 'May 30', count: 1 },
                    { title: 'Create Product Listing Page', prio: 'Low Priority', prioBg: 'bg-[#C4B5FD]', date: 'Jun 02', count: 0 },
                    { title: 'Setup Payment Gateway', prio: 'High Priority', prioBg: 'bg-[#FF6B6B]', date: 'Jun 05', count: 3 },
                    { title: 'Design Checkout Flow', prio: 'Medium Priority', prioBg: 'bg-[#FFD93D]', date: 'Jun 07', count: 1 },
                  ].map((task, idx) => (
                    <div key={idx} className="bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-sm text-black">{task.title}</h4>
                        <button className="text-zinc-400 hover:text-black">
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
                        <span>{task.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMN 2: IN PROGRESS */}
              <div className="space-y-4">
                <div className="bg-[#FFD93D] border-3 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-black stroke-[2.5]" />
                    <span className="font-black text-sm text-black uppercase tracking-wider">In Progress</span>
                    <span className="w-5 h-5 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      3
                    </span>
                  </div>

                  <button className="bg-white text-black font-black text-[10px] px-2.5 py-1 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Implement User Authentication', prio: 'High Priority', prioBg: 'bg-[#FF6B6B]', date: 'May 25', count: 3, user: 'Aman Kumar', avBg: 'bg-[#C4B5FD] text-black', initials: 'AK', comment: 'Please use Supabase Auth for better security.', time: '2h ago' },
                    { title: 'Build Shopping Cart', prio: 'Medium Priority', prioBg: 'bg-[#FFD93D]', date: 'May 27', count: 2, user: 'Sarah Khan', avBg: 'bg-[#FF6B6B] text-white', initials: 'SK', comment: 'Add coupon code functionality as well.', time: '5h ago' },
                    { title: 'Admin Dashboard UI', prio: 'Low Priority', prioBg: 'bg-[#C4B5FD]', date: 'Jun 01', count: 1, user: 'Mike Johnson', avBg: 'bg-[#FFD93D] text-black', initials: 'MJ', comment: "Let's keep it minimal and clean.", time: '1d ago' },
                  ].map((task, idx) => (
                    <div key={idx} className="bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-sm text-black">{task.title}</h4>
                        <button className="text-zinc-400 hover:text-black">
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
                        <span>{task.count}</span>
                      </div>

                      <div className="bg-[#F3E8FF] border border-black/20 p-2.5 rounded-lg flex items-start gap-2.5 text-xs">
                        <div className={cn("w-6 h-6 rounded-full border border-black font-black text-[10px] flex items-center justify-center shrink-0", task.avBg)}>
                          {task.initials}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-black text-[11px]">{task.user}</span>
                            <span className="text-[10px] font-bold text-zinc-400">{task.time}</span>
                          </div>
                          <p className="text-[11px] font-bold text-zinc-600 leading-tight mt-0.5">
                            {task.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMN 3: COMPLETED */}
              <div className="space-y-4">
                <div className="bg-[#C4B5FD] border-3 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-black stroke-[2.5]" />
                    <span className="font-black text-sm text-black uppercase tracking-wider">Completed</span>
                    <span className="w-5 h-5 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                      5
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Project Setup', prioBg: 'bg-[#C4B5FD]', date: 'May 10' },
                    { title: 'Repository Setup', prioBg: 'bg-[#C4B5FD]', date: 'May 10' },
                    { title: 'Setup Supabase Project', prioBg: 'bg-[#FFD93D]', date: 'May 12' },
                    { title: 'Database Schema Design', prioBg: 'bg-[#FFD93D]', date: 'May 15' },
                    { title: 'Create Wireframes', prioBg: 'bg-[#C4B5FD]', date: 'May 16' },
                  ].map((task, idx) => (
                    <div key={idx} className="bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
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
                    </div>
                  ))}

                  <div className="bg-[#F0FDF4] border-2 border-black p-3.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
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

              <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-150 pb-3">
                  <Activity className="w-5 h-5 text-black stroke-[2.5]" />
                  <h3 className="font-black text-sm uppercase tracking-wide text-black">
                    Activity Feed
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {[
                    { icon: CheckCircle2, iconBg: 'bg-[#C4B5FD]', text: 'Mike completed Database Schema Design', time: '2h ago' },
                    { icon: FileText, iconBg: 'bg-[#FFD93D]', text: 'Sarah added a note Design Requirements', time: '5h ago' },
                    { icon: Plus, iconBg: 'bg-[#FF6B6B]', text: 'You added a new task Design Checkout Flow', time: '1d ago' },
                    { icon: MessageSquare, iconBg: 'bg-[#C4B5FD]', text: 'Aman commented on User Authentication', time: '2d ago' },
                  ].map((act, idx) => {
                    const ActIcon = act.icon;
                    return (
                      <div key={idx} className="flex items-start justify-between gap-2 text-xs border-b border-zinc-100 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={cn("w-6 h-6 rounded-md border border-black flex items-center justify-center shrink-0 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]", act.iconBg)}>
                            <ActIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="font-bold text-zinc-700 text-[11px] leading-tight">
                            {act.text}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                          {act.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-150 pb-3">
                  <Users className="w-5 h-5 text-black stroke-[2.5]" />
                  <h3 className="font-black text-sm uppercase tracking-wide text-black">
                    Team Members
                  </h3>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#C4B5FD] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      AK
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FF6B6B] border-2 border-black text-white font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      SK
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FFD93D] border-2 border-black text-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      MJ
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FFD93D] border-2 border-black text-black font-black text-[10px] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      +2
                    </div>
                  </div>

                  <button className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer">
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Invite</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Placeholder for Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white border-3 border-black p-12 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center my-8">
            <div className="w-16 h-16 bg-[#FAF8F5] border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-black capitalize">
              Activity Overview
            </h3>
            <p className="text-sm font-bold text-zinc-500 mt-2 max-w-md mx-auto">
              {"All project activity events are organized and tracked in real-time."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
