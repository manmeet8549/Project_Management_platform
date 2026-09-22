'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useTransform, 
  MotionValue 
} from 'framer-motion';
import { 
  Home, 
  FolderKanban, 
  Bell, 
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiCopilotWindow } from '@/components/ai/AiCopilotWindow';
import { useAuth } from '@/components/auth/AuthGuard';

export function FloatingDock() {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop view vs mobile/tablet view
  useEffect(() => {
    const checkDesktop = () => {
      // Desktop: viewport width >= 1024px AND device has fine pointer with hover (mouse/trackpad)
      const isWide = window.innerWidth >= 1024;
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      setIsDesktop(isWide && hasFinePointer);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Do not render the floating dock or AI window on landing page or auth routes
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/signup')) return null;

  const navItems = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: Home,
      bgColor: 'bg-[#FF6B6B]',
      textColor: 'text-white',
    },
    {
      title: 'Projects Overview',
      href: '/projects',
      icon: FolderKanban,
      bgColor: 'bg-[#C4B5FD]',
      textColor: 'text-black',
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: Bell,
      bgColor: 'bg-[#F3E8FF]',
      textColor: 'text-[#7C3AED]',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      bgColor: 'bg-[#E0F2FE]',
      textColor: 'text-[#0369A1]',
    },
  ];

  return (
    <>
      <div 
        className="fixed bottom-0 inset-x-0 z-50 pointer-events-none flex justify-center pb-4 sm:pb-6 px-3 selection:bg-none"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 16px))',
        }}
      >
        <div className="pointer-events-auto max-w-[calc(100vw-1.5rem)]">
          {isDesktop ? (
            /* ========================================================================= */
            /* DESKTOP VIEW: Cursor-based spring magnification & animated hover tooltip  */
            /* ========================================================================= */
            <motion.nav 
              onMouseMove={(e) => mouseX.set(e.pageX)}
              onMouseLeave={() => mouseX.set(Infinity)}
              className="bg-white/95 backdrop-blur-md border-3 border-black px-6 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-4.5 h-[84px] sm:h-[88px]"
            >
              {navItems.map((item) => (
                <DesktopIconContainer 
                  key={item.href}
                  mouseX={mouseX}
                  title={item.title}
                  href={item.href}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  textColor={item.textColor}
                  isActive={pathname === item.href}
                />
              ))}

              {/* Vertical Divider | */}
              <div className="w-px h-6 bg-zinc-400 border-r border-black/30 mx-0.5 shrink-0" />

              {/* AI Copilot Button */}
              <DesktopIconContainer 
                mouseX={mouseX}
                title="AI Copilot"
                onClick={() => setIsAiOpen(!isAiOpen)}
                icon={Sparkles}
                bgColor="bg-[#7C3AED]"
                textColor="text-white"
                isActive={isAiOpen}
              />

              {/* Logout Button */}
              <DesktopIconContainer 
                mouseX={mouseX}
                title={`Logout (${user?.name || 'User'})`}
                onClick={logout}
                icon={LogOut}
                bgColor="bg-[#FF6B6B]"
                textColor="text-white"
                isActive={false}
              />
            </motion.nav>
          ) : (
            /* ========================================================================= */
            /* MOBILE & TAB VIEW: Normal interaction, no cursor animation, stable taps   */
            /* ========================================================================= */
            <nav 
              className="bg-white/95 backdrop-blur-md border-3 border-black px-3.5 sm:px-5 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2.5 sm:gap-3.5 h-[58px] sm:h-[62px] touch-none"
            >
              {navItems.map((item) => (
                <MobileIconContainer 
                  key={item.href}
                  title={item.title}
                  href={item.href}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  textColor={item.textColor}
                  isActive={pathname === item.href}
                />
              ))}

              {/* Vertical Divider | */}
              <div className="w-px h-5 bg-zinc-400 border-r border-black/30 mx-0.5 shrink-0" />

              {/* AI Copilot Button */}
              <MobileIconContainer 
                title="AI Copilot"
                onClick={() => setIsAiOpen(!isAiOpen)}
                icon={Sparkles}
                bgColor="bg-[#7C3AED]"
                textColor="text-white"
                isActive={isAiOpen}
              />

              {/* Logout Button */}
              <MobileIconContainer 
                title={`Logout (${user?.name || 'User'})`}
                onClick={logout}
                icon={LogOut}
                bgColor="bg-[#FF6B6B]"
                textColor="text-white"
                isActive={false}
              />
            </nav>
          )}
        </div>
      </div>

      {/* Floating AI Copilot Window */}
      <AiCopilotWindow isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}

/**
 * Desktop Icon Container with cursor magnification physics
 */
function DesktopIconContainer({
  mouseX,
  title,
  href,
  onClick,
  icon: Icon,
  bgColor,
  textColor,
  isActive,
}: {
  mouseX: MotionValue<number>;
  title: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Scale outer container width & height: 42px -> 70px -> 42px
  const widthTransform = useTransform(distance, [-150, 0, 150], [42, 70, 42]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [42, 70, 42]);

  // Scale inner SVG icon size: 20px -> 34px -> 20px
  const iconSizeTransform = useTransform(distance, [-150, 0, 150], [20, 34, 20]);

  // Apply spring physics
  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconSize = useSpring(iconSizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "rounded-full border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors cursor-pointer",
        bgColor,
        textColor,
        isActive ? "border-3 ring-2 ring-black/20" : ""
      )}
    >
      {/* Animated Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-1/2 bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap pointer-events-none z-50"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Icon */}
      <motion.div
        style={{ width: iconSize, height: iconSize }}
        className="flex items-center justify-center"
      >
        <Icon className="w-full h-full stroke-[2.5]" />
      </motion.div>

      {/* Active Indicator Dot */}
      {isActive && (
        <div className="w-1.5 h-1.5 bg-black rounded-full absolute -bottom-2 left-1/2 -translate-x-1/2" />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="relative block">
        {content}
      </Link>
    );
  }

  return <div className="relative block">{content}</div>;
}

/**
 * Mobile & Tablet Icon Container without cursor animations for normal, seamless touch interaction
 */
function MobileIconContainer({
  title,
  href,
  onClick,
  icon: Icon,
  bgColor,
  textColor,
  isActive,
}: {
  title: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  isActive: boolean;
}) {
  const content = (
    <div
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform cursor-pointer shrink-0 select-none",
        bgColor,
        textColor,
        isActive ? "border-3 ring-2 ring-black/20" : ""
      )}
    >
      <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center">
        <Icon className="w-full h-full stroke-[2.5]" />
      </div>

      {/* Active Indicator Dot */}
      {isActive && (
        <div className="w-1.5 h-1.5 bg-black rounded-full absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="relative block shrink-0" aria-label={title}>
        {content}
      </Link>
    );
  }

  return (
    <div className="relative block shrink-0">
      {content}
    </div>
  );
}
