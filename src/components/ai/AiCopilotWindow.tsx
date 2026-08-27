'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Send, 
  BarChart3, 
  FileText, 
  Calendar 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  badge?: string;
}

interface AiCopilotWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiCopilotWindow({ isOpen, onClose }: AiCopilotWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your Personal AI Copilot. How can I help you manage your workspace today?",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Simulate AI Response based on query
    setTimeout(() => {
      let responseText = "I've analyzed your workspace context. Everything is synchronized and up to date!";
      let badgeText = "AI Insight";

      const lower = query.toLowerCase();
      if (lower.includes('status') || lower.includes('summarize')) {
        responseText = "Workspace Summary: You have 1 active project ('E-Commerce Website') with 24 completed tasks out of 30 (80% completion rate). 12 days remaining until Aug 30, 2025 deadline!";
        badgeText = "Status Audit";
      } else if (lower.includes('requirement') || lower.includes('note') || lower.includes('draft')) {
        responseText = "I've drafted a new note idea: 'Supabase Row Level Security Audit & Stripe Webhook Secret rotation'. Would you like me to save this to your Notes?";
        badgeText = "Draft Note";
      } else if (lower.includes('deadline') || lower.includes('due')) {
        responseText = "Upcoming Deadlines:\n1. 'Design Homepage' - Due May 28, 2025\n2. 'Setup Product Database' - Due May 30, 2025\n3. 'Project Launch' - Due Aug 30, 2025.";
        badgeText = "Deadlines";
      } else if (lower.includes('credential') || lower.includes('key')) {
        responseText = "Credentials Check: 6 stored credentials (GitHub, Supabase, Vercel, Stripe, SendGrid, Cloudinary). All 256-bit AES encrypted.";
        badgeText = "Security Check";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: badgeText,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-28 right-6 z-50 w-full sm:w-[400px] max-w-[calc(100vw-3rem)] bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[520px] font-sans"
        >
          {/* Header */}
          <div className="bg-[#7C3AED] border-b-3 border-black p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-4 h-4 text-[#7C3AED] stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white tracking-wide">AI Copilot</h3>
                <div className="text-[10px] font-bold text-white/80">Personal Project Assistant</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF8F5] bg-dot-grid">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.sender === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-1",
                  msg.sender === 'user'
                    ? "bg-[#FF6B6B] text-black"
                    : "bg-white text-black"
                )}>
                  {msg.badge && (
                    <span className="inline-block bg-[#F3E8FF] text-[#7C3AED] text-[9px] font-black px-1.5 py-0.5 rounded border border-black/20 uppercase tracking-wider mb-1">
                      {msg.badge}
                    </span>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[9px] font-bold text-zinc-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="bg-white border-t-2 border-black p-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px] font-black">
            <button
              onClick={() => handleSend("Summarize project status")}
              className="bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <BarChart3 className="w-3 h-3 stroke-[2.5]" />
              <span>Status Audit</span>
            </button>

            <button
              onClick={() => handleSend("Show upcoming deadlines")}
              className="bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3 h-3 stroke-[2.5]" />
              <span>Deadlines</span>
            </button>

            <button
              onClick={() => handleSend("Draft project requirements note")}
              className="bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#DDD6FE] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3 stroke-[2.5]" />
              <span>Draft Note</span>
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t-2 border-black flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI Copilot anything..."
              className="flex-1 bg-white text-black font-bold text-xs px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />

            <button
              onClick={() => handleSend()}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
