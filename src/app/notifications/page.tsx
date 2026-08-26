'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CheckSquare, 
  FileText, 
  Lock, 
  Settings, 
  CheckCircle2, 
  ArrowLeftRight, 
  Key, 
  Edit3, 
  Check, 
  ArrowLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemData {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'all' | 'tasks' | 'notes' | 'credentials' | 'reminders' | 'system';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const notificationsList: NotificationItemData[] = [
  {
    id: '1',
    title: 'Task Completed',
    description: 'You marked "Database Schema Design" as completed.',
    timestamp: 'May 22, 2025 • 10:30 AM',
    category: 'tasks',
    icon: CheckCircle2,
    iconBg: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
  },
  {
    id: '2',
    title: 'Task Moved',
    description: '"Implement Authentication" moved from To Do to In Progress.',
    timestamp: 'May 22, 2025 • 09:45 AM',
    category: 'tasks',
    icon: ArrowLeftRight,
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
  },
  {
    id: '3',
    title: 'Note Added',
    description: 'You added a new note "Client Requirements".',
    timestamp: 'May 22, 2025 • 09:15 AM',
    category: 'notes',
    icon: FileText,
    iconBg: 'bg-[#F3E8FF]',
    iconColor: 'text-[#7C3AED]',
  },
  {
    id: '4',
    title: 'Credential Added',
    description: 'You added a new credential "Production Server SSH".',
    timestamp: 'May 21, 2025 • 06:20 PM',
    category: 'credentials',
    icon: Key,
    iconBg: 'bg-[#FFEAEA]',
    iconColor: 'text-[#B91C1C]',
  },
  {
    id: '5',
    title: 'Note Updated',
    description: 'You updated the note "Project Requirements".',
    timestamp: 'May 21, 2025 • 04:10 PM',
    category: 'notes',
    icon: Edit3,
    iconBg: 'bg-[#E0F2FE]',
    iconColor: 'text-[#0369A1]',
  },
  {
    id: '6',
    title: 'Task Created',
    description: 'You created a new task "Integrate Payment Gateway".',
    timestamp: 'May 20, 2025 • 08:50 PM',
    category: 'tasks',
    icon: CheckCircle2,
    iconBg: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
  },
  {
    id: '7',
    title: 'Reminder',
    description: '"Design Homepage" is due tomorrow.',
    timestamp: 'May 20, 2025 • 08:00 AM',
    category: 'reminders',
    icon: Bell,
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
  },
  {
    id: '8',
    title: 'System Update',
    description: 'Daily backup completed successfully.',
    timestamp: 'May 19, 2025 • 11:59 PM',
    category: 'system',
    icon: Settings,
    iconBg: 'bg-[#F4F4F5]',
    iconColor: 'text-[#52525B]',
  },
];

export default function NotificationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMarkedRead, setIsMarkedRead] = useState<boolean>(false);

  const filteredNotifications = selectedCategory === 'all'
    ? notificationsList
    : notificationsList.filter(n => n.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* Back Button */}
      <div className="max-w-[1440px] mx-auto mb-6">
        <Link 
          href="/dashboard" 
          className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs md:text-sm px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="max-w-[1440px] mx-auto">
        
        {/* ========================================================================= */}
        {/* PAGE HEADER */}
        {/* ========================================================================= */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F3E8FF] border-3 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0 text-black">
            <Bell className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-2">
              <span>Notifications</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-zinc-600 mt-1.5 leading-relaxed">
              {"Stay updated with all the important updates from your project."}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN LAYOUT: SIDEBAR FILTERS & NOTIFICATIONS LIST */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          
          {/* LEFT SIDEBAR PANEL (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Filters Widget */}
            <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="font-black text-base text-black">Filters</h3>

              <div className="space-y-1.5">
                {[
                  { id: 'all', label: 'All Notifications', count: 12, icon: CheckSquare },
                  { id: 'tasks', label: 'Tasks', count: 5, icon: CheckSquare },
                  { id: 'notes', label: 'Notes', count: 2, icon: FileText },
                  { id: 'credentials', label: 'Credentials', count: 2, icon: Lock },
                  { id: 'reminders', label: 'Reminders', count: 3, icon: Bell },
                  { id: 'system', label: 'System', count: 0, icon: Settings },
                ].map((filter) => {
                  const FilterIcon = filter.icon;
                  const isSelected = selectedCategory === filter.id;

                  return (
                    <div
                      key={filter.id}
                      onClick={() => setSelectedCategory(filter.id)}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between text-xs sm:text-sm font-bold",
                        isSelected
                          ? "bg-[#F3E8FF] text-[#7C3AED] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold"
                          : "bg-white hover:bg-zinc-50 text-black border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FilterIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>{filter.label}</span>
                      </div>
                      
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-black",
                        isSelected ? "text-[#7C3AED]" : "text-zinc-500"
                      )}>
                        {filter.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification Summary Widget */}
            <div className="bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="font-black text-base text-black">Notification Summary</h3>

              <div className="space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Total Notifications</span>
                  <span className="font-black text-[#7C3AED] text-sm">12</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Unread</span>
                  <span className="font-black text-[#B91C1C] text-sm">{isMarkedRead ? '0' : '6'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">This Week</span>
                  <span className="font-black text-black text-sm">8</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">This Month</span>
                  <span className="font-black text-black text-sm">12</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT MAIN PANEL: NOTIFICATIONS LIST (8 Columns) */}
          <div className="lg:col-span-8 bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
            
            {/* Header Row & Mark as Read Action */}
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight capitalize">
                {selectedCategory === 'all' ? 'All Notifications' : `${selectedCategory} Notifications`}
              </h2>

              <button
                onClick={() => setIsMarkedRead(true)}
                className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs px-3.5 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Mark all as read</span>
              </button>
            </div>

            {/* Notifications Feed Items List */}
            <div className="divide-y divide-zinc-150">
              {filteredNotifications.map((notif) => {
                const ItemIcon = notif.icon;
                return (
                  <div 
                    key={notif.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 hover:bg-zinc-50/50 transition-colors p-2 rounded-xl"
                  >
                    {/* Sticker Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0",
                      notif.iconBg,
                      notif.iconColor
                    )}>
                      <ItemIcon className="w-5 h-5 stroke-[2.5]" />
                    </div>

                    {/* Content & Metadata */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-black text-sm text-black">
                          {notif.title}
                        </h4>
                        
                        <span className="text-[10px] sm:text-xs font-bold text-zinc-400 whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-zinc-600 mt-1 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
