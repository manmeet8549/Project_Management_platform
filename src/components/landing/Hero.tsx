import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, ClipboardList } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-8 pb-16 md:py-16 px-6 md:px-12 max-w-6xl mx-auto relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Headline and Actions */}
        <div className="lg:col-span-7 text-left space-y-6">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#C4B5FD] text-black font-extrabold text-[10px] md:text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-3.5 h-3.5 fill-black stroke-black" />
            <span>AI-POWERED PROJECT WORKSPACE</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-black leading-[1.08] space-y-2">
            <div>Build Better.</div>
            <div>Plan Smarter.</div>
            <div className="pt-1 inline-block">
              <span className="bg-[#FFD93D] text-[#121210] border-3.5 border-black px-4 py-1.5 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg font-black">
                Deliver Faster.
              </span>
            </div>
          </h1>

          {/* Paragraph description */}
          <p className="text-sm md:text-base font-bold text-[#2A2A2A] max-w-lg leading-relaxed pt-1">
            Manage projects, tasks, notes, credentials, deadlines and more — all in one intelligent workspace with AI by your side.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link 
              href="/auth?mode=signup" 
              className="bg-[#FF6B6B] text-white font-extrabold text-sm md:text-base px-6 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer inline-flex"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Link>
            
            <button className="bg-white text-black font-extrabold text-sm md:text-base px-6 py-3.5 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer">
              <span>Watch Demo</span>
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-white text-white translate-x-[0.5px]" />
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: 5-Step Neo-Brutalist Flowchart */}
        <div className="lg:col-span-5 flex flex-col items-center relative">
          
          {/* Subtle hand-drawn slashes around flowchart */}
          <div className="absolute -top-6 -left-6 text-black/35 font-black font-mono text-lg select-none pointer-events-none">
            \ \ \
          </div>
          <div className="absolute top-1/2 -right-8 text-black/35 font-black font-mono text-lg select-none pointer-events-none">
            / / /
          </div>

          <div className="w-full max-w-xs space-y-1 relative">
            
            {/* Step 1: IDEA */}
            <div className="border-3 border-black rounded-xl p-3 bg-[#FF6B6B] text-black flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[0.5deg]">
              <span className="text-xl">💡</span>
              <span className="font-black text-sm uppercase tracking-wider text-[#121210]">IDEA</span>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-xl font-black text-black leading-none py-0.5 select-none pointer-events-none">
              ↓
            </div>

            {/* Step 2: AI PLANNING */}
            <div className="border-3 border-black rounded-xl p-3 bg-[#FFD93D] text-black flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-1.5deg]">
              <span className="text-xl">🤖</span>
              <span className="font-black text-sm uppercase tracking-wider text-[#121210]">AI PLANNING</span>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-xl font-black text-black leading-none py-0.5 select-none pointer-events-none">
              ↓
            </div>

            {/* Step 3: ORGANIZED EXECUTION */}
            <div className="border-3 border-black rounded-xl p-3 bg-[#C4B5FD] text-black flex items-center gap-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[1deg]">
              <div className="w-9 h-9 rounded-lg bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ClipboardList className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <span className="font-black text-sm uppercase tracking-wider text-[#121210]">ORGANIZED EXECUTION</span>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-xl font-black text-black leading-none py-0.5 select-none pointer-events-none">
              ↓
            </div>

            {/* Step 4: ALL CREDENTIALS IN ONE SPOT */}
            <div className="border-3 border-black rounded-xl p-3 bg-white text-black flex items-center gap-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
              <span className="text-2xl shrink-0">📁</span>
              <span className="font-black text-xs md:text-sm uppercase tracking-wider text-[#121210] leading-tight">
                ALL CREDENTIALS <br /> IN ONE SPOT
              </span>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-xl font-black text-black leading-none py-0.5 select-none pointer-events-none">
              ↓
            </div>

            {/* Step 5: PROJECT SUCCESS */}
            <div className="border-3 border-black rounded-xl p-3.5 bg-[#121210] text-white flex items-center justify-center gap-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[1.5deg]">
              <span className="text-xl">🏆</span>
              <span className="font-black text-sm uppercase tracking-wider text-white">
                PROJECT SUCCESS
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
