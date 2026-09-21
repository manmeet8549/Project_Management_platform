'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

import { clientCache } from '@/lib/client/clientCache';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check token on initial mount & pathname changes
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        clientCache.clear();
        setToken(null);
        setUser(null);
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = 
      pathname === '/' || 
      pathname.startsWith('/auth') || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup') || 
      pathname.startsWith('/api') || 
      pathname === '/api-tester';

    const hasAuth = Boolean(token || localStorage.getItem('auth_token'));

    if (!isPublicRoute && !hasAuth) {
      router.replace('/auth?mode=signin');
    } else if ((pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/signup')) && hasAuth) {
      router.replace('/dashboard');
    }
  }, [pathname, token, isLoading, router]);

  const login = (newToken: string, newUser: AuthUser) => {
    clientCache.clear();
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.replace('/dashboard');
  };

  const logout = () => {
    clientCache.clear();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    router.replace('/auth?mode=signin');
  };

  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') || 
    pathname.startsWith('/api') || 
    pathname === '/api-tester';

  const hasAuth = Boolean(token || (typeof window !== 'undefined' && localStorage.getItem('auth_token')));

  // Render security loading shield if accessing protected page without resolved auth state
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white border-3 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FFD93D] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Loader2 className="w-6 h-6 stroke-[2.5] animate-spin text-black" />
          </div>
          <div>
            <h3 className="font-black text-base text-black uppercase tracking-wider">Logging in</h3>
            <p className="text-xs font-bold text-zinc-500 mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Prevent flash of protected UI before redirecting
  if (!isPublicRoute && !hasAuth) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-[#FFEAEA] border-3 border-black p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-[#FF6B6B] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-base text-black uppercase tracking-wider">Access Restricted</h3>
            <p className="text-xs font-bold text-[#B91C1C] mt-1">You must sign in to view this workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(token), isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
