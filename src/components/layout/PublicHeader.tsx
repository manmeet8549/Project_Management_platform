import React from 'react';
import Link from 'next/link';

export function PublicHeader() {
  return (
    <header className="w-full max-w-6xl mx-auto pt-6 px-6 md:px-12 flex items-center justify-between relative z-20">
      <div className="flex items-center">
        {/* Intentionally minimal top header branding */}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Link href="/dashboard" className="bg-white text-black font-extrabold text-xs md:text-sm px-5 py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer inline-block">
          Sign In
        </Link>
        <Link href="/" className="bg-[#FF6B6B] text-white font-extrabold text-xs md:text-sm px-5 py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer inline-block">
          Get Started Free
        </Link>
      </div>
    </header>
  );
}
