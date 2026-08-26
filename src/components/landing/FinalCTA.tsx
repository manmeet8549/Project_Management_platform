import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="py-12 md:py-16 px-6 md:px-12 max-w-5xl mx-auto relative z-10">
      
      {/* 
        Simplified container wrapper without overflow offsets since the graphic is removed.
      */}
      <div className="bg-[#C4B5FD] text-black border-3 md:border-4 border-black p-8 md:p-10 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
        
        {/* Left Side: Text Content */}
        <div className="space-y-3 relative z-10 max-w-2xl text-center md:text-left w-full md:w-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#121210] leading-none">
            <div>Turn Ideas Into</div>
            <div className="relative inline-block mt-1.5">
              <span className="bg-[#121210] text-white px-3.5 py-1 rounded-lg border-2 border-black inline-block shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                Successful Projects
              </span>
              <span className="absolute -top-3 -right-6 text-black font-bold font-mono text-sm opacity-40 select-none hidden sm:inline">
                \ \ \
              </span>
            </div>
          </h2>

          <p className="text-xs sm:text-sm font-bold text-[#1E1B4B]/80 leading-relaxed max-w-md mx-auto md:mx-0">
            Join thousands of builders who plan smarter, stay organized, and deliver on time.
          </p>
        </div>

        {/* Right Side: CTA Button */}
        <div className="shrink-0 relative z-10 w-full md:w-auto flex justify-center md:justify-end">
          <Link href="/" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-[#FFD93D] text-[#121210] font-black text-sm md:text-base px-6 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}
