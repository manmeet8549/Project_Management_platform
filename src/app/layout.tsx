import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { FloatingDock } from '@/components/layout/FloatingDock';
import { AuthProvider } from '@/components/auth/AuthGuard';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Project Workspace',
  description: 'Modern neo-brutalist project management workspace powered by real-time database storage and AI Copilot.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
          <FloatingDock />
        </AuthProvider>
      </body>
    </html>
  );
}

