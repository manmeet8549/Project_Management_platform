# 🚀 Project Management Platform — Complete Technical Architecture & System Documentation

A comprehensive, production-grade manual detailing the architecture, design decisions, feature breakdown, database schemas, multi-tenant isolation, caching, local-first optimistic UI with offline mutation queue, and deployment guide for the **Project Management Platform**.

---

## 📑 Table of Contents
1. [Executive Overview & Core Objectives](#1-executive-overview--core-objectives)
2. [High-Level Architecture & Tech Stack](#2-high-level-architecture--tech-stack)
3. [Database & Data Isolation (Multi-Tenancy)](#3-database--data-isolation-multi-tenancy)
4. [Client-Side Architecture: Instant UX & Local-First System](#4-client-side-architecture-instant-ux--local-first-system)
   - 4.1. [Tiered Caching Mechanism (`clientCache.ts`)](#41-tiered-caching-mechanism-clientcachets)
   - 4.2. [FIFO Mutation Queue & Resilient Sync (`mutationQueue.ts`)](#42-fifo-mutation-queue--resilient-sync-mutationqueuets)
   - 4.3. [Conflict Avoidance, Merging & Revalidation](#43-conflict-avoidance-merging--revalidation)
5. [Core Features & Modules](#5-core-features--modules)
   - 5.1. [User Authentication & Multi-Tenant Session Management](#51-user-authentication--multi-tenant-session-management)
   - 5.2. [Dashboard & Project Management](#52-dashboard--project-management)
   - 5.3. [Kanban Task Board (Drag-and-Drop & Zero-Flicker Moves)](#53-kanban-task-board-drag-and-drop--zero-flicker-moves)
   - 5.4. [AI Copilot & Developer's Assistant Engine](#54-ai-copilot--developers-assistant-engine)
   - 5.5. [Credentials & Vault Management](#55-credentials--vault-management)
   - 5.6. [Project Notes & Knowledge Hub](#56-project-notes--knowledge-hub)
6. [API Architecture & Backend Middleware](#6-api-architecture--backend-middleware)
7. [Vercel & Supabase Deployment Guide](#7-vercel--supabase-deployment-guide)
8. [Directory Structure Reference](#8-directory-structure-reference)

---

## 1. Executive Overview & Core Objectives

The **Project Management Platform** is a high-performance, full-stack collaborative workspace designed to organize projects, tasks, secure credentials, and markdown notes.

### Key Engineering Guarantees
1. **Zero-Latency UI (0ms Optimistic Updates)**: When users move tasks across Kanban columns, create todos, or edit content, UI state changes are instant without waiting for network roundtrips.
2. **Zero-Flicker / Zero-Stutter**: No visual jumps or unwanted rollbacks when moving cards. Background sync occurs invisibly.
3. **Local-First & Offline Tolerance**: Changes are persisted to the user's browser `localStorage` first. If offline or facing intermittent connectivity, mutations wait safely in an indexed FIFO queue and flush sequentially upon reconnection.
4. **Strict Multi-Tenant Isolation**: Complete isolation of Projects, Tasks, Credentials, and Notes between users. Queries enforce compound ownership checks (`userId` + `projectId`).
5. **Cold-Start Elimination via Tiered Caching**: Pages instantly hydrate from client-side memory/storage cache on reload while background workers silently validate database consistency.

```mermaid
graph TD
    User([User Action / Drag Task]) --> InstantState[React State Update: 0ms]
    InstantState --> CacheUpdate[Update LocalStorage Cache]
    InstantState --> Enqueue[Enqueue to FIFO Mutation Queue]
    
    subgraph Browser Storage
        CacheUpdate --> LocalStore[(User Cache: pm_cache_...)]
        Enqueue --> QueueStore[(Persistent Queue: pm_task_mutation_queue_...)]
    end
    
    QueueStore --> Worker[Background Sequential Sync Worker]
    Worker --> API[REST API /api/v1/tasks]
    API --> Middleware[Auth & Multi-Tenant Verification]
    Middleware --> Supabase[(Supabase PostgreSQL Pooler)]
```

---

## 2. High-Level Architecture & Tech Stack

| Layer | Technology | Key Details & Responsibilities |
|---|---|---|
| **Framework** | Next.js 15 (App Router) + React 19 | Server Components, Client Hooks, Force-Dynamic API Routes |
| **Language** | TypeScript | Strict type safety for data models, API contracts, and queue payloads |
| **Styling & UI** | Tailwind CSS + Lucide Icons + Framer Motion | Modern dark/light responsive interface, glassmorphism, fluid micro-interactions |
| **Database** | PostgreSQL via Supabase | Managed cloud database with Connection Pooler (`aws-0-ap-northeast-1.pooler.supabase.com`) |
| **ORM** | Prisma 5.22 | Typed data queries, schema migrations, and relation enforcement (`binaryTargets: native, rhel-openssl-3.0.x`) |
| **Auth & Security** | JWT (JSON Web Tokens) + bcrypt | Stateless bearer tokens with payload validation, password hashing, user-scoped access control |
| **Client Storage** | `localStorage` + Memory Store | Scoped cache keys per user ID + resilient queue serialization |

---

## 3. Database & Data Isolation (Multi-Tenancy)

### 3.1. Entity Relationship Diagram (Prisma Schema)

```mermaid
erDiagram
    User ||--o{ Project : "owns"
    User ||--o{ Task : "creates"
    User ||--o{ Credential : "owns"
    User ||--o{ Note : "creates"
    
    Project ||--o{ Task : "contains"
    Project ||--o{ Credential : "contains"
    Project ||--o{ Note : "contains"

    User {
        string id PK
        string email UK
        string name
        string password
        datetime createdAt
    }

    Project {
        string id PK
        string name
        string description
        string userId FK
        datetime createdAt
    }

    Task {
        string id PK
        string title
        string description
        string status
        string priority
        string projectId FK
        string userId FK
        int order
        datetime dueDate
    }

    Credential {
        string id PK
        string title
        string username
        string password
        string url
        string notes
        string projectId FK
        string userId FK
    }

    Note {
        string id PK
        string title
        string content
        string category
        string projectId FK
        string userId FK
    }
```

### 3.2. Data Isolation Guarantees

Every database query enforces tenant boundaries:
1. **Relational Constraints**: Every child model (`Task`, `Credential`, `Note`, `Project`) directly references `userId`.
2. **Compound Filtering**:
   ```typescript
   // Example: Securing note retrieval
   const notes = await prisma.note.findMany({
     where: {
       projectId: requestedProjectId,
       userId: authenticatedUserId, // Prevents cross-tenant access even if projectId is known
     },
     orderBy: { updatedAt: 'desc' },
   });
   ```
3. **Cascading Deletes**: When a `User` or `Project` is deleted, all dependent tasks, credentials, and notes are automatically purged by PostgreSQL.

---

## 4. Client-Side Architecture: Instant UX & Local-First System

To solve network latency, UI stuttering, and stale data, the application uses a **hybrid client-caching and sequential FIFO mutation architecture**.

```
[ User Interaction ]
       │
       ▼
 1. Immediate React State Update (0ms)
       │
       ├────────────────────────────────────────┐
       ▼                                        ▼
 2. Local Cache Update                 3. FIFO Mutation Queue
    (pm_cache_<uid>_tasks_<pid>)          (pm_task_mutation_queue_<uid>)
       │                                        │
       │                                        ▼
       │                               4. Sequential Background Sync
       │                                  - Exponential backoff retry
       │                                  - Online/offline auto-flush
       │                                  - Replaces temp ID with server ID
       ▼                                        │
 5. Background Revalidation                    ▼
    (Deep Diff -> Merge State) ◄───────── 5. Database Updated
```

---

### 4.1. Tiered Caching Mechanism (`src/lib/client/clientCache.ts`)

The client cache operates in two tiers:
1. **In-Memory Cache (RAM)**: Sub-millisecond instant reads during active session transitions.
2. **Persistent Browser Cache (`localStorage`)**: Persists state across tab refreshes and browser restarts.

#### Cache Keys (User-Scoped)
To prevent account data leakage on shared computers:
- `pm_cache_<userId>_projects_list`
- `pm_cache_<userId>_project_<projectId>`
- `pm_cache_<userId>_tasks_<projectId>`
- `pm_cache_<userId>_credentials_<projectId>`
- `pm_cache_<userId>_notes_<projectId>`

#### Key Functions in `clientCache.ts`
- `getCachedData<T>(key, maxAgeMs)`: Retrieves valid cached data, falling back to disk if memory is empty.
- `setCachedData<T>(key, data)`: Writes synchronously to memory and `localStorage`.
- `updateTaskInCache(projectId, taskId, updates)`: Updates a single task within the cached array in place.
- `addTaskToCache(projectId, newTask)`: Prepends or appends a newly created task.
- `deleteTaskFromCache(projectId, taskId)`: Filters out the task locally.
- `replaceTaskIdInCache(projectId, tempId, realId)`: Atomically swaps client temporary IDs (e.g. `temp-1718000000`) with UUIDs generated by the server.

---

### 4.2. FIFO Mutation Queue & Resilient Sync (`src/lib/client/mutationQueue.ts`)

To avoid race conditions and database locks when users rapidly move multiple cards between columns, all write actions are processed through a **Singleton Sequential FIFO Queue**.

#### Mutation Types Supported:
- `MOVE_TASK`: Updates status, order, and column position.
- `CREATE_TASK`: Optimistically adds a task with a temporary ID.
- `UPDATE_TASK`: Modifies title, priority, description, or due date.
- `DELETE_TASK`: Removes a task.

#### Queue Resilience Features:
1. **Disk Persistence**: Stored in `localStorage` under `pm_task_mutation_queue_<userId>`. If the user closes their browser mid-operation, remaining tasks resume on the next visit.
2. **Offline Detection**: Listens to browser `window.addEventListener('online', ...)` events to immediately trigger flushing.
3. **Sequential Execution**: Strict `await` on each item guarantees operations complete in the exact chronological order executed by the user.
4. **Retry Mechanism**: Transient network failures trigger exponential backoff without dropping user operations.

```typescript
// Core sync execution loop in TaskMutationQueue
private async processNext(): Promise<void> {
  if (this.isProcessing || this.queue.length === 0) return;
  this.isProcessing = true;

  const mutation = this.queue[0];
  try {
    const res = await this.executeMutation(mutation);
    // Success: dequeue and persist updated queue
    this.queue.shift();
    this.saveQueue();
    this.notifyListeners();
  } catch (err) {
    // Retry with backoff or hold queue if offline
    console.error('Mutation sync failed, will retry:', err);
  } finally {
    this.isProcessing = false;
    if (this.queue.length > 0) this.processNext();
  }
}
```

---

### 4.3. Conflict Avoidance, Merging & Revalidation

When a page is loaded or refreshed:
1. **Step 1 (Instant Display)**: The page renders immediately using `getCachedData()`. No skeleton spinners or loading screens block the user.
2. **Step 2 (Apply Pending Mutations)**: The client checks if any un-synced operations exist in `taskMutationQueue` and overlays them on top of cached data using `applyPendingMutations(cachedTasks)`.
3. **Step 3 (Silent Background Fetch)**: An API call fetches the canonical list from PostgreSQL.
4. **Step 4 (Deep Diffing via `areTaskListsEqual`)**:
   - The received server data is compared against current UI state.
   - If server data is identical (or differences are solely due to pending in-flight mutations), **no React state re-render occurs**, completely eliminating visual stutter.
   - If legitimate external changes occurred, state updates cleanly.

---

## 5. Core Features & Modules

### 5.1. User Authentication & Session Management
- **Token Format**: Standard Bearer JWT stored securely in browser `localStorage` (`token`).
- **User Object**: User profile (`id`, `name`, `email`) stored in `user` key.
- **Route Protection**: Next.js client-side check redirects unauthenticated visitors to `/login`.
- **Automatic Logout & Token Refresh**: 401 responses automatically clear invalid tokens and redirect to login.

---

### 5.2. Dashboard & Project Management
- **Project Grid**: Real-time project overview displaying title, description, task counts, and completion percentages.
- **Project Creation**: Modal dialog for creating projects with custom metadata.
- **Project Stats**: Aggregated metrics on active tasks, completed tasks, overdue items, and stored credentials.

---

### 5.3. Kanban Task Board
- **Columns Supported**: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- **Drag-and-Drop**: Built using smooth drag-and-drop primitives with instant visual drop indicators.
- **Quick Create**: Add tasks inline with title, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and due dates.
- **Filtering & Search**: Real-time client-side search by task title, description, or priority tag.

```
+-------------------+-------------------+-------------------+-------------------+
|      TO DO        |    IN PROGRESS    |      REVIEW       |       DONE        |
+-------------------+-------------------+-------------------+-------------------+
| [Task A - High]   | [Task C - Urgent] | [Task E - Low]    | [Task F - Medium] |
| [Task B - Med]    | [Task D - Med]    |                   |                   |
+-------------------+-------------------+-------------------+-------------------+
```

---

### 5.4. AI Copilot & Developer's Assistant Engine (`src/components/ai/AiCopilotWindow.tsx` & `/api/v1/ai/chat`)

The platform integrates an autonomous AI Technical Product Manager powered by **NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`)** with a resilient fallback parser.

#### Key Capabilities & Workflows:
1. **Idea-to-Project Extraction (`convert_to_tasks`)**:
   - Analyzes rough developer prompts (e.g. *"Build a lead scraper bot that exports to Excel and sends files via Telegram"*).
   - Extracts a concise project title, generates an idea summary, and decomposes the goal into **3 to 6 actionable, priority-categorized tasks** (`urgent`, `high`, `medium`, `low`).
   - Automatically provisions a new Project in the database (or appends to current project) and creates all tasks with millisecond-sequenced timestamps.
2. **Context-Aware Workspace Actions (Chat Actions)**:
   - **Automated Task Creation & Placement**: Understands relative positioning (e.g., *"After core features, add a high-priority task to get senior approval"*).
   - **Natural Language Task Management**: Move tasks between columns or bulk purge tasks (e.g., *"Mark task DB Schema as completed"*, *"Clear the entire todo list"*).
   - **Automated Credential Generation**: Extracts or mocks service API keys, database URLs, and access tokens, saving them directly to the Vault.
   - **Technical Documentation & Notes**: Generates structured technical notes (e.g., architecture, tech stack breakdown, deployment checklists) from conversational prompts.
3. **Live Workspace Context Injection**:
   - The AI route dynamically injects active project metadata, existing tasks, credentials, and notes into the system prompt to avoid hallucinations and ensure context-aware responses.

---

### 5.5. Credentials & Vault Management
- **Purpose**: Encrypted storage for API keys, server logins, staging credentials, and environment configs tied to a project.
- **Masking & Copying**: Passwords and secrets are masked with asterisks (`••••••••`) by default with one-click "Show/Hide" and "Copy to Clipboard" buttons.
- **Tenant Protection**: Scoped strictly to the authenticated owner's `userId` and active `projectId`.

---

### 5.6. Project Notes & Knowledge Hub
- **Rich Markdown Support**: Full markdown formatting for technical documentation, sprint plans, and architecture notes.
- **Categorization**: Tag notes by category (e.g. `Architecture`, `Meeting Notes`, `Setup Guide`).
- **Instant Search**: Substring filtering across title and content.

---

## 6. API Architecture & Backend Middleware

All REST endpoints reside in `src/app/api/v1/*` and export `export const dynamic = 'force-dynamic'` to prevent unwanted serverless caching.

### 6.1. Authentication Middleware (`src/lib/api/middleware/middleware.ts`)
```typescript
export async function authenticateRequest(req: NextRequest): Promise<{ userId: string; user: any }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized: Missing or invalid token format');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwtToken(token); // Verified against process.env.JWT_SECRET
  return { userId: payload.id, user: payload };
}
```

### 6.2. REST API Routes Summary

| Endpoint | Method | Description | Ownership Check |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | Register a new user account | Unique email validation |
| `/api/v1/auth/login` | `POST` | Authenticate and return signed JWT token | Password verify |
| `/api/v1/ai/chat` | `POST` | AI Copilot Chat, Idea Extraction, Task/Note/Credential Generator | User context & project scoping |
| `/api/v1/projects` | `GET` | Fetch all projects belonging to user | `WHERE userId = auth.id` |
| `/api/v1/projects` | `POST` | Create a new project | Associates `userId = auth.id` |
| `/api/v1/projects/:id` | `GET` | Fetch project details + aggregated tasks | `WHERE id = :id AND userId = auth.id` |
| `/api/v1/projects/:id` | `PUT` | Update project metadata | `WHERE id = :id AND userId = auth.id` |
| `/api/v1/projects/:id` | `DELETE`| Delete project and cascade all child items | `WHERE id = :id AND userId = auth.id` |
| `/api/v1/tasks` | `GET` | Fetch all tasks for a project | `WHERE projectId = :pId AND userId = auth.id` |
| `/api/v1/tasks` | `POST` | Create a task | Scoped to project and user |
| `/api/v1/tasks/:id` | `PUT` | Update task status, order, or details | Ownership verified |
| `/api/v1/tasks/:id` | `DELETE`| Delete task | Ownership verified |
| `/api/v1/credentials` | `GET/POST`| List/Create project credentials | Scoped to project and user |
| `/api/v1/credentials/:id` | `PUT/DELETE`| Modify/Remove credentials | Ownership verified |
| `/api/v1/notes` | `GET/POST`| List/Create project notes | Scoped to project and user |
| `/api/v1/notes/:id` | `PUT/DELETE`| Modify/Remove notes | Ownership verified |

---

## 7. Vercel & Supabase Deployment Guide

### 7.1. Database Configuration (Supabase Pooler)

Vercel serverless functions run in AWS IPv4-only environments. Supabase's direct endpoint (`db.ceicslawfqwpuzwdkvor.supabase.co`) is IPv6-only. Therefore, the application uses **Supabase Connection Pooler** (Supavisor) host `aws-0-ap-northeast-1.pooler.supabase.com`.

#### Environment Variables for Vercel:

```env
# Transaction Connection Pooler (Port 6543) - For standard Prisma queries
DATABASE_URL="postgresql://postgres.ceicslawfqwpuzwdkvor:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15"

# Direct Session Connection Pooler (Port 5432) - For Prisma schema migrations
DIRECT_URL="postgresql://postgres.ceicslawfqwpuzwdkvor:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# JWT Secret Key for token generation and validation
JWT_SECRET="your-secure-random-32-byte-hex-string-or-secret"

# Node Environment
NODE_ENV="production"
```

### 7.2. Generating a Secure `JWT_SECRET`
You can generate a secure 256-bit random string via Node.js or OpenSSL:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7.3. Build Configuration (`package.json`)
The build process generates Prisma Client artifacts for both local architectures and Vercel's Amazon Linux runtime (`rhel-openssl-3.0.x`):
```json
"scripts": {
  "postinstall": "prisma generate",
  "build": "prisma generate && next build"
}
```

---

## 8. Directory Structure Reference

```
project_management/
├── prisma/
│   └── schema.prisma              # PostgreSQL database schema & Prisma config
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/v1/                # Force-dynamic REST APIs
│   │   │   ├── auth/              # Login & register endpoints
│   │   │   ├── credentials/       # Project credential endpoints
│   │   │   ├── notes/             # Markdown notes endpoints
│   │   │   ├── projects/          # Project CRUD endpoints
│   │   │   └── tasks/             # Task CRUD & reorder endpoints
│   │   ├── dashboard/             # Main user dashboard
│   │   ├── login/                 # Login page
│   │   ├── register/              # Register page
│   │   ├── projects/[id]/         # Project detail (Kanban, Notes, Credentials)
│   │   ├── layout.tsx             # Root app layout
│   │   └── page.tsx               # Landing page
│   ├── components/                # Reusable UI components
│   │   ├── kanban/                # Task boards, cards, modals
│   │   ├── landing/               # Hero, features, testimonials, CTA
│   │   ├── credentials/           # Secure credential vault UI
│   │   └── notes/                 # Markdown editor and note views
│   ├── lib/                       # Core system logic
│   │   ├── api/                   # Server-side utilities
│   │   │   ├── db/db.ts           # Prisma database client singleton
│   │   │   ├── middleware/        # JWT auth verification
│   │   │   └── utils/             # Error handlers and response formatters
│   │   └── client/                # Client-side performance engine
│   │       ├── clientCache.ts     # User-scoped in-memory & localStorage cache
│   │       └── mutationQueue.ts   # Resilient FIFO optimistic mutation queue
├── .env                           # Local environment variables
├── package.json                   # Dependencies & build scripts
├── tailwind.config.js             # Tailwind CSS theme configuration
└── tsconfig.json                  # TypeScript compiler settings
```

---

*Documentation maintained and generated for the Project Management Platform.*
