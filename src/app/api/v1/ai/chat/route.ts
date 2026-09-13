import { NextRequest, NextResponse } from 'next/server';
import { db, TaskRecord, CredentialRecord, NoteRecord } from '@/lib/api/db/db';
import { getAuthUserOptional } from '@/lib/api/middleware/middleware';

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

  let projectTitle = 'Refined Idea Project';
  if (userTexts.length > 0) {
    const rawMsg = userTexts[userTexts.length - 1] || userTexts[0];
    const cleaned = rawMsg
      .replace(/^I have an idea:?\s*/i, '')
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

  const tasks: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent' }> = [
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

    if (action === 'convert_to_tasks') {
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
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        console.warn('AI Task Extraction API call failed or timed out, falling back to local extractor:', err);
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

      return NextResponse.json({
        success: true,
        data: {
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

    // Resolve active project context for note/credential creation or general workspace chat
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

    if (isCredentialIntent) {
      // AI Credential Creation mode
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an AI Security & Credential Extractor.
Extract title, category, and key-value fields from the user input.
Category MUST be one of: 'Database & Auth', 'Payment API', 'AI Model Service', 'Cloud Infrastructure', 'Third-Party API', 'Backend', or 'Development'.
You MUST respond ONLY with a raw JSON object (no markdown, no conversation) in this format:
{
  "title": "Clear Credential Title",
  "category": "Database & Auth",
  "fields": [
    { "name": "Field Name", "value": "Extracted Key or Secret" }
  ]
}`,
      };

      let title = 'Project Credentials & API Keys';
      let category = 'Database & Auth';
      let fields: Array<{ name: string; value: string }> = [];

      // Smart local parsing helper to extract Key = Value patterns from prompt
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

      if (lowerUserText.includes('stripe') || lowerUserText.includes('payment') || lowerUserText.includes('pay')) {
        category = 'Payment API';
      } else if (lowerUserText.includes('nvidia') || lowerUserText.includes('openai') || lowerUserText.includes('ai') || lowerUserText.includes('model')) {
        category = 'AI Model Service';
      } else if (lowerUserText.includes('aws') || lowerUserText.includes('vercel') || lowerUserText.includes('cloud') || lowerUserText.includes('deploy')) {
        category = 'Cloud Infrastructure';
      } else if (lowerUserText.includes('db') || lowerUserText.includes('database') || lowerUserText.includes('postgres') || lowerUserText.includes('supabase') || lowerUserText.includes('auth')) {
        category = 'Database & Auth';
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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          if (parsed.title) title = parsed.title;
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

      const titleMatch = userText.match(/(?:credential|key|secret|for)\s*(?:for|=|:)?\s*([a-zA-Z0-9\s_\-]+)/i);
      if (titleMatch?.[1] && title === 'Project Credentials & API Keys') {
        const cleanTitle = titleMatch[1].replace(/^(a|the|my|new)\s+/i, '').trim();
        if (cleanTitle.length > 2) title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) + ' Credentials';
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
      // AI Note Creation mode
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an AI Product Note & Documentation Generator.
Extract and synthesize a clear title, a concise 1-sentence excerpt summary, and structured sections (with numbered headings and list items) from user input.
You MUST respond ONLY with a raw JSON object (no markdown, no conversational text) in this format:
{
  "title": "Clear Note Title",
  "excerpt": "Concise 1-sentence summary excerpt",
  "sections": [
    {
      "heading": "1. Key Specifications & Requirements",
      "items": ["Point 1", "Point 2"]
    }
  ]
}`,
      };

      let title = 'Project Requirements & Notes';
      let excerpt = userText.slice(0, 120) || 'Technical specifications and architectural notes.';
      
      // Local fallback section parsing
      const rawPoints = userText
        .split(/[\n;]+/)
        .map((p: string) => p.replace(/^[-*•0-9.]+\s*/, '').trim())
        .filter((p: string) => p.length > 3 && !/^(make|create|add|save|write)\s+(notes?|documents?)/i.test(p));

      let sections = [
        {
          heading: '1. Architecture & Feature Notes',
          items: rawPoints.length > 0 ? rawPoints : [userText.slice(0, 150) || 'Verified system requirements and design specs.'],
        },
      ];

      try {
        const payload = {
          model: MODEL_NAME,
          messages: [systemMessage, ...messages],
          temperature: 0.3,
          max_tokens: 600,
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          if (parsed.title) title = parsed.title;
          if (parsed.excerpt) excerpt = parsed.excerpt;
          if (Array.isArray(parsed.sections) && parsed.sections.length > 0) sections = parsed.sections;
        }
      } catch (err) {
        console.warn('AI Note extraction API fallback used:', err);
      }

      const noteTitleMatch = userText.match(/(?:note|notes|about|for)[:\s]+["']?([^"'\n]+?)["']?$/i);
      if (noteTitleMatch?.[1] && title === 'Project Requirements & Notes') {
        const cleanT = noteTitleMatch[1].replace(/^(a|the|my|new)\s+/i, '').trim();
        if (cleanT.length > 3) title = cleanT.charAt(0).toUpperCase() + cleanT.slice(1);
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
        content: `You are an elite AI Project & Workspace Manager powered by NVIDIA AI NIM.
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

      let aiReply = "I'm having trouble connecting to AI engine right now. Please try again.";

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
          aiReply = responseData.choices?.[0]?.message?.content || aiReply;
        }
      } catch (err) {
        console.warn('NVIDIA AI Chat API failed or timed out:', err);
        aiReply = `I analyzed your project **"${targetProject?.title || 'Workspace'}"**! Currently you have ${projectTasks.length} tasks (${projectTasks.filter(t => t.status === 'completed' || t.status === 'done').length} completed, ${projectTasks.filter(t => t.status === 'in-progress').length} in progress).`;
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
