import { NextRequest, NextResponse } from 'next/server';
import { db, TaskRecord, CredentialRecord, NoteRecord } from '@/lib/api/db/db';
import { getAuthUserOptional } from '@/lib/api/middleware/middleware';

export const dynamic = 'force-dynamic';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL_NAME = 'meta/llama-3.2-11b-vision-instruct';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Fallback task extractor when AI service is slow or unresponsive
function extractTasksFallback(messages: ChatMessage[]): {
  projectTitle: string;
  ideaSummary: string;
  tasks: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent' }>;
} {
  const userTexts = messages.filter((m) => m.role === 'user').map((m) => m.content);
  const fullText = userTexts.join(' ').toLowerCase();

  let projectTitle = 'Refined Idea Project';
  if (userTexts.length > 0) {
    const rawMsg = userTexts[userTexts.length - 1] || userTexts[0];
    const cleaned = rawMsg
      .replace(/^I have an idea:?\s*/i, '')
      .replace(/^make a todo list for\s*/i, '')
      .replace(/^create a todo list for\s*/i, '')
      .replace(/^build\s*/i, '')
      .replace(/^import idea.*$/i, '');
    const words = cleaned.trim().split(' ').slice(0, 5).join(' ');
    if (words.length > 3) {
      projectTitle = words.charAt(0).toUpperCase() + words.slice(1);
    }
  }

  const ideaSummary = userTexts[userTexts.length - 1] && !userTexts[userTexts.length - 1].toLowerCase().includes('import idea')
    ? userTexts[userTexts.length - 1]
    : 'Refined application concept generated with AI Copilot.';

  let tasks: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent' }> = [];

  if (fullText.includes('scrape') || fullText.includes('scraper') || fullText.includes('google maps') || fullText.includes('telegram') || fullText.includes('excel')) {
    projectTitle = 'Google Maps Lead Scraper & Telegram Bot';
    tasks = [
      {
        title: 'Integrate Google Maps API & Scraping Pipeline',
        description: 'Configure scraping parameters, location search queries, and data extraction parser for Google Maps listings.',
        priority: 'high',
      },
      {
        title: 'Build Excel Export & File Formatter',
        description: 'Format extracted lead data into structured Excel spreadsheet files with contact info, phone, and website.',
        priority: 'high',
      },
      {
        title: 'Develop Telegram Bot Interface & Commands',
        description: 'Create interactive Telegram bot handlers for user search queries, progress status, and file download commands.',
        priority: 'urgent',
      },
      {
        title: 'Implement Database Storage & Multi-User Access',
        description: 'Store scraped leads and search history safely in PostgreSQL database with user data isolation.',
        priority: 'medium',
      },
      {
        title: 'Execute Quality Verification & Bot Deployment',
        description: 'Perform end-to-end integration tests, verify Excel file downloads, and deploy bot service to production.',
        priority: 'low',
      },
    ];
  } else {
    tasks = [
      {
        title: 'Define System Architecture & Data Schema',
        description: 'Design core models, database tables, and API endpoint contracts for ' + projectTitle,
        priority: 'high',
      },
      {
        title: 'Develop Core Feature Logic & API Services',
        description: 'Implement backend business routes, validation handlers, and state logic',
        priority: 'urgent',
      },
      {
        title: 'Create Interactive Frontend Components',
        description: 'Build responsive neo-brutalist UI layout and real-time state listeners',
        priority: 'medium',
      },
      {
        title: 'Configure JWT Auth & API Route Security',
        description: 'Implement secure header checks, token expiration, and user session guards',
        priority: 'high',
      },
      {
        title: 'Execute Integration Verification & Quality Audit',
        description: 'Run automated build checks, verify database persistence, and deploy',
        priority: 'low',
      },
    ];
  }

  return { projectTitle, ideaSummary, tasks };
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUserOptional(req);
    const body = await req.json();
    const { messages = [], action = 'chat', currentProjectId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Messages array is required' }, { status: 400 });
    }

    const latestUserMsg = messages[messages.length - 1]?.content || '';
    const isMakeTodoListIntent = action === 'convert_to_tasks' || (
      /(?:make|create|generate|build|prepare|extract|add)\s+(?:a\s+|the\s+)?(?:todo|to-do|to\s+do|task)\s+(?:list|tasks)/i.test(latestUserMsg) ||
      /(?:make|create|generate|build|add)\s+(?:a\s+)?todo\s+list\s+for/i.test(latestUserMsg) ||
      /import\s+idea/i.test(latestUserMsg)
    );

    if (isMakeTodoListIntent) {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an expert Technical Product Manager and Task Extractor.
Analyze the project idea and conversation history provided.
Extract a list of 3 to 6 concrete, actionable todo tasks required to build and launch this idea.
Classify each task with an accurate priority ('urgent', 'high', 'medium', or 'low').
Also provide a short, punchy Project Title for this idea (3-5 words).

You MUST respond ONLY with a raw JSON object (no markdown, no conversational text) adhering strictly to this JSON format:
{
  "projectTitle": "Short Project Title (max 5 words)",
  "ideaSummary": "A concise 1-sentence summary of the refined project idea",
  "tasks": [
    {
      "title": "Clear, action-oriented task title (max 8 words)",
      "description": "Step-by-step implementation details (1-2 sentences)",
      "priority": "high"
    }
  ]
}`,
      };

      const payload = {
        model: MODEL_NAME,
        messages: [systemMessage, ...messages],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1000,
      };

      let parsedData: {
        projectTitle?: string;
        ideaSummary?: string;
        tasks?: Array<{ title: string; description?: string; priority: 'low' | 'medium' | 'high' | 'urgent' }>;
      } | null = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const responseData = await response.json();
          const rawContent = responseData.choices?.[0]?.message?.content || '';
          const jsonContent = cleanJsonString(rawContent);
          parsedData = JSON.parse(jsonContent);
        }
      } catch (err) {
        console.warn('AI Task Extraction API call timed out or failed, using local extractor:', (err as Error)?.message || err);
      }

      // Fallback if AI call failed, timed out, or returned invalid JSON
      if (!parsedData || !Array.isArray(parsedData.tasks) || parsedData.tasks.length === 0) {
        parsedData = extractTasksFallback(messages);
      }

      const tasksToImport = parsedData.tasks || [];
      const projectTitle = parsedData.projectTitle || parsedData.ideaSummary || 'Refined AI Project';
      const ideaSummary = parsedData.ideaSummary || 'Refined project concept with categorized tasks.';

      // Determine Target Project:
      // If currentProjectId is provided and exists -> refine tasks for that previous project!
      // If currentProjectId is NOT provided -> automatically create a BRAND-NEW project for the idea!
      let targetProject = null;
      let isNewProject = false;

      if (currentProjectId) {
        const existing = await db.getProjectById(currentProjectId);
        if (existing) {
          targetProject = existing;
          isNewProject = false;
        }
      }

      if (!targetProject) {
        const createdProj = await db.createProject({
          title: projectTitle,
          description: ideaSummary,
          category: 'AI Refined Idea',
          status: 'in-progress',
          dueDate: null,
          ownerId: authUser?.userId || 'usr-1',
        });
        targetProject = createdProj;
        isNewProject = true;
      }

      // Import extracted tasks into target project in database.
      // We iterate in reverse (Step N down to Step 1) with small millisecond delays so that
      // Step 1 receives the newest timestamp and appears at the top of the Todo list when sorted by createdAt desc.
      const createdTasks = [];
      for (let i = tasksToImport.length - 1; i >= 0; i--) {
        const t = tasksToImport[i];
        const validPriority = ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium';
        const created = await db.createTask({
          title: t.title,
          description: t.description || '',
          status: 'todo',
          priority: validPriority as 'low' | 'medium' | 'high' | 'urgent',
          projectId: targetProject.id,
          assigneeId: null,
          dueDate: null,
        });
        createdTasks.unshift(created);
        // Small delay to ensure strictly distinct timestamps for sequential sorting
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      const replyMsg = isNewProject
        ? `🚀 **New Project Created: "${targetProject.title}"**\n\nI created a new project and generated ${createdTasks.length} categorized todo tasks with priorities!`
        : `✨ **Updated Project: "${targetProject.title}"**\n\nI added ${createdTasks.length} new categorized todo tasks to your project todo list!`;

      return NextResponse.json({
        success: true,
        data: {
          reply: replyMsg,
          ideaSummary,
          project: {
            id: targetProject.id,
            title: targetProject.title,
            isNew: isNewProject,
          },
          importedCount: createdTasks.length,
          tasks: createdTasks,
        },
      });
    }

    // 1. Resolve active project context and fetch live workspace records upfront
    const userText = messages[messages.length - 1]?.content || '';
    const lowerUserText = userText.toLowerCase();

    let targetProject = null;
    if (currentProjectId) {
      targetProject = await db.getProjectById(currentProjectId);
    }
    if (!targetProject) {
      const allProjects = await db.getAllProjects({ ownerId: authUser?.userId });
      if (allProjects.length > 0) targetProject = allProjects[0];
    }

    let projectTasks: TaskRecord[] = [];
    let projectCredentials: CredentialRecord[] = [];
    let projectNotes: NoteRecord[] = [];

    if (targetProject) {
      projectTasks = await db.getAllTasks({ projectId: targetProject.id });
      projectCredentials = await db.getAllCredentials({ projectId: targetProject.id });
      projectNotes = await db.getAllNotes({ projectId: targetProject.id });
    }

    const contextPrompt = targetProject
      ? `
LIVE PROJECT WORKSPACE CONTEXT:
- Target Project ID: "${targetProject.id}"
- Title: "${targetProject.title}"
- Category: "${targetProject.category}"
- Status: "${targetProject.status}"
- Description: "${targetProject.description || 'None'}"
- Due Date: "${targetProject.dueDate || 'N/A'}"

CURRENT TASKS (${projectTasks.length}):
${projectTasks.map(t => `- Task [${t.id}] "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Details: ${t.description || 'N/A'}`).join('\n') || 'No tasks currently.'}

CREDENTIALS (${projectCredentials.length}):
${projectCredentials.map(c => `- Credential [${c.id}] "${c.title}" (${c.category}) | Fields: ${c.fields.map(f => `${f.name}: ${f.value}`).join(', ')}`).join('\n') || 'No credentials recorded.'}

NOTES (${projectNotes.length}):
${projectNotes.map(n => `- Note [${n.id}] "${n.title}" | Excerpt: ${n.excerpt}`).join('\n') || 'No notes recorded.'}
`
      : 'No active project found.';

    // Helper function to sanitize raw prompts into clean professional titles
    const cleanTitleText = (raw: string, fallback: string): string => {
      const cleaned = raw
        .replace(/^(make|create|add|write|save|record|generate)\s+(a\s+|the\s+)?(note|notes|credential|credentials|document|checklist)\s*(which|that|about|for|to|contains|cointains)?\s*/i, '')
        .replace(/^(which|that|contains|cointains|has|with)\s*/i, '')
        .trim();
      if (cleaned.length < 3 || /^(make|which|cointains|add|create)/i.test(cleaned)) {
        return fallback;
      }
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    };

    // Check Latest User Message Intent
    const isCredentialIntent = action === 'add_credential' || (
      action === 'chat' && (
        /(add|create|save|store|make|record|put|insert|keep|generate)\s+(?:a\s+|the\s+)?(?:project\s+)?(credential|credentials|api key|api_key|secret|secrets|token|tokens|password|passwords|key|keys|env var|env variable)/i.test(userText) ||
        /credential[s]?[:\s]+/i.test(userText) ||
        /api[ _]key[s]?[:\s]+/i.test(userText) ||
        /add\s+to\s+(?:project\s+)?credentials/i.test(userText)
      )
    );

    const isNoteIntent = action === 'add_note' || (
      !isCredentialIntent && action === 'chat' && (
        /(add|create|save|store|make|write|record|generate|put|insert|keep)\s+(?:a\s+|the\s+)?(?:project\s+)?(note|notes|document|documentation|requirement|requirements|checklist|spec|specs|specification|specifications)/i.test(userText) ||
        /add\s+to\s+(?:project\s+)?notes/i.test(userText) ||
        /note[s]?[:\s]+/i.test(userText)
      )
    );

    const isDeleteTaskIntent = action === 'delete_task' || (
      !isCredentialIntent && !isNoteIntent && action === 'chat' && (
        /(?:delete|remove|drop|clear|purge)\s+(?:all\s+)?(?:the\s+)?(?:task|tasks|todo|to-do|to\s+do)/i.test(userText) ||
        /(?:clear|purge)\s+(?:the\s+)?(?:todo|to-do|to\s+do)\s+list/i.test(userText) ||
        /(?:delete|remove|drop)\s+task/i.test(userText) ||
        /(?:delete|remove|drop|purge|clear)\s+["']?([^"'\n]+?)["']?/i.test(userText)
      )
    );

    const isMoveTaskIntent = action === 'move_task' || (
      !isCredentialIntent && !isNoteIntent && !isDeleteTaskIntent && action === 'chat' && (
        /(?:move|change|set|mark|update|turn)\s+(?:the\s+)?(?:status\s+of\s+)?(?:task\s+)?["']?([^"'\n]+?)["']?\s+(?:to|as)\s+(completed|done|in[- ]progress|in_progress|to[- ]do|todo)/i.test(userText) ||
        /(?:complete|finish)\s+(?:task\s+)?["']?([^"'\n]+?)["']?/i.test(userText)
      )
    );

    const isAddTaskIntent = action === 'add_task' || (
      !isCredentialIntent && !isNoteIntent && !isDeleteTaskIntent && !isMoveTaskIntent && action === 'chat' && (
        /(add|create|new|put|make|insert)\s+(?:a\s+|the\s+)?(?:single\s+)?task/i.test(userText) ||
        /add\s+(?:a\s+task\s+)?to\s+(?:the\s+)?(?:todo|to-do|to\s+do)(?:\s+list)?/i.test(userText) ||
        (/task[:\s]+/i.test(userText) && /(add|create|new|make|put)/i.test(userText)) ||
        /(?:add|create|put)\s+["']?([^"'\n]+?)["']?\s+to\s+(?:the\s+)?(?:todo|to-do|to\s+do)(?:\s+list)?/i.test(userText) ||
        /(?:make\s+changes|update)\s+(?:in|to)\s+(?:the\s+)?(?:todo|to-do|to\s+do)\s+list[:\s]*/i.test(userText) ||
        /(after|below|under|before|above)\s+["']?([^"'\n,;]+?)["']?\s+(?:put|add|create|insert|make)/i.test(userText) ||
        /(?:put|add|create|insert|make)\s+.*?\s+(after|below|under|before|above)/i.test(userText)
      )
    );

    if (isDeleteTaskIntent) {
      const isBulkDelete = /(?:delete|remove|clear|purge)\s+(?:all|everything|the\s+entire|whole)|clear\s+(?:the\s+)?(?:todo|to-do|to\s+do)|delete\s+all\s+(?:the\s+)?tasks/i.test(userText);
      const isTodoSpecific = /(?:todo|to-do|to\s+do)/i.test(userText);

      if (isBulkDelete && projectTasks.length > 0) {
        const tasksToDelete = isTodoSpecific
          ? projectTasks.filter(t => t.status === 'todo')
          : projectTasks;

        const targetList = tasksToDelete.length > 0 ? tasksToDelete : projectTasks;
        let deletedCount = 0;
        for (const t of targetList) {
          const ok = await db.deleteTask(t.id);
          if (ok) deletedCount++;
        }

        return NextResponse.json({
          success: true,
          data: {
            reply: `I deleted ${deletedCount} ${isTodoSpecific ? 'todo' : ''} task(s) from your project workspace!`,
            actionExecuted: 'delete_bulk_tasks',
            updatedType: 'task',
            deletedCount,
          },
        });
      } else if (projectTasks.length > 0) {
        const delTaskMatch = userText.match(/(?:delete|remove|drop|purge|clear)\s+(?:the\s+)?(?:task\s+)?["']?([^"'\n]+?)["']?$/i)
          || userText.match(/(?:delete|remove|drop|purge|clear)\s+["']?([^"'\n]+?)["']?/i);

        let searchTitle = userText.toLowerCase();
        if (delTaskMatch?.[1]) {
          searchTitle = delTaskMatch[1].trim().toLowerCase();
        }

        const cleanSearch = searchTitle
          .replace(/^(delete|remove|drop|purge|clear)\s+/i, '')
          .replace(/^(the\s+)?task\s+/i, '')
          .replace(/\s+(from|in)\s+(the\s+)?(todo|to-do|to\s+do|task|project)\s*(list)?$/i, '')
          .replace(/\s+(from|in)\s+(the\s+)?list$/i, '')
          .trim();

        const findTaskToDel = () => {
          if (!cleanSearch || cleanSearch.length < 2) return null;
          let match = projectTasks.find(t => {
            const tTitle = t.title.toLowerCase();
            return tTitle.includes(cleanSearch) || cleanSearch.includes(tTitle) || t.id === cleanSearch;
          });
          if (match) return match;
          const words = cleanSearch.split(/\s+/).map((w: string) => w.replace(/s$/, '')).filter((w: string) => w.length > 2);
          if (words.length > 0) {
            match = projectTasks.find(t => {
              const tLower = t.title.toLowerCase();
              return words.some((w: string) => tLower.includes(w));
            });
          }
          return match || null;
        };

        const foundTask = findTaskToDel();
        if (foundTask) {
          await db.deleteTask(foundTask.id);
          return NextResponse.json({
            success: true,
            data: {
              reply: `I deleted task **"${foundTask.title}"** from your project workspace!`,
              actionExecuted: 'delete_task',
              updatedType: 'task',
            },
          });
        }
      }
    } else if (isAddTaskIntent) {
      // AI Single Task Creation mode
      let taskTitle = 'New Project Task';
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'high';
      let relativePos: 'after' | 'before' | null = null;
      let targetTask: TaskRecord | null = null;
      let customCreatedAt: string | undefined = undefined;

      // Extract relative positioning intent (e.g. "after core features put a task which says take approval from senior")
      const relPosMatch = userText.match(/(after|below|under|before|above)\s+["']?([^"'\n,;]+?)["']?\s+(?:put|add|create|insert|make)\s+(?:a\s+|the\s+)?(?:single\s+)?task\s*(?:which|that)?\s*(?:says|is|called|named)?\s*["']?([^"'\n]+?)["']?$/i)
        || userText.match(/(?:put|add|create|insert|make)\s+(?:a\s+|the\s+)?(?:single\s+)?task\s*(?:which|that)?\s*(?:says|is|called|named)?\s*["']?([^"'\n]+?)["']?\s+(after|below|under|before|above)\s+["']?([^"'\n,;]+?)["']?$/i);

      const findTaskByFuzzy = (targetStr: string) => {
        const searchLower = targetStr.toLowerCase().trim();
        let found = projectTasks.find(t => t.title.toLowerCase().includes(searchLower) || searchLower.includes(t.title.toLowerCase()));
        if (found) return found;
        const searchWords = searchLower.split(/\s+/).map((w: string) => w.replace(/s$/, '')).filter((w: string) => w.length > 2);
        if (searchWords.length > 0) {
          found = projectTasks.find(t => {
            const tLower = t.title.toLowerCase();
            return searchWords.some((w: string) => tLower.includes(w));
          });
        }
        return found || null;
      };

      if (relPosMatch) {
        if (relPosMatch[1] && ['after', 'below', 'under', 'before', 'above'].includes(relPosMatch[1].toLowerCase())) {
          // Pattern 1: "after core features put a task which says take approval from senior"
          const kw = relPosMatch[1].toLowerCase();
          relativePos = (kw === 'before' || kw === 'above') ? 'before' : 'after';
          const targetStr = relPosMatch[2].trim();
          const titleStr = relPosMatch[3].trim();

          if (titleStr.length > 1) {
            taskTitle = titleStr
              .replace(/^(which|that)\s*(says|is|called|named)?\s*/i, '')
              .replace(/^(says|is|called|named)\s*/i, '')
              .trim();
            taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
          }
          targetTask = findTaskByFuzzy(targetStr);
        } else if (relPosMatch[2] && ['after', 'below', 'under', 'before', 'above'].includes(relPosMatch[2].toLowerCase())) {
          // Pattern 2: "put a task take approval from senior after core features"
          const titleStr = relPosMatch[1].trim();
          const kw = relPosMatch[2].toLowerCase();
          relativePos = (kw === 'before' || kw === 'above') ? 'before' : 'after';
          const targetStr = relPosMatch[3].trim();

          if (titleStr.length > 1) {
            taskTitle = titleStr
              .replace(/^(which|that)\s*(says|is|called|named)?\s*/i, '')
              .replace(/^(says|is|called|named)\s*/i, '')
              .trim();
            taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
          }
          targetTask = findTaskByFuzzy(targetStr);
        }
      }

      if (!relPosMatch) {
        const titleMatch = userText.match(/(?:task|todo|to-do)[:\s]+["']?([^"'\n]+?)["']?$/i)
          || userText.match(/(?:add|create|new|put|make|insert)\s+(?:a\s+|the\s+)?(?:single\s+)?(?:task\s+)?(?:to\s+(?:the\s+)?(?:todo|to-do|to\s+do)\s+list[:\s]*)?["']?([^"'\n]+?)["']?$/i)
          || userText.match(/(?:make\s+changes|update)\s+(?:in|to)\s+(?:the\s+)?(?:todo|to-do|to\s+do)\s+list[:\s]*["']?([^"'\n]+?)["']?$/i);

        if (titleMatch?.[1]) {
          const clean = titleMatch[1]
            .replace(/^(to\s+(the\s+)?(todo|to-do|to\s+do)\s+list[:\s]*)/i, '')
            .replace(/^(add|create|new|make|put|insert)\s+(a\s+|the\s+)?(task\s+)?/i, '')
            .replace(/^(which|that)\s*(says|is|called|named)?\s*/i, '')
            .replace(/^(says|is|called|named)\s*/i, '')
            .trim();
          if (clean.length > 2) {
            taskTitle = clean.charAt(0).toUpperCase() + clean.slice(1);
          }
        }
      }

      // If targetTask found, set custom relative timestamp
      if (targetTask && relativePos) {
        const targetTime = new Date(targetTask.createdAt).getTime();
        const offset = relativePos === 'after' ? -200 : 200;
        customCreatedAt = new Date(targetTime + offset).toISOString();
      }

      if (lowerUserText.includes('urgent')) priority = 'urgent';
      else if (lowerUserText.includes('medium')) priority = 'medium';
      else if (lowerUserText.includes('low')) priority = 'low';

      if (!targetProject) {
        targetProject = await db.createProject({
          title: 'Workspace Project',
          description: 'Default workspace project.',
          category: 'General',
          status: 'in-progress',
          dueDate: null,
          ownerId: authUser?.userId || 'usr-1',
        });
      }

      const createdTask = await db.createTask({
        title: taskTitle,
        description: 'Task added via AI Copilot assistant.',
        priority,
        status: 'todo',
        projectId: targetProject.id,
        assigneeId: null,
        dueDate: null,
        createdAt: customCreatedAt,
      });

      if (createdTask) {
        let replyMsg = `I added single ${priority.toUpperCase()} priority task **"${createdTask.title}"** to your project **"${targetProject.title}"** todo list!`;
        if (targetTask && relativePos) {
          replyMsg = `I added task **"${createdTask.title}"** directly ${relativePos.toUpperCase()} task **"${targetTask.title}"** in your project todo list!`;
        }

        return NextResponse.json({
          success: true,
          data: {
            reply: replyMsg,
            actionExecuted: 'create_task',
            updatedType: 'task',
            item: createdTask,
          },
        });
      }
    } else if (isMoveTaskIntent) {
      const moveMatch = userText.match(/(?:move|change|set|mark|update|turn)\s+(?:the\s+)?(?:status\s+of\s+)?(?:task\s+)?["']?([^"'\n]+?)["']?\s+(?:to|as)\s+(completed|done|in[- ]progress|in_progress|to[- ]do|todo)/i)
        || userText.match(/(?:complete|finish)\s+(?:task\s+)?["']?([^"'\n]+?)["']?/i);

      if (moveMatch && projectTasks.length > 0) {
        const searchTitle = moveMatch[1].trim().toLowerCase();
        let targetStatus: 'todo' | 'in-progress' | 'completed' = 'completed';
        if (moveMatch[2]) {
          const s = moveMatch[2].toLowerCase();
          if (s.includes('progress')) targetStatus = 'in-progress';
          else if (s.includes('todo') || s === 'to-do') targetStatus = 'todo';
          else targetStatus = 'completed';
        }

        const foundTask = projectTasks.find(t => t.title.toLowerCase().includes(searchTitle) || t.id === searchTitle);
        if (foundTask) {
          const updated = await db.updateTaskStatus(foundTask.id, targetStatus);
          return NextResponse.json({
            success: true,
            data: {
              reply: `I updated task **"${foundTask.title}"** status to **${targetStatus.toUpperCase()}** in your project workspace!`,
              actionExecuted: 'update_task_status',
              updatedType: 'task',
              item: updated,
            },
          });
        }
      }
    }

    if (isCredentialIntent) {
      // AI Credential Creation mode with Project Context
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an AI Security & Credential Extractor.
You have access to the user's live project workspace context below:

${contextPrompt}

USER REQUEST:
"${userText}"

INSTRUCTIONS:
1. Extract title, category, and key-value fields for the requested credential record.
2. If the user provides explicit keys/passwords (e.g. "GitHub Token = ghp_123456", "DB Password = secret"), use those exact values.
3. If the user asks for credentials for a standard service without specifying explicit keys (e.g. "put credentials of github to credentials page" or "add stripe API key"):
   - Set Title: e.g. "GitHub Integration & Repository Access" or "Stripe Payment Gateway API"
   - Set Category: 'Development' (for GitHub/GitLab), 'Payment API' (for Stripe/PayPal), 'Database & Auth' (for Supabase/Postgres), 'AI Model Service' (for NVIDIA/OpenAI), 'Cloud Infrastructure' (for AWS/Vercel), or 'Third-Party API'.
   - Generate realistic field names and clean values (e.g. "Personal Access Token (PAT)": "ghp_xxxxxxxxxxxx", "Account Username": "developer", "Repository URL": "https://github.com/org/repo").

Respond ONLY with a raw JSON object (no markdown, no extra text) matching this format:
{
  "title": "Clear Credential Title",
  "category": "Development",
  "fields": [
    { "name": "Field Name", "value": "Extracted or Generated Key/Value" }
  ]
}`,
      };

      let title = cleanTitleText(userText, 'Project Credentials & Access Keys');
      let category = 'Database & Auth';
      let fields: Array<{ name: string; value: string }> = [];

      // Extract explicit Key = Value pairs from user prompt
      const lines = userText.split(/[\n,;]+/);
      for (const line of lines) {
        const kvMatch = line.match(/^\s*([a-zA-Z0-9\s_\-\.]+)\s*[:=]\s*(.+)$/);
        if (kvMatch) {
          const keyName = kvMatch[1].trim();
          const valName = kvMatch[2].trim();
          if (!/^(add|create|save|make|note|credential)/i.test(keyName) && valName.length > 0) {
            fields.push({ name: keyName, value: valName });
          }
        }
      }

      if (lowerUserText.includes('github') || lowerUserText.includes('git')) {
        category = 'Development';
        if (fields.length === 0) {
          fields = [
            { name: 'Personal Access Token (PAT)', value: 'ghp_' + Date.now().toString(36) + 'xxxxxxxxxxxx' },
            { name: 'Account Username', value: authUser?.email ? authUser.email.split('@')[0] : 'manmeet8549' },
            { name: 'Repository URL', value: 'https://github.com/manmeet8549/Project_Management_platform' },
          ];
        }
        title = 'GitHub Integration & Repository Access';
      } else if (lowerUserText.includes('stripe') || lowerUserText.includes('payment') || lowerUserText.includes('pay')) {
        category = 'Payment API';
        if (fields.length === 0) {
          fields = [
            { name: 'Publishable Key', value: 'pk_live_' + Date.now().toString(36) },
            { name: 'Secret Key', value: 'sk_live_' + Date.now().toString(36) },
            { name: 'Webhook Secret', value: 'whsec_' + Date.now().toString(36) },
          ];
        }
        title = 'Stripe Payment Gateway API';
      } else if (lowerUserText.includes('nvidia') || lowerUserText.includes('openai') || lowerUserText.includes('ai') || lowerUserText.includes('model')) {
        category = 'AI Model Service';
        if (fields.length === 0) {
          fields = [
            { name: 'API Key', value: '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' },
            { name: 'Endpoint URL', value: 'https://integrate.api.nvidia.com/v1/chat/completions' },
            { name: 'Model Name', value: 'meta/llama-3.2-11b-vision-instruct' },
          ];
        }
        title = 'NVIDIA AI NIM Engine Credentials';
      } else if (lowerUserText.includes('aws') || lowerUserText.includes('vercel') || lowerUserText.includes('cloud') || lowerUserText.includes('deploy')) {
        category = 'Cloud Infrastructure';
        if (fields.length === 0) {
          fields = [
            { name: 'Deployment Token', value: 'vercel_tok_' + Date.now().toString(36) },
            { name: 'Production URL', value: 'https://project-management-platform.vercel.app' },
          ];
        }
        title = 'Cloud Infrastructure & Vercel Access';
      } else if (lowerUserText.includes('db') || lowerUserText.includes('database') || lowerUserText.includes('postgres') || lowerUserText.includes('supabase') || lowerUserText.includes('auth')) {
        category = 'Database & Auth';
        if (fields.length === 0) {
          fields = [
            { name: 'Database URL', value: process.env.DATABASE_URL || 'postgresql://postgres:secret@localhost:5432/postgres' },
            { name: 'JWT Secret', value: 'super_secret_jwt_key_2026' },
          ];
        }
        title = 'Supabase PostgreSQL & Auth Credentials';
      } else {
        category = 'Third-Party API';
      }

      try {
        const payload = {
          model: MODEL_NAME,
          messages: [systemMessage, ...messages],
          temperature: 0.2,
          max_tokens: 500,
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          const raw = resData.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(cleanJsonString(raw));
          if (parsed.title && !/^(make|which|cointains)/i.test(parsed.title)) title = parsed.title;
          if (parsed.category) category = parsed.category;
          if (Array.isArray(parsed.fields) && parsed.fields.length > 0) fields = parsed.fields;
        }
      } catch (err) {
        console.warn('AI Credential extraction API fallback used:', err);
      }

      if (fields.length === 0) {
        const keyMatch = userText.match(/(?:key|secret|token|password)\s*[:=]?\s*([a-zA-Z0-9_\-\.]+)/i);
        fields = [
          { name: 'API Key / Secret', value: keyMatch?.[1] || 'sk_live_' + Date.now().toString(36) }
        ];
      }

      const createdCred = await db.createCredential({
        projectId: targetProject?.id || currentProjectId || undefined,
        userId: authUser?.userId || undefined,
        title,
        category,
        categoryBg: category.includes('Auth') ? 'bg-[#DCFCE7] text-[#15803D]' : category.includes('Payment') ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F3E8FF] text-[#7C3AED]',
        addedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fields,
      });

      return NextResponse.json({
        success: true,
        data: {
          reply: `I generated and saved the **${createdCred.title}** credential record (${createdCred.fields.length} fields) to your project workspace!`,
          createdType: 'credential',
          item: createdCred,
        },
      });
    } else if (isNoteIntent) {
      // AI Note Creation mode with Live Project Context
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an AI Product Note & Documentation Generator.
You have access to the user's live project workspace context below:

${contextPrompt}

USER REQUEST:
"${userText}"

INSTRUCTIONS:
1. Analyze the user request along with the live project context (project title, description, tasks, existing notes, credentials).
2. If the user asks for a note related to the project (e.g. tech stack, architecture, deployment, task summary, system design):
   - Synthesize ACCURATE, realistic, and highly professional technical content based on the project's actual stack, framework, tasks, and requirements!
   - For a "tech stack" note: include Frontend (Next.js 15, React 19, Tailwind CSS), Backend & Database (Next.js API Routes, Supabase PostgreSQL, Prisma ORM, JWT Auth), and AI & Tools (NVIDIA AI NIM, TypeScript, SWR Caching).
3. If the user provides custom notes/text in their prompt, accurately format their content into structured notes.
4. Title: Create a clean, professional Title (3-6 words). Never use raw conversational phrases (e.g. DO NOT name a note "make a note which contains..." or "which contains...").
5. Excerpt: A 1-sentence summary excerpt.
6. Sections: Array of section objects with numbered headings (e.g. "1. Technology Stack & Frameworks") and detailed bullet point items.

Respond ONLY with a raw JSON object (no markdown formatting, no conversational intro) matching this exact format:
{
  "title": "Clean Professional Note Title",
  "excerpt": "Concise 1-sentence summary excerpt of the note.",
  "sections": [
    {
      "heading": "1. Section Heading",
      "items": [
        "Item 1",
        "Item 2"
      ]
    }
  ]
}`,
      };

      let title = cleanTitleText(userText, 'Project Architecture & Feature Notes');
      let excerpt = `Structured technical documentation generated for ${targetProject?.title || 'this project'}.`;
      let sections: Array<{ heading: string; items: string[] }> = [];

      // Topic detection for Fallback Generator
      if (lowerUserText.includes('stack') || lowerUserText.includes('tech') || lowerUserText.includes('technology') || lowerUserText.includes('framework')) {
        title = 'Project Tech Stack & Architecture Specifications';
        excerpt = `Comprehensive technical stack details including Next.js 15, React 19, Supabase, Prisma, and NVIDIA AI NIM.`;
        sections = [
          {
            heading: '1. Frontend & UI Framework',
            items: [
              'Next.js 15 App Router (React 19 Server & Client Components)',
              'Vanilla CSS & Tailwind CSS for Neobrutalist design system',
              'Lucide Icons & Framer Motion micro-animations',
            ],
          },
          {
            heading: '2. Backend & Database Architecture',
            items: [
              'Next.js API Routes with JWT Bearer Authentication',
              'Supabase PostgreSQL database with Prisma ORM client',
              'SWR LocalStorage & Memory Client-Side Caching Layer',
            ],
          },
          {
            heading: '3. AI Integration & Infrastructure',
            items: [
              'NVIDIA AI NIM (Meta Llama-3.2 11B Vision Instruct)',
              'TypeScript with strict type checking and automated Next.js builds',
            ],
          },
        ];
      } else if (lowerUserText.includes('deploy') || lowerUserText.includes('checklist') || lowerUserText.includes('launch')) {
        title = 'Production Deployment & Launch Checklist';
        excerpt = `Pre-release verification steps for deploying ${targetProject?.title || 'this project'}.`;
        sections = [
          {
            heading: '1. Environment Configuration',
            items: [
              'Verify DATABASE_URL and JWT_SECRET on Vercel hosting platform',
              'Configure NVIDIA_API_KEY environment variable for AI Copilot',
            ],
          },
          {
            heading: '2. Quality & Verification Audit',
            items: [
              'Execute npm run build to verify zero TypeScript or bundle errors',
              'Test user signup, login, and multi-tenant data isolation',
            ],
          },
        ];
      } else {
        const rawPoints = userText
          .split(/[\n;]+/)
          .map((p: string) => p.replace(/^[-*•0-9.]+\s*/, '').trim())
          .filter((p: string) => p.length > 3 && !/^(make|create|add|save|write)\s+(notes?|documents?)/i.test(p));

        sections = [
          {
            heading: '1. Key Requirements & Feature Specifications',
            items: rawPoints.length > 0 ? rawPoints : [
              `Technical requirements for ${targetProject?.title || 'project deliverables'}.`,
              'System architecture and modular component design.',
            ],
          },
        ];
      }

      try {
        const payload = {
          model: MODEL_NAME,
          messages: [systemMessage, ...messages],
          temperature: 0.3,
          max_tokens: 700,
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          const raw = resData.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(cleanJsonString(raw));
          if (parsed.title && !/^(make|which|cointains)/i.test(parsed.title)) title = parsed.title;
          if (parsed.excerpt) excerpt = parsed.excerpt;
          if (Array.isArray(parsed.sections) && parsed.sections.length > 0) sections = parsed.sections;
        }
      } catch (err) {
        console.warn('AI Note extraction API fallback used:', err);
      }

      const createdNote = await db.createNote({
        projectId: targetProject?.id || currentProjectId || undefined,
        userId: authUser?.userId || undefined,
        title,
        excerpt,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        sections,
      });

      return NextResponse.json({
        success: true,
        data: {
          reply: `I generated and saved the **${createdNote.title}** note to your project documentation!`,
          createdType: 'note',
          item: createdNote,
        },
      });
    } else {
      // Full Project Context Aware AI Chat Assistant
      // Full Project Context Aware AI Chat Assistant

      const userText = messages[messages.length - 1]?.content || '';

      // 1. Fetch live workspace data for target project
      let targetProject = null;
      if (currentProjectId) {
        targetProject = await db.getProjectById(currentProjectId);
      }
      if (!targetProject) {
        const allProjects = await db.getAllProjects({ ownerId: authUser?.userId });
        if (allProjects.length > 0) targetProject = allProjects[0];
      }

      let projectTasks: TaskRecord[] = [];
      let projectCredentials: CredentialRecord[] = [];
      let projectNotes: NoteRecord[] = [];

      if (targetProject) {
        projectTasks = await db.getAllTasks({ projectId: targetProject.id });
        projectCredentials = await db.getAllCredentials({ projectId: targetProject.id });
        projectNotes = await db.getAllNotes({ projectId: targetProject.id });
      }

      // 2. Check for explicit action modification commands in user prompt
      const lowerUser = userText.toLowerCase();

      // Action A: Task status update / move task
      const moveMatch = userText.match(/(?:move|change|set|mark|update|turn)\s+(?:task\s+)?["']?([^"'\n]+?)["']?\s+(?:to|as)\s+(completed|done|in[- ]progress|to[- ]do|todo)/i)
        || userText.match(/(?:complete|finish)\s+(?:task\s+)?["']?([^"'\n]+?)["']?/i);

      if (moveMatch && projectTasks.length > 0) {
        const searchTitle = moveMatch[1].trim().toLowerCase();
        let targetStatus: 'todo' | 'in-progress' | 'completed' = 'completed';
        if (moveMatch[2]) {
          const s = moveMatch[2].toLowerCase();
          if (s.includes('progress')) targetStatus = 'in-progress';
          else if (s.includes('todo') || s === 'to-do') targetStatus = 'todo';
          else targetStatus = 'completed';
        }

        const foundTask = projectTasks.find(t => t.title.toLowerCase().includes(searchTitle) || t.id === searchTitle);
        if (foundTask) {
          const updated = await db.updateTaskStatus(foundTask.id, targetStatus);
          return NextResponse.json({
            success: true,
            data: {
              reply: `I updated task **"${foundTask.title}"** status to **${targetStatus.toUpperCase()}** in your project workspace!`,
              actionExecuted: 'update_task_status',
              updatedType: 'task',
              item: updated,
            },
          });
        }
      }

      // Action B: Add new task to project
      const addTaskMatch = userText.match(/(?:add|create|new)\s+task[:\s]+["']?([^"'\n]+?)["']?/i);
      if (addTaskMatch && targetProject) {
        const taskTitle = addTaskMatch[1].trim();
        let prio: 'low' | 'medium' | 'high' | 'urgent' = 'high';
        if (lowerUser.includes('urgent')) prio = 'urgent';
        else if (lowerUser.includes('medium')) prio = 'medium';
        else if (lowerUser.includes('low')) prio = 'low';

        const createdTask = await db.createTask({
          title: taskTitle,
          priority: prio,
          status: 'todo',
          projectId: targetProject.id,
          description: 'Task added via AI Copilot assistant.',
          dueDate: null,
          assigneeId: null,
        });

        if (createdTask) {
          return NextResponse.json({
            success: true,
            data: {
              reply: `I added new ${prio.toUpperCase()} priority task **"${createdTask.title}"** to your **${targetProject.title}** project!`,
              actionExecuted: 'create_task',
              updatedType: 'task',
              item: createdTask,
            },
          });
        }
      }

      // Action C: Delete task from project
      const delTaskMatch = userText.match(/(?:delete|remove)\s+task[:\s]+["']?([^"'\n]+?)["']?/i);
      if (delTaskMatch && projectTasks.length > 0) {
        const searchTitle = delTaskMatch[1].trim().toLowerCase();
        const foundTask = projectTasks.find(t => t.title.toLowerCase().includes(searchTitle) || t.id === searchTitle);
        if (foundTask) {
          await db.deleteTask(foundTask.id);
          return NextResponse.json({
            success: true,
            data: {
              reply: `I deleted task **"${foundTask.title}"** from your project workspace!`,
              actionExecuted: 'delete_task',
              updatedType: 'task',
            },
          });
        }
      }

      // Action D: Update Project Details
      const updateProjMatch = userText.match(/(?:update|change|set)\s+project\s+(status|description|category)[:\s]+["']?([^"'\n]+?)["']?/i);
      if (updateProjMatch && targetProject) {
        const field = updateProjMatch[1].toLowerCase();
        const val = updateProjMatch[2].trim();
        const updateObj: Record<string, string> = {};
        if (field === 'status') {
          updateObj.status = val.includes('complete') ? 'completed' : val.includes('progress') ? 'in-progress' : 'planning';
        } else if (field === 'description') {
          updateObj.description = val;
        } else if (field === 'category') {
          updateObj.category = val;
        }

        const updatedProj = await db.updateProject(targetProject.id, updateObj);
        return NextResponse.json({
          success: true,
          data: {
            reply: `I updated project **${field}** to **"${val}"** for **"${targetProject.title}"**!`,
            actionExecuted: 'update_project',
            updatedType: 'project',
            item: updatedProj,
          },
        });
      }

      // 3. Construct Full Live Workspace Context System Message
      const contextPrompt = targetProject
        ? `
LIVE PROJECT WORKSPACE CONTEXT:
- Target Project ID: "${targetProject.id}"
- Title: "${targetProject.title}"
- Category: "${targetProject.category}"
- Status: "${targetProject.status}"
- Description: "${targetProject.description || 'None'}"
- Due Date: "${targetProject.dueDate || 'N/A'}"

CURRENT TASKS (${projectTasks.length}):
${projectTasks.map(t => `- Task [${t.id}] "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Due: ${t.dueDate || 'N/A'}`).join('\n') || 'No tasks currently.'}

CREDENTIALS (${projectCredentials.length}):
${projectCredentials.map(c => `- Credential [${c.id}] "${c.title}" (${c.category}) | Fields: ${c.fields.map(f => f.name).join(', ')}`).join('\n') || 'No credentials recorded.'}

NOTES (${projectNotes.length}):
${projectNotes.map(n => `- Note [${n.id}] "${n.title}" | Excerpt: ${n.excerpt}`).join('\n') || 'No notes recorded.'}
`
        : 'No active project found.';

      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are Developer's Assistant, an elite AI Project & Workspace Manager.
You have FULL real-time access to the user's project workspace data provided below:

${contextPrompt}

Guidelines:
1. Answer any user question about tasks, statuses, credentials, notes, progress, or metrics with 100% precision based on the live context above.
2. Be encouraging, highly concise, and helpful.
3. If the user asks to modify something (add task, move task status, delete task, add credential, add note, or update project), inform them of the exact change made!`,
      };

      const payload = {
        model: MODEL_NAME,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 800,
      };

      let aiReply = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const responseData = await response.json();
          aiReply = responseData.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.warn('NVIDIA AI Chat API timed out or failed:', (err as Error)?.message || err);
      }

      if (!aiReply) {
        aiReply = `I analyzed your project **"${targetProject?.title || 'Workspace'}"**! Currently you have ${projectTasks.length} tasks (${projectTasks.filter(t => t.status === 'completed' || t.status === 'done').length} completed, ${projectTasks.filter(t => t.status === 'in-progress').length} in progress, ${projectTasks.filter(t => t.status === 'todo').length} to do).`;
      }

      return NextResponse.json({
        success: true,
        data: {
          reply: aiReply,
          modelUsed: MODEL_NAME,
          projectContext: targetProject ? {
            id: targetProject.id,
            title: targetProject.title,
            totalTasks: projectTasks.length,
          } : undefined,
        },
      });
    }
  } catch (error: unknown) {
    console.error('Error in AI Chat API route:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
