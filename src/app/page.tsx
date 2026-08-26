import React from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { PainPoints } from '@/components/landing/PainPoints';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] flex flex-col font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* ========================================================================= */}
      {/* BACKGROUND DECORATIONS & SHAPES */}
      {/* ========================================================================= */}

      {/* 1. Top-Left Soft Lavender Blob */}
      <div className="absolute -top-16 -left-16 sm:-top-24 sm:-left-24 w-52 h-52 sm:w-72 sm:h-72 rounded-full bg-[#C4B5FD]/70 z-0 pointer-events-none" />

      {/* 2. Top-Left Yellow Star Sparkle */}
      <div className="absolute top-8 left-16 sm:left-28 z-0 pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-black fill-[#FFD93D] stroke-black stroke-[2]">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
      </div>

      {/* 3. Top-Right Subtle Dot Grid behind Hero Flowchart */}
      <div className="absolute right-6 sm:right-16 top-16 w-32 h-48 bg-[radial-gradient(circle,#000_1.5px,transparent_1.5px)] [background-size:10px_10px] opacity-15 z-0 pointer-events-none hidden md:block" />

      {/* 4. Mid-Right Yellow Angled Polygon Slice */}
      <div className="absolute right-0 top-72 sm:top-80 w-16 sm:w-24 md:w-32 h-44 sm:h-56 bg-[#FFD93D] border-l-4 border-y-4 border-black rounded-l-3xl rotate-12 translate-x-4 sm:translate-x-8 z-0 pointer-events-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hidden sm:block" />

      {/* 5. Middle-Left Purple Dot Grid Pattern */}
      <div className="absolute left-0 sm:left-4 top-[48%] w-24 sm:w-32 h-36 bg-[radial-gradient(circle,#8B5CF6_2.5px,transparent_2.5px)] [background-size:12px_12px] opacity-65 z-0 pointer-events-none hidden sm:block" />

      {/* 6. Middle-Right Vibrant Red Circle */}
      <div className="absolute -right-12 sm:-right-16 top-[54%] w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-[#FF6B6B] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-0 pointer-events-none" />

      {/* 7. Bottom-Left Red Circle */}
      <div className="absolute -left-10 -bottom-6 w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-[#FF6B6B] border-4 border-black z-0 pointer-events-none" />

      {/* ========================================================================= */}
      {/* MAIN CONTENT LAYOUT */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col flex-grow">
        
        {/* Navigation Header */}
        <PublicHeader />

        {/* Core Landing Page Sections */}
        <main className="flex-grow">
          {/* Fold 1: Hero Section with 5-Step Flowchart */}
          <Hero />

          {/* Fold 2: Capabilities 3x3 Card Grid */}
          <Features />

          {/* Fold 3: Chaotic Pain Points List */}
          <PainPoints />

          {/* Fold 4: Final Rocket CTA Card */}
          <FinalCTA />
        </main>

        {/* Bottom Dotted Matrix Bar */}
        <div className="w-64 sm:w-80 h-6 bg-[radial-gradient(circle,#000_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-25 mx-auto mb-6 pointer-events-none" />
      </div>

    </div>
  );
}
