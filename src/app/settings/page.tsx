'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Lock, 
  Info, 
  User, 
  Folder, 
  Calendar, 
  Clock, 
  Globe, 
  FileText, 
  Trash2, 
  ArrowLeft, 
  ChevronDown, 
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'about'>('general');

  // General Settings States
  const [workspaceName, setWorkspaceName] = useState<string>('E-Commerce Website');
  const [defaultView, setDefaultView] = useState<string>('Tasks');
  const [startOfWeek, setStartOfWeek] = useState<string>('Monday');
  const [timeFormat, setTimeFormat] = useState<string>('12-Hour (AM/PM)');
  const [language, setLanguage] = useState<string>('English');

  // Other Preferences States
  const [enableRichText, setEnableRichText] = useState<boolean>(true);
  const [confirmDeleting, setConfirmDeleting] = useState<boolean>(true);

  // Security Settings States
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(false);
  const [autoLock, setAutoLock] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] p-6 sm:p-8 md:p-12 pb-32 sm:pb-40 md:pb-44 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
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
            <Settings className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-2">
              <span>Settings</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold text-zinc-600 mt-1.5 leading-relaxed">
              {"Manage your preferences and customize your workspace."}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN LAYOUT: SIDEBAR NAVIGATION & CONTENT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          
          {/* LEFT SIDEBAR NAVIGATION PANEL (3 Columns) */}
          <div className="lg:col-span-3 bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 px-3">
              SETTINGS
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'about', label: 'About', icon: Info },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;

                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'general' | 'security' | 'about')}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 text-xs sm:text-sm font-bold",
                      isSelected
                        ? "bg-[#F3E8FF] text-[#7C3AED] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold"
                        : "bg-white hover:bg-zinc-50 text-black border-transparent"
                    )}
                  >
                    <TabIcon className="w-4 h-4 stroke-[2.5]" />
                    <span>{tab.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT MAIN CONTENT PANEL (9 Columns) */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* ========================================================================= */}
            {/* TAB CONTENT: GENERAL SETTINGS */}
            {/* ========================================================================= */}
            {activeTab === 'general' && (
              <>
                {/* General Settings Card */}
                <div className="bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                      General Settings
                    </h2>
                    <p className="text-xs font-bold text-zinc-500 mt-1">
                      {"Manage the basic settings of your workspace."}
                    </p>
                  </div>

                  <div className="space-y-5 divide-y divide-zinc-150">
                    
                    {/* Row 1: Workspace Name */}
                    <div className="pt-5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border-2 border-black flex items-center justify-center text-[#7C3AED] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <User className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Workspace Name</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"This is the name of your workspace."}
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-72">
                        <input
                          type="text"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="w-full bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Row 2: Default Project View */}
                    <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border-2 border-black flex items-center justify-center text-[#D97706] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Folder className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Default Project View</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"Choose the default view when opening a project."}
                          </div>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-72">
                        <select
                          value={defaultView}
                          onChange={(e) => setDefaultView(e.target.value)}
                          className="w-full bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer pr-10"
                        >
                          <option value="Tasks">Tasks</option>
                          <option value="Credentials">Credentials</option>
                          <option value="Notes">Notes</option>
                          <option value="Activity">Activity</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-black absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Row 3: Start of the Week */}
                    <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border-2 border-black flex items-center justify-center text-[#16A34A] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Calendar className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Start of the Week</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"Select which day your week starts on."}
                          </div>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-72">
                        <select
                          value={startOfWeek}
                          onChange={(e) => setStartOfWeek(e.target.value)}
                          className="w-full bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer pr-10"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Sunday">Sunday</option>
                          <option value="Saturday">Saturday</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-black absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Row 4: Time Format */}
                    <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border-2 border-black flex items-center justify-center text-[#7C3AED] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Clock className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Time Format</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"Choose your preferred time format."}
                          </div>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-72">
                        <select
                          value={timeFormat}
                          onChange={(e) => setTimeFormat(e.target.value)}
                          className="w-full bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer pr-10"
                        >
                          <option value="12-Hour (AM/PM)">12-Hour (AM/PM)</option>
                          <option value="24-Hour">24-Hour</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-black absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Row 5: Language */}
                    <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border-2 border-black flex items-center justify-center text-[#0369A1] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Globe className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Language</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"Select your preferred language."}
                          </div>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-72">
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full bg-white text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer pr-10"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-black absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Other Preferences Card */}
                <div className="bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                      Other Preferences
                    </h2>
                    <p className="text-xs font-bold text-zinc-500 mt-1">
                      {"Manage other preferences for your workspace."}
                    </p>
                  </div>

                  <div className="space-y-5 divide-y divide-zinc-150">
                    
                    {/* Toggle 1: Enable Rich Text in Notes */}
                    <div className="pt-5 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] border-2 border-black flex items-center justify-center text-[#7C3AED] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <FileText className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Enable Rich Text in Notes</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"Use rich text formatting in your notes."}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button 
                        type="button"
                        onClick={() => setEnableRichText(!enableRichText)}
                        className={cn(
                          "w-12 h-6 rounded-full border-2 border-black transition-colors relative cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0",
                          enableRichText ? "bg-[#7C3AED]" : "bg-zinc-200"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 bg-white rounded-full border-2 border-black absolute top-0.5 transition-transform",
                          enableRichText ? "left-[25px]" : "left-[2px]"
                        )} />
                      </button>
                    </div>

                    {/* Toggle 2: Confirm Before Deleting */}
                    <div className="pt-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#FFEAEA] border-2 border-black flex items-center justify-center text-[#B91C1C] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Trash2 className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-black">Confirm Before Deleting</div>
                          <div className="text-xs font-bold text-zinc-500 mt-0.5">
                            {"Show confirmation dialog before deleting items."}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button 
                        type="button"
                        onClick={() => setConfirmDeleting(!confirmDeleting)}
                        className={cn(
                          "w-12 h-6 rounded-full border-2 border-black transition-colors relative cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0",
                          confirmDeleting ? "bg-[#7C3AED]" : "bg-zinc-200"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 bg-white rounded-full border-2 border-black absolute top-0.5 transition-transform",
                          confirmDeleting ? "left-[25px]" : "left-[2px]"
                        )} />
                      </button>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* ========================================================================= */}
            {/* TAB CONTENT: SECURITY SETTINGS */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
              <div className="bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    Security & Encryption
                  </h2>
                  <p className="text-xs font-bold text-zinc-500 mt-1">
                    {"Manage your personal encryption key and access security."}
                  </p>
                </div>

                <div className="space-y-5 divide-y divide-zinc-150">
                  
                  {/* Two Factor Auth */}
                  <div className="pt-5 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border-2 border-black flex items-center justify-center text-[#16A34A] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-black">Two-Factor Authentication (2FA)</div>
                        <div className="text-xs font-bold text-zinc-500 mt-0.5">
                          {"Require authentication app code on login."}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                      className={cn(
                        "w-12 h-6 rounded-full border-2 border-black transition-colors relative cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0",
                        twoFactorAuth ? "bg-[#7C3AED]" : "bg-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full border-2 border-black absolute top-0.5 transition-transform",
                        twoFactorAuth ? "left-[25px]" : "left-[2px]"
                      )} />
                    </button>
                  </div>

                  {/* Auto Lock */}
                  <div className="pt-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border-2 border-black flex items-center justify-center text-[#D97706] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        <Lock className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-black">Auto-Lock Idle Session</div>
                        <div className="text-xs font-bold text-zinc-500 mt-0.5">
                          {"Automatically lock workspace after 15 minutes of inactivity."}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setAutoLock(!autoLock)}
                      className={cn(
                        "w-12 h-6 rounded-full border-2 border-black transition-colors relative cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0",
                        autoLock ? "bg-[#7C3AED]" : "bg-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full border-2 border-black absolute top-0.5 transition-transform",
                        autoLock ? "left-[25px]" : "left-[2px]"
                      )} />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB CONTENT: ABOUT */}
            {/* ========================================================================= */}
            {activeTab === 'about' && (
              <div className="bg-white border-3 border-black p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    About Platform
                  </h2>
                  <p className="text-xs font-bold text-zinc-500 mt-1">
                    {"Personal AI-Powered Project Workspace Edition."}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] border-2 border-black p-5 rounded-xl space-y-3 text-xs font-bold text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Version</span>
                    <span className="font-black text-black">v1.0.0 (Production Build)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Edition</span>
                    <span className="font-black text-[#7C3AED]">Personal Developer Suite</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Data Storage</span>
                    <span className="font-black text-[#16A34A]">100% Encrypted & Local Only</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
