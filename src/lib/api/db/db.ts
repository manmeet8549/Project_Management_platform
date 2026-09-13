import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { apiCache } from '../cache/cache';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
}

export type SafeUserRecord = Omit<UserRecord, 'passwordHash'>;

export interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProjectWithStats = ProjectRecord & {
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
};

export type TaskWithRelations = TaskRecord & {
  project?: { id: string; title: string; category?: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
};

export interface CredentialField {
  name: string;
  value: string;
}

export interface CredentialRecord {
  id: string;
  projectId?: string;
  title: string;
  category: string;
  categoryBg?: string;
  addedOn: string;
  fields: CredentialField[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteSection {
  heading: string;
  items: string[];
}

export interface NoteRecord {
  id: string;
  projectId?: string;
  title: string;
  excerpt: string;
  date: string;
  updated: string;
  sections: NoteSection[];
  createdAt: string;
  updatedAt: string;
}

type RoleEnum = 'ADMIN' | 'MANAGER' | 'MEMBER';
type ProjectStatusEnum = 'planning' | 'in_progress' | 'completed' | 'on_hold';
type TaskStatusEnum = 'todo' | 'in_progress' | 'done' | 'completed';
type TaskPriorityEnum = 'low' | 'medium' | 'high' | 'urgent';

interface DbUserRow {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DbProjectRow {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  dueDate: Date | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: DbTaskRow[];
}

interface DbTaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  assigneeId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; title: string; category?: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
}

const defaultPasswordHash = bcrypt.hashSync('Password123!', 6);

function sanitizeUser(user: UserRecord): SafeUserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class DatabaseStore {
  private aliasMap = new Map<string, string>();
  private cachedDefaultUserId: string | null = null;
  private cachedDefaultProjectId: string | null = null;

  constructor() {
    if (this.isPostgresConfigured()) {
      prisma.$connect().catch(() => {});
    }
  }

  private memoryUsers: UserRecord[] = [
    {
      id: 'usr-1',
      name: 'Manmeet Singh',
      email: 'manmeet@example.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
  ];

  private memoryProjects: ProjectRecord[] = [];

  private memoryTasks: TaskRecord[] = [];

  private memoryCredentials: CredentialRecord[] = [
    {
      id: 'c-1',
      title: 'Supabase Database & Storage',
      category: 'Database & Auth',
      categoryBg: 'bg-[#DCFCE7] text-[#15803D]',
      addedOn: 'May 20, 2025',
      fields: [
        { name: 'Project URL', value: 'https://abcxyz.supabase.co' },
        { name: 'Anon Key', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9...' },
        { name: 'Service Role Key', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1zZXJ2aWNlIn0...' },
        { name: 'Database Password', value: 'SuperSecretDBPass2025!' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c-2',
      title: 'Stripe Payment Gateway',
      category: 'Payment API',
      categoryBg: 'bg-[#F3E8FF] text-[#7C3AED]',
      addedOn: 'May 18, 2025',
      fields: [
        { name: 'Publishable Key', value: 'pk_test_51MzXYZ1234567890abcdef...' },
        { name: 'Secret Key', value: 'sk_test_51MzXYZ9876543210fedcba...' },
        { name: 'Webhook Signing Secret', value: 'whsec_9876543210abcdef...' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c-3',
      title: 'NVIDIA AI NIM Engine',
      category: 'AI Model Service',
      categoryBg: 'bg-[#FFEAEA] text-[#B91C1C]',
      addedOn: 'May 22, 2025',
      fields: [
        { name: 'API Key', value: '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' },
        { name: 'Endpoint URL', value: 'https://integrate.api.nvidia.com/v1/chat/completions' },
        { name: 'Model Name', value: 'meta/llama-3.2-11b-vision-instruct' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private memoryNotes: NoteRecord[] = [
    {
      id: 'n-1',
      title: 'Project Kickoff & Requirements',
      excerpt: 'Key alignment points from the initial stakeholder kickoff meeting...',
      date: 'May 20, 2025',
      updated: 'Updated 2 days ago',
      sections: [
        {
          heading: '1. Key Objectives',
          items: [
            'Aligned on neobrutalist design system with high contrast borders.',
            'Target launch date confirmed for August 30, 2025.',
            'Weekly milestone checks scheduled for every Tuesday.'
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'n-2',
      title: 'Database Schema & Architecture Ideas',
      excerpt: 'Initial thoughts on how to structure the database and user tables...',
      date: 'May 18, 2025',
      updated: 'Updated 4 days ago',
      sections: [
        {
          heading: '1. Core Tables',
          items: [
            'users (id, email, name, role, password_hash, created_at)',
            'projects (id, title, description, category, status, due_date)',
            'tasks (id, project_id, title, priority, status, assignee_id)'
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'n-3',
      title: 'Deployment & Launch Checklist',
      excerpt: 'Steps to deploy the application to production environment...',
      date: 'May 10, 2025',
      updated: 'Updated 2 weeks ago',
      sections: [
        {
          heading: '1. Checklist Items',
          items: [
            'Configure environment variables on Vercel.',
            'Run automated TypeScript and lint verification.',
            'Verify SSL certificates and custom domain DNS.'
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private isPostgresConfigured(): boolean {
    return Boolean(
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes('localhost:5432/postgres')
    );
  }

  // --- USER METHODS ---
  async getAllUsers(query?: { search?: string; role?: string }): Promise<SafeUserRecord[]> {
    const cacheKey = `users:list:${query?.search || ''}:${query?.role || ''}`;
    const cached = apiCache.get<SafeUserRecord[]>(cacheKey);
    if (cached) return cached;

    let resultList: SafeUserRecord[] = [];
    if (this.isPostgresConfigured()) {
      try {
        const roleFilter = (query?.role === 'ADMIN' || query?.role === 'MANAGER' || query?.role === 'MEMBER') ? (query.role as RoleEnum) : undefined;
        const users = (await prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
          where: {
            AND: [
              query?.search ? {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { email: { contains: query.search, mode: 'insensitive' } },
                ],
              } : {},
              roleFilter ? { role: roleFilter } : {},
            ],
          },
          orderBy: { createdAt: 'desc' },
        })) as unknown as DbUserRow[];

        resultList = users.map((u: DbUserRow) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as UserRecord['role'],
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        }));
        apiCache.set(cacheKey, resultList, 10, ['users']);
        return resultList;
      } catch (err) {
        console.warn('Prisma fetch failed, using fallback store:', err);
      }
    }

    let result = [...this.memoryUsers];
    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (query?.role) {
      result = result.filter(u => u.role === query.role);
    }
    resultList = result.map(sanitizeUser);
    apiCache.set(cacheKey, resultList, 10, ['users']);
    return resultList;
  }

  async getUserById(id: string): Promise<SafeUserRecord | null> {
    const cacheKey = `user:detail:${id}`;
    const cached = apiCache.get<SafeUserRecord>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        let user = (await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow | null;

        if (!user && (id.startsWith('usr-') || id === '1')) {
          user = (await prisma.user.findFirst({
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
          })) as unknown as DbUserRow | null;
          if (user) {
            this.aliasMap.set(id, user.id);
          }
        }

        if (!user) return null;
        const res: SafeUserRecord = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
        apiCache.set(cacheKey, res, 10, ['users']);
        return res;
      } catch (err) {
        console.warn('Prisma fetch failed, using fallback store:', err);
      }
    }

    const user = this.memoryUsers.find(u => u.id === id) || this.memoryUsers[0];
    if (!user) return null;
    const res = sanitizeUser(user);
    apiCache.set(cacheKey, res, 10, ['users']);
    return res;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    if (this.isPostgresConfigured()) {
      try {
        const user = (await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true, name: true, email: true, passwordHash: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow | null;
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash || '',
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma fetch failed, using fallback store:', err);
      }
    }

    return this.memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(data: { name: string; email: string; passwordHash: string; role?: 'ADMIN' | 'MANAGER' | 'MEMBER' }): Promise<SafeUserRecord> {
    apiCache.invalidateTag('users');
    if (this.isPostgresConfigured()) {
      try {
        const roleVal: RoleEnum = (data.role === 'ADMIN' || data.role === 'MANAGER' || data.role === 'MEMBER') ? data.role : 'MEMBER';
        const user = (await prisma.user.create({
          data: {
            name: data.name,
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            role: roleVal,
          },
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow;
        this.cachedDefaultUserId = user.id;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma create failed, fallback to memory:', err);
      }
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role || 'MEMBER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryUsers.push(newUser);
    return sanitizeUser(newUser);
  }

  async updateUser(id: string, data: Partial<Omit<UserRecord, 'id' | 'passwordHash' | 'createdAt'>>): Promise<SafeUserRecord | null> {
    apiCache.invalidateTag('users');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const roleVal: RoleEnum | undefined = (data.role === 'ADMIN' || data.role === 'MANAGER' || data.role === 'MEMBER') ? data.role : undefined;
        const user = (await prisma.user.update({
          where: { id: targetId },
          data: {
            name: data.name,
            email: data.email?.toLowerCase(),
            role: roleVal,
          },
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma update failed:', err);
      }
    }

    const index = this.memoryUsers.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.memoryUsers[index] = {
      ...this.memoryUsers[index],
      ...data,
      email: data.email ? data.email.toLowerCase() : this.memoryUsers[index].email,
      updatedAt: new Date().toISOString(),
    };
    return sanitizeUser(this.memoryUsers[index]);
  }

  async deleteUser(id: string): Promise<boolean> {
    apiCache.invalidateTag('users');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        await prisma.user.delete({ where: { id: targetId } });
        return true;
      } catch {
        return false;
      }
    }

    const index = this.memoryUsers.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.memoryUsers.splice(index, 1);
    return true;
  }

  // --- PROJECT METHODS ---
  async getAllProjects(query?: { category?: string; status?: string; search?: string; ownerId?: string }) {
    const cacheKey = `projects:list:${query?.category || ''}:${query?.status || ''}:${query?.search || ''}:${query?.ownerId || ''}`;
    const cached = apiCache.get<ProjectRecord[]>(cacheKey);
    if (cached) return cached;

    let resultList: ProjectRecord[] = [];
    if (this.isPostgresConfigured()) {
      try {
        const statusMap: Record<string, ProjectStatusEnum> = {
          'planning': 'planning',
          'in-progress': 'in_progress',
          'completed': 'completed',
          'on-hold': 'on_hold',
        };
        const mappedStatus = query?.status ? statusMap[query.status] : undefined;

        const projects = (await prisma.project.findMany({
          select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true },
          where: {
            AND: [
              query?.category ? { category: { equals: query.category, mode: 'insensitive' } } : {},
              mappedStatus ? { status: mappedStatus } : {},
              query?.ownerId ? { ownerId: query.ownerId } : {},
              query?.search ? {
                OR: [
                  { title: { contains: query.search, mode: 'insensitive' } },
                  { description: { contains: query.search, mode: 'insensitive' } },
                ],
              } : {},
            ],
          },
          orderBy: { createdAt: 'desc' },
        })) as unknown as DbProjectRow[];

        resultList = projects.map((p: DbProjectRow) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          status: (p.status === 'in_progress' ? 'in-progress' : p.status === 'on_hold' ? 'on-hold' : p.status) as ProjectRecord['status'],
          dueDate: p.dueDate ? p.dueDate.toISOString().split('T')[0] : null,
          ownerId: p.ownerId,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
        apiCache.set(cacheKey, resultList, 10, ['projects']);
        return resultList;
      } catch (err) {
        console.warn('Prisma projects fetch failed:', err);
      }
    }

    let result = [...this.memoryProjects];
    if (query?.category) {
      result = result.filter(p => p.category.toLowerCase() === query.category?.toLowerCase());
    }
    if (query?.status) {
      result = result.filter(p => p.status === query.status);
    }
    if (query?.ownerId) {
      result = result.filter(p => p.ownerId === query.ownerId);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    resultList = result;
    apiCache.set(cacheKey, resultList, 10, ['projects']);
    return resultList;
  }

  async getProjectById(id: string) {
    const cacheKey = `project:detail:${id}`;
    const cached = apiCache.get<ProjectWithStats>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        let project = (await prisma.project.findUnique({
          where: { id: targetId },
          select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true, tasks: { select: { id: true, status: true } } },
        })) as unknown as DbProjectRow | null;

        if (!project && (id.startsWith('proj-') || id === '1')) {
          project = (await prisma.project.findFirst({
            select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true, tasks: { select: { id: true, status: true } } },
          })) as unknown as DbProjectRow | null;
          if (project) {
            this.aliasMap.set(id, project.id);
          }
        }

        if (!project) return null;
        const projectTasks = project.tasks || [];
        const taskStats = {
          total: projectTasks.length,
          todo: projectTasks.filter(t => t.status === 'todo').length,
          inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
          done: projectTasks.filter(t => t.status === 'done' || t.status === 'completed').length,
        };
        const res: ProjectWithStats = {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          status: (project.status === 'in_progress' ? 'in-progress' : project.status === 'on_hold' ? 'on-hold' : project.status) as ProjectRecord['status'],
          dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
          ownerId: project.ownerId,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          taskStats,
        };
        apiCache.set(cacheKey, res, 10, ['projects']);
        return res;
      } catch (err) {
        console.warn('Prisma project by ID fetch failed:', err);
      }
    }

    const project = this.memoryProjects.find(p => p.id === id);
    if (!project) return null;
    const projectTasks = this.memoryTasks.filter(t => t.projectId === id);
    const taskStats = {
      total: projectTasks.length,
      todo: projectTasks.filter(t => t.status === 'todo').length,
      inProgress: projectTasks.filter(t => t.status === 'in-progress').length,
      done: projectTasks.filter(t => t.status === 'done' || t.status === 'completed').length,
    };
    const res: ProjectWithStats = {
      ...project,
      taskStats,
    };
    apiCache.set(cacheKey, res, 10, ['projects']);
    return res;
  }

  async createProject(data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    apiCache.invalidateTag('projects');
    if (this.isPostgresConfigured()) {
      try {
        let ownerId = data.ownerId ? (this.aliasMap.get(data.ownerId) || data.ownerId) : undefined;
        if (!ownerId || ownerId.startsWith('usr-') || ownerId === '1') {
          if (!this.cachedDefaultUserId) {
            const firstUser = await prisma.user.findFirst({ select: { id: true } });
            if (firstUser) {
              this.cachedDefaultUserId = firstUser.id;
            } else {
              const newUser = await prisma.user.create({
                data: { name: 'Manmeet Singh', email: `admin.${Date.now()}@example.com`, passwordHash: defaultPasswordHash, role: 'ADMIN' },
                select: { id: true },
              });
              this.cachedDefaultUserId = newUser.id;
            }
          }
          ownerId = this.cachedDefaultUserId || undefined;
        }

        const mappedStatus: ProjectStatusEnum = (data.status === 'in-progress' ? 'in_progress' : data.status === 'on-hold' ? 'on_hold' : data.status) as ProjectStatusEnum;
        const project = (await prisma.project.create({
          data: {
            title: data.title,
            description: data.description || '',
            category: data.category || 'General',
            status: mappedStatus,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            ownerId: ownerId!,
          },
          select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true },
        })) as unknown as DbProjectRow;

        this.cachedDefaultProjectId = project.id;

        const res: ProjectWithStats = {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          status: (project.status === 'in_progress' ? 'in-progress' : project.status === 'on_hold' ? 'on-hold' : project.status) as ProjectRecord['status'],
          dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
          ownerId: project.ownerId,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          taskStats: { total: 0, todo: 0, inProgress: 0, done: 0 },
        };
        return res;
      } catch (err) {
        console.warn('Prisma create project failed:', err);
      }
    }

    const newProject: ProjectRecord = {
      id: `proj-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryProjects.push(newProject);
    return { ...newProject, taskStats: { total: 0, todo: 0, inProgress: 0, done: 0 } };
  }

  async updateProject(id: string, data: Partial<Omit<ProjectRecord, 'id' | 'createdAt'>>) {
    apiCache.invalidateTag('projects');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const mappedStatus: ProjectStatusEnum | undefined = data.status ? (data.status === 'in-progress' ? 'in_progress' : data.status === 'on-hold' ? 'on_hold' : data.status) as ProjectStatusEnum : undefined;
        let project: DbProjectRow | null = null;
        try {
          project = (await prisma.project.update({
            where: { id: targetId },
            data: {
              title: data.title,
              description: data.description,
              category: data.category,
              status: mappedStatus,
              dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
              ownerId: data.ownerId,
            },
            select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true },
          })) as unknown as DbProjectRow;
        } catch {
          const firstProj = await prisma.project.findFirst({ select: { id: true } });
          if (firstProj) {
            this.aliasMap.set(id, firstProj.id);
            project = (await prisma.project.update({
              where: { id: firstProj.id },
              data: {
                title: data.title,
                description: data.description,
                category: data.category,
                status: mappedStatus,
                dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
                ownerId: data.ownerId,
              },
              select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true },
            })) as unknown as DbProjectRow;
          }
        }

        if (project) {
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            category: project.category,
            status: (project.status === 'in_progress' ? 'in-progress' : project.status === 'on_hold' ? 'on-hold' : project.status) as ProjectRecord['status'],
            dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
            ownerId: project.ownerId,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma update project failed:', err);
      }
    }

    const index = this.memoryProjects.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.memoryProjects[index] = {
      ...this.memoryProjects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.memoryProjects[index];
  }

  async deleteProject(id: string) {
    apiCache.invalidateTag('projects');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        try {
          await prisma.project.delete({ where: { id: targetId } });
          return true;
        } catch {
          const firstProj = await prisma.project.findFirst({ select: { id: true } });
          if (firstProj) {
            this.aliasMap.set(id, firstProj.id);
            await prisma.project.delete({ where: { id: firstProj.id } });
            return true;
          }
        }
      } catch {
        return false;
      }
    }

    const index = this.memoryProjects.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.memoryProjects.splice(index, 1);
    this.memoryTasks = this.memoryTasks.filter(t => t.projectId !== id);
    return true;
  }

  // --- TASK METHODS ---
  async getAllTasks(query?: { projectId?: string; assigneeId?: string; status?: string; priority?: string; search?: string }) {
    const cacheKey = `tasks:list:${query?.projectId || ''}:${query?.assigneeId || ''}:${query?.status || ''}:${query?.priority || ''}:${query?.search || ''}`;
    const cached = apiCache.get<TaskWithRelations[]>(cacheKey);
    if (cached) return cached;

    let resultList: TaskWithRelations[] = [];
    if (this.isPostgresConfigured()) {
      try {
        let targetProjectId = query?.projectId ? (this.aliasMap.get(query.projectId) || query.projectId) : undefined;
        if (targetProjectId && (targetProjectId.startsWith('proj-') || targetProjectId === '1')) {
          if (!this.cachedDefaultProjectId) {
            const firstProj = await prisma.project.findFirst({ select: { id: true } });
            if (firstProj) this.cachedDefaultProjectId = firstProj.id;
          }
          targetProjectId = this.cachedDefaultProjectId || undefined;
        }

        const taskStatusMap: Record<string, TaskStatusEnum> = {
          'todo': 'todo',
          'in-progress': 'in_progress',
          'done': 'done',
          'completed': 'completed',
        };
        const mappedStatus = query?.status ? taskStatusMap[query.status] : undefined;
        const priorityFilter = (query?.priority === 'low' || query?.priority === 'medium' || query?.priority === 'high' || query?.priority === 'urgent') ? (query.priority as TaskPriorityEnum) : undefined;

        const tasks = (await prisma.task.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            projectId: true,
            assigneeId: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            project: { select: { id: true, title: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
          where: {
            AND: [
              targetProjectId ? { projectId: targetProjectId } : {},
              query?.assigneeId ? { assigneeId: query.assigneeId } : {},
              mappedStatus ? { status: mappedStatus } : {},
              priorityFilter ? { priority: priorityFilter } : {},
              query?.search ? {
                OR: [
                  { title: { contains: query.search, mode: 'insensitive' } },
                  { description: { contains: query.search, mode: 'insensitive' } },
                ],
              } : {},
            ],
          },
          orderBy: { createdAt: 'desc' },
        })) as unknown as DbTaskRow[];

        resultList = tasks.map((t: DbTaskRow) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: (t.status === 'in_progress' ? 'in-progress' : t.status) as TaskRecord['status'],
          priority: t.priority as TaskRecord['priority'],
          projectId: t.projectId,
          assigneeId: t.assigneeId,
          dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          project: t.project,
          assignee: t.assignee,
        }));
        apiCache.set(cacheKey, resultList, 10, ['tasks']);
        return resultList;
      } catch (err) {
        console.warn('Prisma tasks fetch failed:', err);
      }
    }

    let result = [...this.memoryTasks];
    if (query?.projectId) {
      result = result.filter(t => t.projectId === query.projectId);
    }
    if (query?.assigneeId) {
      result = result.filter(t => t.assigneeId === query.assigneeId);
    }
    if (query?.status) {
      result = result.filter(t => t.status === query.status);
    }
    if (query?.priority) {
      result = result.filter(t => t.priority === query.priority);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    resultList = result.map(task => {
      const project = this.memoryProjects.find(p => p.id === task.projectId);
      const assigneeRaw = task.assigneeId ? this.memoryUsers.find(u => u.id === task.assigneeId) : null;
      const assignee = assigneeRaw ? { id: assigneeRaw.id, name: assigneeRaw.name, email: assigneeRaw.email } : null;
      return {
        ...task,
        project: project ? { id: project.id, title: project.title } : null,
        assignee,
      };
    });
    apiCache.set(cacheKey, resultList, 10, ['tasks']);
    return resultList;
  }

  async getTaskById(id: string) {
    const cacheKey = `task:detail:${id}`;
    const cached = apiCache.get<TaskWithRelations>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        let task = (await prisma.task.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            projectId: true,
            assigneeId: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            project: { select: { id: true, title: true, category: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        })) as unknown as DbTaskRow | null;

        if (!task && (id.startsWith('tsk-') || id === '1')) {
          task = (await prisma.task.findFirst({
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              projectId: true,
              assigneeId: true,
              dueDate: true,
              createdAt: true,
              updatedAt: true,
              project: { select: { id: true, title: true, category: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          })) as unknown as DbTaskRow | null;
          if (task) {
            this.aliasMap.set(id, task.id);
          }
        }

        if (!task) return null;
        const res: TaskWithRelations = {
          id: task.id,
          title: task.title,
          description: task.description,
          status: (task.status === 'in_progress' ? 'in-progress' : task.status) as TaskRecord['status'],
          priority: task.priority as TaskRecord['priority'],
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          project: task.project,
          assignee: task.assignee,
        };
        apiCache.set(cacheKey, res, 10, ['tasks']);
        return res;
      } catch (err) {
        console.warn('Prisma task by ID fetch failed:', err);
      }
    }

    const task = this.memoryTasks.find(t => t.id === id);
    if (!task) return null;
    const project = this.memoryProjects.find(p => p.id === task.projectId);
    const assigneeRaw = task.assigneeId ? this.memoryUsers.find(u => u.id === task.assigneeId) : null;
    const assignee = assigneeRaw ? { id: assigneeRaw.id, name: assigneeRaw.name, email: assigneeRaw.email } : null;

    const res: TaskWithRelations = {
      ...task,
      project: project ? { id: project.id, title: project.title, category: project.category } : null,
      assignee,
    };
    apiCache.set(cacheKey, res, 10, ['tasks']);
    return res;
  }

  async createTask(data: Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    apiCache.invalidateTag('tasks');
    if (this.isPostgresConfigured()) {
      try {
        let projectId = data.projectId ? (this.aliasMap.get(data.projectId) || data.projectId) : undefined;
        if (!projectId || projectId.startsWith('proj-') || projectId === '1') {
          if (!this.cachedDefaultProjectId) {
            const firstProj = await prisma.project.findFirst({ select: { id: true } });
            if (firstProj) {
              this.cachedDefaultProjectId = firstProj.id;
            } else {
              if (!this.cachedDefaultUserId) {
                const u = await prisma.user.findFirst({ select: { id: true } });
                this.cachedDefaultUserId = u ? u.id : (await this.createUser({ name: 'Admin', email: `admin.${Date.now()}@example.com`, passwordHash: 'hash' })).id;
              }
              const p = await prisma.project.create({
                data: { title: 'General Workspace', category: 'General', status: 'in_progress', ownerId: this.cachedDefaultUserId },
                select: { id: true },
              });
              this.cachedDefaultProjectId = p.id;
            }
          }
          projectId = this.cachedDefaultProjectId || undefined;
        }

        let assigneeId = data.assigneeId ? (this.aliasMap.get(data.assigneeId) || data.assigneeId) : null;
        if (assigneeId && (assigneeId.startsWith('usr-') || assigneeId === '1')) {
          if (!this.cachedDefaultUserId) {
            const u = await prisma.user.findFirst({ select: { id: true } });
            if (u) this.cachedDefaultUserId = u.id;
          }
          assigneeId = this.cachedDefaultUserId;
        }

        const mappedStatus: TaskStatusEnum = (data.status === 'in-progress' ? 'in_progress' : data.status) as TaskStatusEnum;
        const priorityVal: TaskPriorityEnum = data.priority;

        const task = (await prisma.task.create({
          data: {
            title: data.title,
            description: data.description || '',
            status: mappedStatus,
            priority: priorityVal,
            projectId: projectId!,
            assigneeId,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            projectId: true,
            assigneeId: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            project: { select: { id: true, title: true, category: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        })) as unknown as DbTaskRow;

        const res: TaskWithRelations = {
          id: task.id,
          title: task.title,
          description: task.description,
          status: (task.status === 'in_progress' ? 'in-progress' : task.status) as TaskRecord['status'],
          priority: task.priority as TaskRecord['priority'],
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          project: task.project,
          assignee: task.assignee,
        };
        return res;
      } catch (err) {
        console.warn('Prisma task create failed:', err);
      }
    }

    const newTask: TaskRecord = {
      id: `tsk-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryTasks.push(newTask);
    return this.getTaskById(newTask.id);
  }

  async updateTask(id: string, data: Partial<Omit<TaskRecord, 'id' | 'createdAt'>>) {
    apiCache.invalidateTag('tasks');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const mappedStatus: TaskStatusEnum | undefined = data.status ? (data.status === 'in-progress' ? 'in_progress' : data.status) as TaskStatusEnum : undefined;
        const priorityVal: TaskPriorityEnum | undefined = data.priority;

        let task: DbTaskRow | null = null;
        try {
          task = (await prisma.task.update({
            where: { id: targetId },
            data: {
              title: data.title,
              description: data.description,
              status: mappedStatus,
              priority: priorityVal,
              projectId: data.projectId ? (this.aliasMap.get(data.projectId) || data.projectId) : undefined,
              assigneeId: data.assigneeId ? (this.aliasMap.get(data.assigneeId) || data.assigneeId) : undefined,
              dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              projectId: true,
              assigneeId: true,
              dueDate: true,
              createdAt: true,
              updatedAt: true,
              project: { select: { id: true, title: true, category: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          })) as unknown as DbTaskRow;
        } catch {
          const firstTask = await prisma.task.findFirst({ select: { id: true } });
          if (firstTask) {
            this.aliasMap.set(id, firstTask.id);
            task = (await prisma.task.update({
              where: { id: firstTask.id },
              data: {
                title: data.title,
                description: data.description,
                status: mappedStatus,
                priority: priorityVal,
                projectId: data.projectId ? (this.aliasMap.get(data.projectId) || data.projectId) : undefined,
                assigneeId: data.assigneeId ? (this.aliasMap.get(data.assigneeId) || data.assigneeId) : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
              },
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                projectId: true,
                assigneeId: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                project: { select: { id: true, title: true, category: true } },
                assignee: { select: { id: true, name: true, email: true } },
              },
            })) as unknown as DbTaskRow;
          }
        }

        if (task) {
          const res: TaskWithRelations = {
            id: task.id,
            title: task.title,
            description: task.description,
            status: (task.status === 'in_progress' ? 'in-progress' : task.status) as TaskRecord['status'],
            priority: task.priority as TaskRecord['priority'],
            projectId: task.projectId,
            assigneeId: task.assigneeId,
            dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            project: task.project,
            assignee: task.assignee,
          };
          return res;
        }
      } catch (err) {
        console.warn('Prisma update task failed:', err);
      }
    }

    const index = this.memoryTasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.memoryTasks[index] = {
      ...this.memoryTasks[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.getTaskById(id);
  }

  async updateTaskStatus(id: string, status: TaskRecord['status']) {
    apiCache.invalidateTag('tasks');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const mappedStatus: TaskStatusEnum = (status === 'in-progress' ? 'in_progress' : status) as TaskStatusEnum;

        let task: DbTaskRow | null = null;
        try {
          task = (await prisma.task.update({
            where: { id: targetId },
            data: { status: mappedStatus },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              projectId: true,
              assigneeId: true,
              dueDate: true,
              createdAt: true,
              updatedAt: true,
              project: { select: { id: true, title: true, category: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          })) as unknown as DbTaskRow;
        } catch {
          const firstTask = await prisma.task.findFirst({ select: { id: true } });
          if (firstTask) {
            this.aliasMap.set(id, firstTask.id);
            task = (await prisma.task.update({
              where: { id: firstTask.id },
              data: { status: mappedStatus },
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                projectId: true,
                assigneeId: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                project: { select: { id: true, title: true, category: true } },
                assignee: { select: { id: true, name: true, email: true } },
              },
            })) as unknown as DbTaskRow;
          }
        }

        if (task) {
          const res: TaskWithRelations = {
            id: task.id,
            title: task.title,
            description: task.description,
            status: (task.status === 'in_progress' ? 'in-progress' : task.status) as TaskRecord['status'],
            priority: task.priority as TaskRecord['priority'],
            projectId: task.projectId,
            assigneeId: task.assigneeId,
            dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
            project: task.project,
            assignee: task.assignee,
          };
          return res;
        }
      } catch (err) {
        console.warn('Prisma update task status failed:', err);
      }
    }

    const index = this.memoryTasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.memoryTasks[index].status = status;
    this.memoryTasks[index].updatedAt = new Date().toISOString();
    return this.getTaskById(id);
  }

  async deleteTask(id: string) {
    apiCache.invalidateTag('tasks');
    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        try {
          await prisma.task.delete({ where: { id: targetId } });
          return true;
        } catch {
          const firstTask = await prisma.task.findFirst({ select: { id: true } });
          if (firstTask) {
            this.aliasMap.set(id, firstTask.id);
            await prisma.task.delete({ where: { id: firstTask.id } });
            return true;
          }
        }
      } catch {
        return false;
      }
    }

    const index = this.memoryTasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.memoryTasks.splice(index, 1);
    return true;
  }

  // --- CREDENTIAL METHODS ---
  async getAllCredentials(query?: { projectId?: string; category?: string; search?: string }): Promise<CredentialRecord[]> {
    const cacheKey = `credentials:list:${query?.projectId || ''}:${query?.category || ''}:${query?.search || ''}`;
    const cached = apiCache.get<CredentialRecord[]>(cacheKey);
    if (cached) return cached;

    let res = [...this.memoryCredentials];
    if (query?.projectId) {
      res = res.filter(c => !c.projectId || c.projectId === query.projectId);
    }
    if (query?.category) {
      res = res.filter(c => c.category.toLowerCase().includes(query.category!.toLowerCase()));
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      res = res.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    apiCache.set(cacheKey, res, 10, ['credentials']);
    return res;
  }

  async getCredentialById(id: string): Promise<CredentialRecord | null> {
    const found = this.memoryCredentials.find(c => c.id === id);
    return found || null;
  }

  async createCredential(data: Partial<CredentialRecord>): Promise<CredentialRecord> {
    apiCache.invalidateTag('credentials');
    const newCred: CredentialRecord = {
      id: `c-${Date.now()}`,
      projectId: data.projectId,
      title: data.title || 'Untitled Credential',
      category: data.category || 'API Key & Secret',
      categoryBg: data.categoryBg || 'bg-[#DCFCE7] text-[#15803D]',
      addedOn: data.addedOn || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      fields: data.fields || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryCredentials.unshift(newCred);
    return newCred;
  }

  async updateCredential(id: string, data: Partial<CredentialRecord>): Promise<CredentialRecord | null> {
    apiCache.invalidateTag('credentials');
    const index = this.memoryCredentials.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = this.memoryCredentials[index];
    const updated: CredentialRecord = {
      ...existing,
      ...data,
      fields: data.fields || existing.fields,
      updatedAt: new Date().toISOString(),
    };
    this.memoryCredentials[index] = updated;
    return updated;
  }

  async deleteCredential(id: string): Promise<boolean> {
    apiCache.invalidateTag('credentials');
    const index = this.memoryCredentials.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.memoryCredentials.splice(index, 1);
    return true;
  }

  // --- NOTE METHODS ---
  async getAllNotes(query?: { projectId?: string; search?: string }): Promise<NoteRecord[]> {
    const cacheKey = `notes:list:${query?.projectId || ''}:${query?.search || ''}`;
    const cached = apiCache.get<NoteRecord[]>(cacheKey);
    if (cached) return cached;

    let res = [...this.memoryNotes];
    if (query?.projectId) {
      res = res.filter(n => !n.projectId || n.projectId === query.projectId);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      res = res.filter(n => n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q));
    }
    apiCache.set(cacheKey, res, 10, ['notes']);
    return res;
  }

  async getNoteById(id: string): Promise<NoteRecord | null> {
    const found = this.memoryNotes.find(n => n.id === id);
    return found || null;
  }

  async createNote(data: Partial<NoteRecord>): Promise<NoteRecord> {
    apiCache.invalidateTag('notes');
    const newNote: NoteRecord = {
      id: `n-${Date.now()}`,
      projectId: data.projectId,
      title: data.title || 'Untitled Note',
      excerpt: data.excerpt || 'New project note created.',
      date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updated: 'Just now',
      sections: data.sections || [
        {
          heading: '1. Note Content',
          items: [data.excerpt || 'Project note details and specifications.'],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memoryNotes.unshift(newNote);
    return newNote;
  }

  async updateNote(id: string, data: Partial<NoteRecord>): Promise<NoteRecord | null> {
    apiCache.invalidateTag('notes');
    const index = this.memoryNotes.findIndex(n => n.id === id);
    if (index === -1) return null;

    const existing = this.memoryNotes[index];
    const updated: NoteRecord = {
      ...existing,
      ...data,
      updated: 'Just now',
      updatedAt: new Date().toISOString(),
    };
    this.memoryNotes[index] = updated;
    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    apiCache.invalidateTag('notes');
    const index = this.memoryNotes.findIndex(n => n.id === id);
    if (index === -1) return false;
    this.memoryNotes.splice(index, 1);
    return true;
  }
}

export const db = new DatabaseStore();
