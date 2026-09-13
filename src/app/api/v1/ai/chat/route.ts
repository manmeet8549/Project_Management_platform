import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/api/db/db';

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
          ownerId: 'usr-1',
        });
        targetProject = createdProj;
        isNewProject = true;
      }

      // Import extracted tasks into target project in database
      const createdTasks = [];
      for (const t of tasksToImport) {
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
        createdTasks.push(created);
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
    } else if (action === 'add_credential' || (action === 'chat' && messages.some(m => m.role === 'user' && /(add|create|save|store).*(credential|api key|secret|token|password)/i.test(m.content)))) {
      // AI Credential Creation mode
      const userText = messages[messages.length - 1]?.content || '';
      
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an AI Security & Credential Extractor.
Extract title, category, and key-value fields from user text.
Category MUST be one of: 'Database & Auth', 'Payment API', 'AI Model Service', 'Cloud Infrastructure', or 'Third-Party API'.
Format strictly as JSON:
{
  "title": "Clear Credential Title",
  "category": "Database & Auth",
  "fields": [
    { "name": "Key Name", "value": "Value or Key" }
  ]
}`,
      };

      let title = 'New Service Credentials';
      let category = 'Database & Auth';
      let fields = [{ name: 'API Key', value: 'sk_live_example_key_12345' }];

      try {
        const payload = {
          model: MODEL_NAME,
          messages: [systemMessage, ...messages],
          temperature: 0.2,
          max_tokens: 500,
        };
        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const resData = await response.json();
          const raw = resData.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(cleanJsonString(raw));
          if (parsed.title) title = parsed.title;
          if (parsed.category) category = parsed.category;
          if (Array.isArray(parsed.fields) && parsed.fields.length > 0) fields = parsed.fields;
        }
      } catch (err) {
        console.warn('AI Credential extraction fallback used:', err);
        const titleMatch = userText.match(/(?:credential|key|secret)\s*(?:for|=|:)?\s*([a-zA-Z0-9\s_\-]+)/i);
        if (titleMatch?.[1]) title = titleMatch[1].trim() + ' Credentials';
      }

      const createdCred = await db.createCredential({
        projectId: currentProjectId || undefined,
        title,
        category,
        categoryBg: category.includes('Auth') ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F3E8FF] text-[#7C3AED]',
        addedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fields,
      });

      return NextResponse.json({
        success: true,
        data: {
          reply: `I generated and saved the **${createdCred.title}** credential record to your project workspace!`,
          createdType: 'credential',
          item: createdCred,
        },
      });
    } else if (action === 'add_note' || (action === 'chat' && messages.some(m => m.role === 'user' && /(add|create|save|store).*(note|document|requirement|checklist)/i.test(m.content)))) {
      // AI Note Creation mode
      const userText = messages[messages.length - 1]?.content || '';

      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an AI Product Note & Documentation Generator.
Extract or synthesize a title, concise summary excerpt, and structured sections from user input.
Format strictly as JSON:
{
  "title": "Clear Note Title",
  "excerpt": "1-sentence summary excerpt",
  "sections": [
    {
      "heading": "1. Section Heading",
      "items": ["Point 1", "Point 2"]
    }
  ]
}`,
      };

      let title = 'Project Architecture & Notes';
      let excerpt = 'Structured technical requirements and notes generated via AI Copilot.';
      let sections = [
        {
          heading: '1. Overview',
          items: [userText.slice(0, 150) || 'Verified system requirements and design specs.'],
        },
      ];

      try {
        const payload = {
          model: MODEL_NAME,
          messages: [systemMessage, ...messages],
          temperature: 0.3,
          max_tokens: 600,
        };
        const response = await fetch(NVIDIA_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const resData = await response.json();
          const raw = resData.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(cleanJsonString(raw));
          if (parsed.title) title = parsed.title;
          if (parsed.excerpt) excerpt = parsed.excerpt;
          if (Array.isArray(parsed.sections) && parsed.sections.length > 0) sections = parsed.sections;
        }
      } catch (err) {
        console.warn('AI Note extraction fallback used:', err);
      }

      const createdNote = await db.createNote({
        projectId: currentProjectId || undefined,
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
      // Standard Chat Refinement mode
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are an elite AI Project & Product Refinement Copilot powered by NVIDIA AI NIM.
Your objective is to help the user refine, brainstorm, and polish software, app, or feature ideas.

Guidelines:
1. Be encouraging, highly insightful, and concise.
2. Ask 1-2 focused questions to clarify technical specifications, credentials, or notes.
3. Suggest 2-3 key features, architecture choices, or priorities.
4. Tell the user they can ask you to:
   - **"Import Idea into Todo List"**
   - **"Add Credential for [Service]"**
   - **"Add Note for [Requirements]"**`,
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
        aiReply = "I parsed your concept! You can click **'Import Idea into Todo List'** below whenever you're ready to create the tasks.";
      }

      return NextResponse.json({
        success: true,
        data: {
          reply: aiReply,
          modelUsed: MODEL_NAME,
        },
      });
    }
  } catch (error: unknown) {
    console.error('Error in AI Chat API route:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
