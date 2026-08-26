import React from 'react';
import { FileText, CalendarX, Key, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PainPoints() {
  const cards = [
    {
      title: 'Scattered Notes',
      subtitle: 'Information lost across 5 different apps.',
      icon: FileText,
      tiltClass: 'rotate-[-1.5deg]',
    },
    {
      title: 'Missed Deadlines',
      subtitle: 'Timelines slipping due to poor tracking.',
      icon: CalendarX,
      tiltClass: 'rotate-[1deg]',
    },
    {
      title: 'Lost Credentials',
      subtitle: 'Wasting hours finding access keys.',
      icon: Key,
      tiltClass: 'rotate-[-1deg]',
    },
    {
      title: 'Context Switching',
      subtitle: 'Mental fatigue from jumping between tools.',
      icon: RefreshCw,
      tiltClass: 'rotate-[1.5deg]',
    },
  ];

  return (
    <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto text-center relative z-10">
      
      {/* Red Angled Banner Heading */}
      <div className="inline-block mb-12 transform rotate-[-2deg]">
        <div className="bg-[#B91C1C] text-white border-3.5 border-black px-6 py-2.5 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider">
            Projects Become Chaotic Fast.
          </h2>
        </div>
      </div>

      {/* 4 Pain Point Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={cn(
                'bg-white border-3 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-4 transition-transform hover:scale-[1.02]',
                card.tiltClass
              )}
            >
              {/* Pink Round Icon Wrapper */}
              <div className="w-14 h-14 rounded-full bg-[#FFEAEA] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Icon className="w-6 h-6 text-[#B91C1C] stroke-[2.5]" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="font-black text-sm uppercase tracking-wider text-black">
                  {card.title}
                </h3>
                <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
