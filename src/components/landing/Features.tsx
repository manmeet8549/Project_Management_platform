import React from 'react';
import { 
  CheckSquare, 
  FileText, 
  BookOpen, 
  Lock, 
  CalendarDays, 
  Bell, 
  Zap, 
  BarChart3, 
  Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Features() {
  const items = [
    { 
      title: 'Manage', 
      subtitle: 'Projects', 
      icon: CheckSquare, 
      color: 'bg-[#FF6B6B]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'Organize', 
      subtitle: 'Tasks', 
      icon: FileText, 
      color: 'bg-[#FFD93D]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'Smart', 
      subtitle: 'Notes', 
      icon: BookOpen, 
      color: 'bg-[#C4B5FD]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'Credentials', 
      subtitle: 'Vault', 
      icon: Lock, 
      color: 'bg-[#2E1065] text-white',
      iconColor: 'text-white stroke-[2.5]'
    },
    { 
      title: 'Calendar &', 
      subtitle: 'Deadlines', 
      icon: CalendarDays, 
      color: 'bg-[#FF6B6B]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'Smart', 
      subtitle: 'Notifications', 
      icon: Bell, 
      color: 'bg-[#FFD93D]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'AI', 
      subtitle: 'Copilot', 
      icon: Zap, 
      color: 'bg-[#C4B5FD]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'Progress', 
      subtitle: 'Tracking', 
      icon: BarChart3, 
      color: 'bg-[#FFD93D]',
      iconColor: 'text-black stroke-[2.5]'
    },
    { 
      title: 'Activity', 
      subtitle: 'Log', 
      icon: Users, 
      color: 'bg-[#FF6B6B]',
      iconColor: 'text-black stroke-[2.5]'
    },
  ];

  return (
    <section id="features" className="py-16 md:py-20 px-6 md:px-12 max-w-5xl mx-auto text-center relative z-10">
      
      <div className="flex flex-col items-center gap-4 mb-12">
        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#C4B5FD]/80 text-black font-black text-[10px] md:text-xs uppercase tracking-wider px-4 py-1.5 rounded-full border border-black/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          EVERYTHING YOU NEED
        </div>

        {/* Title */}
        <div className="relative inline-block">
          <span className="absolute -left-12 top-2 text-black font-bold font-mono text-xl select-none opacity-40">
            \ \ \
          </span>
          <span className="absolute -right-12 top-2 text-black font-bold font-mono text-xl select-none opacity-40">
            / / /
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#121210] dark:text-white leading-[1.15]">
            <div>One Workspace.</div>
            <div className="relative inline-block mt-1">
              <span>Endless Possibilities.</span>
              <span className="absolute -bottom-1.5 left-0 w-full h-2.5 bg-[#C4B5FD] rounded-full -z-10 opacity-80" />
            </div>
          </h2>
        </div>
      </div>

      {/* Grid container with internal dividing borders */}
      <div className="bg-white dark:bg-[#1c1b18] border-3 md:border-4 border-black dark:border-white/80 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.9)] relative overflow-hidden">
        
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {items.map((item, idx) => {
            const Icon = item.icon;
            
            const isRightBorder = (idx % 3 !== 2); // cols 0, 1
            const isBottomBorder = (idx < 6);     // rows 0, 1

            return (
              <div 
                key={idx} 
                className={cn(
                  'flex items-center gap-4 text-left p-4 sm:p-5 md:p-6 transition-all',
                  isRightBorder && 'sm:border-r border-black/15 dark:border-white/15',
                  isBottomBorder && 'border-b border-black/15 dark:border-white/15'
                )}
              >
                <div className={cn(
                  'w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                  item.color
                )}>
                  <Icon className={cn('w-5 h-5', item.iconColor)} />
                </div>

                <div className="leading-tight">
                  <div className="font-black text-sm md:text-base text-black dark:text-white">
                    {item.title}
                  </div>
                  <div className="font-bold text-xs md:text-sm text-[#4A4A4A] dark:text-gray-300">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
