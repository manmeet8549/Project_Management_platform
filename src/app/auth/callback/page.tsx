'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthGuard';
import { User as SupabaseUser } from '@supabase/supabase-js';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<string>('Verifying authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processAuth() {
      try {
        // Check if hash has access_token and refresh_token
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            // Set session directly in Supabase
            if (refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            }

            // Decode JWT payload directly to avoid network roundtrip delays
            try {
              const base64Url = accessToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              if (payload.email) {
                const userEmail = payload.email;
                const userName = payload.user_metadata?.full_name || payload.user_metadata?.name || userEmail.split('@')[0] || 'Google User';
                if (isMounted) {
                  await syncUserWithPlatformDirect(userEmail, userName);
                  return;
                }
              }
            } catch (jwtErr) {
              console.warn('JWT direct decode fallback skipped:', jwtErr);
            }
          }
        }

        // 1. Get current session from Supabase client
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Supabase session error:', sessionError);
          if (isMounted) setError(sessionError.message || 'Failed to retrieve authenticated session.');
          return;
        }

        if (!session || !session.user) {
          // Listen for onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
            if (currentSession?.user && isMounted) {
              await syncUserWithPlatform(currentSession.user);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (isMounted && (!session || !session.user)) {
              setError('No authenticated session found. Please try signing in again.');
            }
          }, 6000);

          return () => {
            authListener.subscription.unsubscribe();
          };
        }

        if (isMounted) {
          await syncUserWithPlatform(session.user);
        }
      } catch (err: unknown) {
        console.error('OAuth callback error:', err);
        const msg = err instanceof Error ? err.message : 'An unexpected error occurred during Google sign-in.';
        if (isMounted) setError(msg);
      }
    }

    async function syncUserWithPlatformDirect(email: string, name: string) {
      setStatus('Syncing user profile with workspace...');

      const res = await fetch('/api/v1/auth/oauth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        if (isMounted) setError(resData.message || resData.error || 'Failed to synchronize user account.');
        return;
      }

      const { user: platformUser, token } = resData.data;
      login(token, platformUser);
    }

    async function syncUserWithPlatform(user: SupabaseUser) {
      const email = user.email;
      const name = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || email?.split('@')[0] || 'Google User';
      if (email) {
        await syncUserWithPlatformDirect(email, name);
      }
    }

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [login, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-dot-grid flex flex-col items-center justify-center font-sans p-6">
      <div className="bg-white border-3 border-black p-8 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 text-center max-w-md w-full">
        {error ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#FFEAEA] border-2 border-black flex items-center justify-center text-[#B91C1C] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-black">Sign In Failed</h3>
              <p className="text-xs font-bold text-[#B91C1C]">{error}</p>
            </div>
            <button
              onClick={() => router.replace('/auth?mode=signin')}
              className="mt-2 bg-[#FF6B6B] hover:bg-[#FF5252] text-white font-black text-xs px-5 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#FFD93D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Loader2 className="w-7 h-7 stroke-[2.5] animate-spin text-black" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-black uppercase tracking-wide">Connecting Google Account</h3>
              <p className="text-xs font-bold text-zinc-500">{status}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-black text-black text-xs">
          Loading...
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
