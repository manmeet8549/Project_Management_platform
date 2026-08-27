'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowLeft,
  CheckSquare,
  Folder,
  Calendar,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid text-[#121210] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative selection:bg-[#FFD93D] selection:text-black">
      
      {/* Back to Home Link */}
      <div className="w-full max-w-4xl mb-3">
        <Link 
          href="/" 
          className="bg-white hover:bg-zinc-50 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Compact Split Container */}
      <div className="w-full max-w-4xl bg-white border-3 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: BRANDING & ILLUSTRATION (5 Columns) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-[#FAF8F5] border-b-3 lg:border-b-0 lg:border-r-3 border-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          
          {/* Top Logo Sticker */}
          <div className="relative z-10">
            {/* Perfectly Aligned 2x2 Grid Color Blocks Logo */}
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-1.5 shrink-0">
              <div className="grid grid-cols-2 gap-1 w-full h-full">
                <div className="bg-[#FF6B6B] rounded-[2px]" />
                <div className="bg-[#FFD93D] rounded-[2px]" />
                <div className="bg-[#C4B5FD] rounded-[2px]" />
                <div className="bg-[#121210] rounded-[2px]" />
              </div>
            </div>

            {/* Main Headline */}
            <div className="mt-5 space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight">
                Your <span className="text-[#FF6B6B]">Workspace.</span>
              </h1>
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight">
                Your <span className="text-[#7C3AED]">Progress.</span>
              </h1>
            </div>

            <p className="text-xs font-bold text-zinc-600 mt-2.5 leading-relaxed max-w-xs">
              {"Organize your projects, track tasks, and stay focused — all in one place."}
            </p>
          </div>

          {/* Product Illustration Graphic Area */}
          <div className="relative mt-6 pt-2">
            
            {/* Red Circle Accent */}
            <div className="w-20 h-20 rounded-full bg-[#FF6B6B] border-2 border-black absolute -top-3 -left-3 z-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />

            {/* Main Dark Dashboard Window Graphic */}
            <div className="bg-[#121210] border-2 border-black rounded-xl p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative z-10 text-white flex gap-2.5 min-h-[130px]">
              
              {/* Sidebar */}
              <div className="w-7 border-r border-zinc-800 flex flex-col items-center gap-2 py-0.5">
                <div className="w-4 h-4 rounded bg-[#FF6B6B] border border-black flex items-center justify-center text-[9px]">🏠</div>
                <CheckSquare className="w-3 h-3 text-zinc-400" />
                <Folder className="w-3 h-3 text-zinc-400" />
                <Calendar className="w-3 h-3 text-zinc-400" />
                <BarChart2 className="w-3 h-3 text-zinc-400" />
              </div>

              {/* Board Mockup Content */}
              <div className="flex-1 space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5 text-[8px] font-extrabold text-zinc-400 border-b border-zinc-800 pb-1">
                  <span>To Do</span>
                  <span>In Progress</span>
                  <span>Done</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-zinc-900 border border-zinc-700 p-1 rounded space-y-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B]" />
                    <div className="h-1 bg-zinc-700 rounded w-full" />
                  </div>

                  <div className="bg-zinc-900 border border-zinc-700 p-1 rounded space-y-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFD93D]" />
                    <div className="h-1 bg-zinc-700 rounded w-full" />
                  </div>

                  <div className="bg-zinc-900 border border-zinc-700 p-1 rounded space-y-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C4B5FD]" />
                    <div className="h-1 bg-zinc-700 rounded w-full" />
                  </div>
                </div>
              </div>

            </div>

            {/* Floating Donut Chart Card */}
            <div className="bg-white border-2 border-black p-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] absolute -bottom-2 right-10 z-20 w-12 h-12 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-3 border-[#FF6B6B] border-t-[#FFD93D] border-r-[#C4B5FD]" />
            </div>

            {/* Yellow Sticker Accent Card */}
            <div className="bg-[#FFD93D] border-2 border-black p-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] absolute -bottom-4 -right-1 z-10 w-20 h-10 flex items-end justify-around">
              <div className="w-1.5 h-4 bg-[#FF6B6B] border border-black" />
              <div className="w-1.5 h-6 bg-black border border-black" />
              <div className="w-1.5 h-3 bg-[#C4B5FD] border border-black" />
            </div>

            {/* Matrix Dots */}
            <div className="grid grid-cols-5 gap-1 mt-4 w-16">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-[#C4B5FD]" />
              ))}
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE AUTH FORM (7 Columns) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          
          {/* Top Tab Bar Toggle */}
          <div>
            <div className="flex items-center gap-6 border-b border-zinc-200 pb-2.5 mb-5">
              <button
                onClick={() => setMode('signin')}
                className={cn(
                  "text-sm sm:text-base font-black transition-all cursor-pointer relative pb-1",
                  mode === 'signin'
                    ? "text-black"
                    : "text-zinc-400 hover:text-black"
                )}
              >
                <span>Sign In</span>
                {mode === 'signin' && (
                  <div className="w-full h-0.5 bg-[#FF6B6B] absolute -bottom-2.5 left-0 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setMode('signup')}
                className={cn(
                  "text-sm sm:text-base font-black transition-all cursor-pointer relative pb-1",
                  mode === 'signup'
                    ? "text-black"
                    : "text-zinc-400 hover:text-black"
                )}
              >
                <span>Sign Up</span>
                {mode === 'signup' && (
                  <div className="w-full h-0.5 bg-[#FF6B6B] absolute -bottom-2.5 left-0 rounded-full" />
                )}
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-0.5 mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                {mode === 'signin' ? 'Welcome back!' : 'Create an account'}
              </h2>
              <p className="text-xs font-bold text-zinc-500">
                {mode === 'signin'
                  ? 'Sign in to continue to your workspace'
                  : 'Get started with your personal workspace'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Google SSO Button */}
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full bg-white hover:bg-zinc-50 text-black font-extrabold text-xs sm:text-sm py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {/* Official Google G Logo */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-zinc-200 flex-1" />
                <span className="text-[11px] font-bold text-zinc-400">or</span>
                <div className="h-px bg-zinc-200 flex-1" />
              </div>

              {/* Sign Up: Full Name Input */}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-black">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white text-black font-bold text-xs pl-9 pr-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Email Address Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-black">Email address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-white text-black font-bold text-xs pl-9 pr-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-black">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-white text-black font-bold text-xs pl-9 pr-9 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5 stroke-[2]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Extras: Remember Me & Forgot Password */}
              {mode === 'signin' && (
                <div className="flex items-center justify-between text-[11px] font-bold pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <div 
                      onClick={() => setRememberMe(!rememberMe)}
                      className={cn(
                        "w-3.5 h-3.5 rounded border-2 border-black flex items-center justify-center transition-all cursor-pointer",
                        rememberMe ? "bg-[#FF6B6B] text-white" : "bg-white"
                      )}
                    >
                      {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="text-zinc-700">Remember me</span>
                  </label>

                  <button type="button" className="text-[#FF6B6B] hover:underline cursor-pointer">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary Submit CTA Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </div>

            </form>
          </div>

          {/* Bottom Switch Mode Link */}
          <div className="text-center text-[11px] font-bold text-zinc-500 pt-4 border-t border-zinc-150">
            {mode === 'signin' ? (
              <span>
                {"Don't have an account? "}
                <button 
                  type="button" 
                  onClick={() => setMode('signup')}
                  className="text-[#7C3AED] font-extrabold hover:underline cursor-pointer ml-0.5"
                >
                  Sign up
                </button>
              </span>
            ) : (
              <span>
                {"Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => setMode('signin')}
                  className="text-[#7C3AED] font-extrabold hover:underline cursor-pointer ml-0.5"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-black text-black text-xs">
        Loading Auth...
      </div>
    }>
      <AuthFormContent />
    </Suspense>
  );
}
