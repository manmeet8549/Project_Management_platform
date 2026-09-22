<div align="center">

# ⚡ Project Management Platform
### *The High-Performance, Local-First Collaborative Workspace for Modern Engineering Teams*

[![Next.js](https://img.shields.io/badge/Next.js-15.5_(App_Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

**Zero-Latency Drag & Drop Kanban** • **Local-First FIFO Mutation Queue** • **AI Copilot & Idea Extractor** • **Multi-Tenant Data Isolation** • **Encrypted Project Vault** • **Structured Technical Notes**

<br />

[Explore Features](#-key-features) • [System Architecture](#-system-architecture--local-first-engine) • [AI Copilot](#-ai-copilot--developer-assistant) • [Database Design](#-database-schema--multi-tenancy) • [Getting Started](#-getting-started) • [Deployment](#-deployment-guide)

---

</div>

<br />

## 🌟 Highlights & Engineering Philosophy

Most project management tools feel sluggish because every action is blocked by server roundtrips, database locks, and heavy hydration waterfalls. This platform was engineered from first principles with **three non-negotiable rules**:

1. ⚡ **0ms Perceived Latency (Optimistic UI)**: Moving tasks between Kanban columns, creating notes, or editing credentials updates state instantaneously without UI freezing or micro-stutters.
2. 🔄 **Resilient Local-First Synchronization**: Changes are written to the browser's persistent cache first. A background **sequential FIFO Mutation Queue** processes writes to PostgreSQL with exponential backoff and automatic offline recovery.
3. 🔒 **Zero-Leakage Multi-Tenancy**: Complete tenant isolation across Projects, Kanban Boards, Credentials, and Notes. Every database query enforces compound ownership checks (`userId` + `projectId`).

---

## 🚀 Key Features

### 📋 Interactive Kanban Board
- **Smooth Drag-and-Drop**: Zero-flicker column transitions across `To Do`, `In Progress`, and `Completed`.
- **Intelligent Sorting & Priorities**: Tasks tagged with dynamic color-coded badges (`Urgent`, `High`, `Medium`, `Low`).
- **Instant Search & Filtering**: Real-time client-side substring matching on titles, descriptions, and metadata.

### 🤖 AI Copilot & Developer's Assistant
- **Idea-to-Project Extraction**: Type a rough concept (e.g. *"Build a lead scraper bot with Telegram alerts"*), and the AI will create a project and generate **3–6 actionable, prioritized tasks** with millisecond timestamp sequencing.
- **Context-Aware Workspace Actions**: Natural language commands to move tasks, add credentials, generate architecture notes, or bulk purge tasks.
- **NVIDIA NIM Integration**: Powered by `meta/llama-3.2-11b-vision-instruct` with an offline fallback parser.

### 🔐 Secure Project Credentials Vault
- **Encrypted Storage**: Isolated vault for API keys, database URLs, deployment tokens, and server secrets.
- **Default Masking & One-Click Copy**: Passwords remain masked (`••••••••`) by default with toggleable visibility and quick clipboard actions.

### 📝 Structured Project Notes & Knowledge Hub
- **Interactive Note Modal**: Rich popup interface supporting multi-section documentation with dynamic bullet points.
- **Project Specifications**: Perfect for architecture plans, deployment checklists, and meeting summaries.

### 📊 Real-Time Analytics & Dashboard
- **Progress Tracking**: Automatic completion percentage calculation, overdue warnings, and active task distributions.
- **Global Project Overview**: Grid view showing health and status across all user projects.

---

## 🏗 System Architecture & Local-First Engine

The application employs a **hybrid client-caching and optimistic mutation queue pipeline** that completely eliminates loading spinners on page switches and network stalls.

```mermaid
graph TD
    User([User Action / Drag Task / Edit Note]) --> ReactState[React State: 0ms Update]
    ReactState --> Cache[User LocalStorage Cache: pm_cache_...]
    ReactState --> Queue[Persistent FIFO Queue: pm_task_mutation_queue_...]
    
    subgraph Browser Storage Engine
        Cache
        Queue
    end
    
    Queue --> Worker[Background Sequential Sync Worker]
    Worker --> API[Next.js Dynamic REST API]
    API --> Auth[JWT & Tenant Ownership Middleware]
    Auth --> DB[(Supabase PostgreSQL Pooler)]
```

### 🧠 How the Local-First Queue Works

1. **User Action**: When a card is moved or created, the UI immediately updates (0ms).
2. **Double Persistence**:
   - The user-scoped client cache (`pm_cache_<userId>_*`) is updated in place.
   - The mutation is appended to `pm_task_mutation_queue_<userId>`.
3. **Sequential Sync Loop**:
   - The background worker takes item `0`, sends it to `/api/v1/tasks`, and awaits confirmation.
   - If the request succeeds, it shifts the item and proceeds to the next.
   - If network drops, the queue pauses and safely waits for the browser `online` event before auto-resuming.
4. **Smart Diffing (`areTaskListsEqual`)**: When SWR background validation completes, server data is diffed against local state. If no real server differences exist, no React re-render is triggered, preventing UI jitter.

---

## 🤖 AI Copilot & Developer Assistant

The embedded AI Copilot acts as a technical product manager living inside your workspace.

```
[ User Prompt ] ──► "Make a todo list for building a real-time chat app"
                         │
                         ▼
        [ NVIDIA NIM Llama 3.2 Vision / Instruct ]
                         │
                         ▼
               [ Structured JSON Schema ]
                         │
    ┌────────────────────┴────────────────────┐
    ▼                                         ▼
[ New Project Created ]              [ 5 Actionable Tasks ]
"Real-Time Chat App"                 1. Setup WebSocket server (Urgent)
                                     2. Design PostgreSQL schema (High)
                                     3. Implement JWT auth (High)
                                     4. Build React chat UI (Medium)
                                     5. Deploy with Docker (Low)
```

| Action | Example Command | What It Does |
|---|---|---|
| **Idea Extraction** | *"I want to build a SaaS billing portal"* | Creates project + extracts categorized tasks with priorities |
| **Task Placement** | *"After database setup, add a task for unit tests"* | Places new task relative to existing items |
| **Credential Gen** | *"Add Supabase credentials to vault"* | Extracts/generates realistic keys and saves to Vault |
| **Documentation** | *"Create a note on system architecture"* | Synthesizes formatted technical documentation sections |

---

## 🗄 Database Schema & Multi-Tenancy

Every database table strictly references `userId` and `projectId` with PostgreSQL cascading deletes:

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
    }
    Project {
        string id PK
        string title
        string description
        string userId FK
    }
    Task {
        string id PK
        string title
        string status
        string priority
        string projectId FK
        string userId FK
    }
    Credential {
        string id PK
        string title
        string category
        json fields
        string projectId FK
        string userId FK
    }
    Note {
        string id PK
        string title
        string excerpt
        json sections
        string projectId FK
        string userId FK
    }
```

---

## 💻 Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Core Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server/Client Components, Edge-ready routing |
| **UI Library** | [React 19](https://react.dev/) | Concurrent rendering, modern hooks |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Neo-brutalist aesthetic with responsive dark/light styling |
| **Icons & Motion** | [Lucide React](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) | Micro-interactions and animated modals |
| **ORM & Database** | [Prisma 5](https://www.prisma.io/) + [PostgreSQL](https://supabase.com/) | Type-safe queries, migration control, connection pooling |
| **Authentication** | JWT + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Stateless bearer token authentication |
| **AI Engine** | [NVIDIA NIM](https://build.nvidia.com/) (Llama-3.2-11b) | Technical task extraction and natural language execution |

---

## 📁 Project Structure

```
project_management/
├── prisma/
│   └── schema.prisma              # PostgreSQL schema & relation definitions
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/v1/                # Force-dynamic REST APIs
│   │   │   ├── ai/chat/           # NVIDIA NIM Copilot & task generation
│   │   │   ├── auth/              # JWT login & registration routes
│   │   │   ├── credentials/       # Secure vault endpoints
│   │   │   ├── notes/             # Technical documentation endpoints
│   │   │   ├── projects/          # Project CRUD endpoints
│   │   │   └── tasks/             # Task CRUD & reorder endpoints
│   │   ├── dashboard/             # Main application dashboard
│   │   ├── login/                 # Authentication pages
│   │   ├── projects/[id]/         # Project details (Kanban, Vault, Notes)
│   │   └── page.tsx               # High-converting landing page
│   ├── components/                # Modular UI components
│   │   ├── ai/                    # AiCopilotWindow floating assistant
│   │   ├── modals/                # NewTaskModal, NewNoteModal, NewCredentialModal
│   │   ├── kanban/                # Drag-and-drop board primitives
│   │   └── landing/               # Hero, Features, PainPoints, CTA
│   └── lib/                       # Core system logic
│       ├── api/                   # Database client & auth middleware
│       └── client/                # Local-first clientCache & mutationQueue
├── PROJECT_DOCUMENTATION.md       # Full deep-dive technical specification
└── README.md                      # GitHub documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.18+` or `v20+`
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **PostgreSQL Database**: Local Postgres instance or [Supabase](https://supabase.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/manmeet8549/Project_Management_platform.git
cd Project_Management_platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Supabase Transaction Pooler (Port 6543) - For application queries
DATABASE_URL="postgresql://postgres.ceicslawfqwpuzwdkvor:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15"

# Direct Connection Pooler (Port 5432) - For Prisma migrations
DIRECT_URL="postgresql://postgres.ceicslawfqwpuzwdkvor:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# JWT Secret Key (Generate a random 32-byte string)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Optional: NVIDIA NIM API Key (Fallback parser active if omitted)
NVIDIA_API_KEY="nvapi-your-nvidia-api-key"

NODE_ENV="development"
```

### 4. Push Database Schema
```bash
npx prisma db push
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment Guide (Vercel + Supabase)

### 1. Supabase IPv4 Pooler Configuration
Because Vercel serverless functions operate in an **IPv4-only** AWS network while direct Supabase URLs resolve to IPv6, ensure you use the **Supavisor Connection Pooler** host:
- **Host**: `aws-0-[region].pooler.supabase.com`
- **DATABASE_URL**: Port `6543` with `?pgbouncer=true`
- **DIRECT_URL**: Port `5432`

### 2. Build Scripts
The `package.json` build command is pre-configured with Prisma client generation for Amazon Linux (`rhel-openssl-3.0.x`):
```json
"scripts": {
  "postinstall": "prisma generate",
  "build": "prisma generate && next build"
}
```

### 3. Deploy to Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Add `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` in **Environment Variables**.
3. Deploy!

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by **[Manmeet Singh](https://github.com/manmeet8549)**

⭐ **Star this repository if you find it helpful!**

</div>
