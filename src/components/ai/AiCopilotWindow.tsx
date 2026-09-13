'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Send, 
  BarChart3, 
  ListPlus,
  Loader2,
  CheckCircle2,
  ArrowRight,
  FolderPlus,
  FolderCheck,
  Lock,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invalidateClientCache } from '@/lib/client/clientCache';

interface ImportedTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  badge?: string;
  showImportAction?: boolean;
  createdType?: 'credential' | 'note';
  createdItem?: {
    id: string;
    title: string;
    category?: string;
    excerpt?: string;
  };
  importedTasksSummary?: {
    ideaSummary: string;
    count: number;
    tasks: ImportedTask[];
    project?: {
      id: string;
      title: string;
      isNew: boolean;
    };
  };
}

interface AiCopilotWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiCopilotWindow({ isOpen, onClose }: AiCopilotWindowProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your Personal AI Copilot powered by NVIDIA AI NIM.\n\nHave a new project or feature idea? Chat with me to refine it, and click 'Import Idea into Todo List' whenever you're ready!",
      timestamp: 'Just now',
      badge: 'NVIDIA AI NIM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isImporting]);

  // Convert refined idea conversation into actionable Todo List with categories/priorities
  const handleImportIdeaToTodoList = async () => {
    if (isImporting || isLoading) return;
    setIsImporting(true);

    // Detect if currently on a specific project page: /projects/[id]
    let currentProjectId: string | undefined = undefined;
    if (pathname?.startsWith('/projects/')) {
      const parts = pathname.split('/projects/')[1];
      if (parts && parts !== 'new') {
        currentProjectId = parts.split('/')[0];
      }
    }

    try {
      const apiMessages = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiMessages,
          action: 'convert_to_tasks',
          currentProjectId,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const { ideaSummary, project, importedCount, tasks } = data.data;

        // Dispatch browser events so dashboard and project list update dynamically
        window.dispatchEvent(new Event('projectsUpdated'));
        window.dispatchEvent(new Event('tasksUpdated'));
        window.dispatchEvent(new Event('taskUpdated'));

        const isNew = project?.isNew;
        const projTitle = project?.title || 'Idea Workspace';
        const projId = project?.id;

        const aiMsg: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: isNew
            ? `🚀 **New Project Created: "${projTitle}"**\n\nI created a new project and generated ${importedCount} categorized todo tasks with priorities!`
            : `✨ **Updated Project: "${projTitle}"**\n\nI added ${importedCount} new categorized todo tasks to your existing project todo list!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: isNew ? 'New Project Created' : 'Project Updated',
          importedTasksSummary: {
            ideaSummary,
            count: importedCount,
            tasks,
            project: {
              id: projId,
              title: projTitle,
              isNew: !!isNew,
            },
          },
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `Failed to import idea: ${data.error || 'Unknown error parsing tasks.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: 'Import Failed',
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Error importing idea:', err);
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Error generating tasks for idea. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsImporting(false);
    }
  };

  // General Chat message handler calling /api/v1/ai/chat
  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading || isImporting) return;

    const userMsgText = query.trim();

    // If user explicitly asks to import idea to todo, trigger task import workflow directly!
    const lowerText = userMsgText.toLowerCase();
    if (
      lowerText === 'import idea to todo' ||
      lowerText === 'import idea into todo list' ||
      lowerText === 'import idea' ||
      lowerText.includes('import idea to todo')
    ) {
      setInputText('');
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: userMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
      await handleImportIdeaToTodoList();
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      let currentProjectId: string | undefined = undefined;
      if (pathname?.startsWith('/projects/')) {
        const parts = pathname.split('/projects/')[1];
        if (parts && parts !== 'new') {
          currentProjectId = parts.split('/')[0];
        }
      }

      const apiMessages = updatedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: apiMessages,
          action: 'chat',
          currentProjectId,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success && data.data?.reply) {
        const replyText = data.data.reply;
        const createdType = data.data.createdType as 'credential' | 'note' | undefined;
        const updatedType = data.data.updatedType as string | undefined;
        const createdItem = data.data.item;

        if (createdType === 'credential' || updatedType === 'credential') {
          invalidateClientCache();
          window.dispatchEvent(new Event('credentialsUpdated'));
        } else if (createdType === 'note' || updatedType === 'note') {
          invalidateClientCache();
          window.dispatchEvent(new Event('notesUpdated'));
        }

        if (updatedType === 'task' || updatedType === 'project' || data.data.actionExecuted) {
          invalidateClientCache();
          window.dispatchEvent(new Event('projectsUpdated'));
          window.dispatchEvent(new Event('tasksUpdated'));
          window.dispatchEvent(new Event('taskUpdated'));
        }

        const hasIdeaIntent = 
          userMsgText.toLowerCase().includes('idea') ||
          userMsgText.toLowerCase().includes('build') ||
          userMsgText.toLowerCase().includes('feature') ||
          userMsgText.toLowerCase().includes('app') ||
          userMsgText.toLowerCase().includes('create') ||
          userMsgText.toLowerCase().includes('refine') ||
          replyText.toLowerCase().includes('todo') ||
          replyText.toLowerCase().includes('import');

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: createdType === 'credential' ? 'Credential Saved' : createdType === 'note' ? 'Note Saved' : 'Refinement Copilot',
          showImportAction: hasIdeaIntent && !createdType,
          createdType,
          createdItem: createdItem ? {
            id: createdItem.id,
            title: createdItem.title,
            category: createdItem.category,
            excerpt: createdItem.excerpt,
          } : undefined,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I'm having trouble connecting to NVIDIA AI Engine. Please check your network or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          badge: 'AI Error',
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('AI Chat client error:', err);
      setIsLoading(false);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Error communicating with AI Copilot. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-28 right-6 z-50 w-full sm:w-[440px] max-w-[calc(100vw-2.5rem)] bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[560px] font-sans"
        >
          {/* Header */}
          <div className="bg-[#7C3AED] border-b-3 border-black p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-4 h-4 text-[#7C3AED] stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white tracking-wide flex items-center gap-1.5">
                  <span>AI Idea Refiner</span>
                  <span className="text-[9px] bg-[#FFD93D] text-black px-1.5 py-0.5 rounded border border-black font-black uppercase">NVIDIA NIM</span>
                </h3>
                <div className="text-[10px] font-bold text-white/80">Llama-3.2 Vision • Real-time Task Generator</div>
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
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF8F5] bg-dot-grid">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[90%]",
                  msg.sender === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "p-3.5 rounded-xl border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-2",
                  msg.sender === 'user'
                    ? "bg-[#FF6B6B] text-black"
                    : "bg-white text-black"
                )}>
                  {msg.badge && (
                    <span className="inline-block bg-[#F3E8FF] text-[#7C3AED] text-[9px] font-black px-1.5 py-0.5 rounded border border-black/30 uppercase tracking-wider mb-1">
                      {msg.badge}
                    </span>
                  )}

                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Option to Import Idea into Todo List */}
                  {msg.showImportAction && msg.sender === 'ai' && (
                    <div className="pt-2 border-t border-black/10 mt-2">
                      <button
                        onClick={handleImportIdeaToTodoList}
                        disabled={isImporting}
                        className="w-full bg-[#FFD93D] hover:bg-[#FACC15] text-black font-black text-xs px-3 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Parsing & Generating Tasks...</span>
                          </>
                        ) : (
                          <>
                            <ListPlus className="w-4 h-4 stroke-[2.5]" />
                            <span>Import Idea into Todo List</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Render Created Credential or Note Card Preview if generated */}
                  {msg.createdType && msg.createdItem && (
                    <div className="mt-2 bg-[#E0F2FE] border-2 border-black rounded-lg p-2.5 text-xs text-black space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-[#0369A1] uppercase tracking-wider">
                        {msg.createdType === 'credential' ? (
                          <Lock className="w-3.5 h-3.5 text-[#15803D]" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
                        )}
                        <span>{msg.createdType === 'credential' ? 'Credential Saved to Database' : 'Note Saved to Documentation'}</span>
                      </div>
                      <div className="bg-white border border-black p-2 rounded-md font-black text-xs">
                        {msg.createdItem.title}
                        {msg.createdItem.category && (
                          <span className="ml-2 text-[9px] bg-[#DCFCE7] text-[#15803D] px-1.5 py-0.5 rounded border border-black/30">
                            {msg.createdItem.category}
                          </span>
                        )}
                        {msg.createdItem.excerpt && (
                          <p className="font-bold text-[10px] text-zinc-600 line-clamp-2 mt-1">
                            {msg.createdItem.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Render Imported Task Card Preview if available */}
                  {msg.importedTasksSummary && (
                    <div className="mt-2 bg-[#E0F2FE] border-2 border-black rounded-lg p-2.5 text-xs text-black space-y-2">
                      {/* Project Header Badge */}
                      {msg.importedTasksSummary.project && (
                        <div className="flex items-center justify-between gap-1.5 bg-white border border-black p-1.5 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-[#7C3AED]">
                            {msg.importedTasksSummary.project.isNew ? (
                              <FolderPlus className="w-3.5 h-3.5 text-[#7C3AED]" />
                            ) : (
                              <FolderCheck className="w-3.5 h-3.5 text-[#0369A1]" />
                            )}
                            <span className="truncate max-w-[200px]">
                              {msg.importedTasksSummary.project.isNew ? 'New Project: ' : 'Updated Project: '}
                              {msg.importedTasksSummary.project.title}
                            </span>
                          </div>
                          {msg.importedTasksSummary.project.isNew && (
                            <span className="text-[8px] font-black bg-[#FFD93D] text-black px-1 rounded border border-black uppercase">
                              NEW
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] font-black text-[#0369A1] uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0369A1]" />
                        <span>Tasks Saved to Database</span>
                      </div>
                      <p className="font-bold text-[11px] text-zinc-700 italic">
                        &quot;{msg.importedTasksSummary.ideaSummary}&quot;
                      </p>
                      
                      <div className="space-y-1.5 pt-1">
                        {msg.importedTasksSummary.tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="bg-white border border-black p-2 rounded-md flex items-start justify-between gap-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <div>
                              <div className="font-black text-[11px] text-black">{task.title}</div>
                              {task.description && (
                                <div className="text-[10px] text-zinc-600 font-medium line-clamp-1">{task.description}</div>
                              )}
                            </div>

                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-black shrink-0",
                              task.priority === 'urgent' && "bg-[#FF6B6B] text-white",
                              task.priority === 'high' && "bg-[#FFD93D] text-black",
                              task.priority === 'medium' && "bg-[#C4B5FD] text-black",
                              task.priority === 'low' && "bg-[#A7F3D0] text-black"
                            )}>
                              {task.priority}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Link 
                        href={msg.importedTasksSummary.project?.id ? `/projects/${msg.importedTasksSummary.project.id}` : '/projects'} 
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-[#0369A1] hover:underline pt-1 cursor-pointer"
                      >
                        <span>Open Project Board</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-bold text-zinc-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* AI Streaming Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 bg-white border-2 border-black p-2.5 rounded-xl max-w-[70%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                <span>NVIDIA AI Copilot is thinking...</span>
              </div>
            )}

            {isImporting && (
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 bg-[#FFD93D] border-2 border-black p-2.5 rounded-xl max-w-[85%] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Analyzing idea & creating categorized Todo tasks...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips & Import Button Toolbar */}
          <div className="bg-white border-t-2 border-black p-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px] font-black">
            <button
              onClick={handleImportIdeaToTodoList}
              disabled={isImporting || isLoading}
              className="bg-[#FFD93D] text-black hover:bg-[#FACC15] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-black"
              title="Convert conversation idea into Todo tasks with priorities"
            >
              <ListPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Import Idea to Todo</span>
            </button>

            <button
              onClick={() => handleSend("Add a credential for database connection: Supabase DB URL = https://xyz.supabase.co, Database Password = secret_db_pass")}
              disabled={isImporting || isLoading}
              className="bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 stroke-[2.5]" />
              <span>Add Credential via AI</span>
            </button>

            <button
              onClick={() => handleSend("Add a note: Project Deployment Requirements & Checklist")}
              disabled={isImporting || isLoading}
              className="bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#DDD6FE] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3 stroke-[2.5]" />
              <span>Add Note via AI</span>
            </button>

            <button
              onClick={() => handleSend("Summarize project status & deadlines")}
              disabled={isImporting || isLoading}
              className="bg-[#E0F2FE] text-[#0369A1] hover:bg-[#BAE6FD] border border-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <BarChart3 className="w-3 h-3 stroke-[2.5]" />
              <span>Status Audit</span>
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t-2 border-black flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Refine your idea or type 'Import Idea to Todo'..."
              className="flex-1 bg-white text-black font-bold text-xs px-3 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || isImporting}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
