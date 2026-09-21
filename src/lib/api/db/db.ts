import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
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
  userId?: string;
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
  userId?: string;
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
  private resolvedOwnerIdsMap = new Map<string, string[]>();

  private async resolveOwnerIds(ownerId: string): Promise<string[]> {
    if (this.resolvedOwnerIdsMap.has(ownerId)) {
      return this.resolvedOwnerIdsMap.get(ownerId)!;
    }

    const targetOwnerId = this.aliasMap.get(ownerId) || ownerId;
    const ownerIds = new Set<string>();
    ownerIds.add(ownerId);
    if (targetOwnerId) ownerIds.add(targetOwnerId);

    const memUser = this.memoryUsers.find(
      u => u.id === ownerId || u.id === targetOwnerId || u.email.toLowerCase() === ownerId.toLowerCase()
    );
    if (memUser) {
      ownerIds.add(memUser.id);
      ownerIds.add(memUser.email);
    }

    if (this.isPostgresConfigured()) {
      try {
        if (memUser) {
          const dbU = await prisma.user.findUnique({ where: { email: memUser.email.toLowerCase() }, select: { id: true } });
          if (dbU) ownerIds.add(dbU.id);
        } else {
          const dbU = await prisma.user.findFirst({
            where: { OR: [{ id: ownerId }, { email: ownerId.toLowerCase() }] },
            select: { id: true, email: true },
          });
          if (dbU) {
            ownerIds.add(dbU.id);
            ownerIds.add(dbU.email);
          }
        }
      } catch (err) {
        console.warn('User ID resolution error:', err);
      }
    }

    const res = Array.from(ownerIds);
    this.resolvedOwnerIdsMap.set(ownerId, res);
    return res;
  }

  constructor() {
    if (this.isPostgresConfigured()) {
      prisma.$connect().catch(() => {});
    }
  }

  private memoryUsers: UserRecord[] = [
    {
      id: 'usr-1',
      name: 'Manmeet Singh',
      email: 'manmeet@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'usr-2',
      name: 'Manmeet Singh',
      email: 'manmeet@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'usr-3',
      name: 'Kabir Singh',
      email: 'kabir@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
  ];

  private memoryProjects: ProjectRecord[] = [];

  private memoryTasks: TaskRecord[] = [];

  private memoryCredentials: CredentialRecord[] = [];

  private memoryNotes: NoteRecord[] = [];

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
        apiCache.set(cacheKey, resultList, 300, ['users']);
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
    apiCache.set(cacheKey, resultList, 300, ['users']);
    return resultList;
  }

  async getUserById(id: string): Promise<SafeUserRecord | null> {
    const cacheKey = `user:detail:${id}`;
    const cached = apiCache.get<SafeUserRecord>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const user = (await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow | null;

        if (!user) return null;
        const res: SafeUserRecord = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
        apiCache.set(cacheKey, res, 300, ['users']);
        return res;
      } catch (err) {
        console.warn('Prisma fetch failed, using fallback store:', err);
      }
    }

    const user = this.memoryUsers.find(u => u.id === id);
    if (!user) return null;
    const res = sanitizeUser(user);
    apiCache.set(cacheKey, res, 300, ['users']);
    return res;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isPostgresConfigured()) {
      try {
        const user = (await prisma.user.findUnique({
          where: { email: cleanEmail },
          select: { id: true, name: true, email: true, passwordHash: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow | null;
        if (user) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash || '',
            role: user.role as UserRecord['role'],
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma getUserByEmail fetch failed:', err);
      }
    }

    return this.memoryUsers.find(u => u.email.trim().toLowerCase() === cleanEmail) || null;
  }

  async createUser(data: { name: string; email: string; passwordHash: string; role?: 'ADMIN' | 'MANAGER' | 'MEMBER' }): Promise<SafeUserRecord> {
    apiCache.invalidateTag('users');
    this.resolvedOwnerIdsMap.clear();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    const memoryRecord: UserRecord = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: data.passwordHash,
      role: data.role || 'MEMBER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isPostgresConfigured()) {
      try {
        const roleVal: RoleEnum = (data.role === 'ADMIN' || data.role === 'MANAGER' || data.role === 'MEMBER') ? data.role : 'MEMBER';
        const user = (await prisma.user.create({
          data: {
            name: cleanName,
            email: cleanEmail,
            passwordHash: data.passwordHash,
            role: roleVal,
          },
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        })) as unknown as DbUserRow;
        this.cachedDefaultUserId = user.id;

        memoryRecord.id = user.id;
        memoryRecord.createdAt = user.createdAt.toISOString();
        memoryRecord.updatedAt = user.updatedAt.toISOString();

        const existingIdx = this.memoryUsers.findIndex(u => u.id === user.id || u.email.trim().toLowerCase() === cleanEmail);
        if (existingIdx !== -1) {
          this.memoryUsers[existingIdx] = memoryRecord;
        } else {
          this.memoryUsers.push(memoryRecord);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma create user failed, fallback to memory store:', err);
      }
    }

    const existingIdx = this.memoryUsers.findIndex(u => u.email.trim().toLowerCase() === cleanEmail);
    if (existingIdx !== -1) {
      this.memoryUsers[existingIdx] = memoryRecord;
    } else {
      this.memoryUsers.push(memoryRecord);
    }
    return sanitizeUser(memoryRecord);
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

    let targetOwnerId = query?.ownerId;
    if (targetOwnerId) {
      targetOwnerId = this.aliasMap.get(targetOwnerId) || targetOwnerId;
    }

    let ownerIds: string[] = [];
    if (query?.ownerId) {
      ownerIds = await this.resolveOwnerIds(query.ownerId);
    }

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

        let ownerWhere = {};
        if (query?.ownerId && ownerIds.length > 0) {
          ownerWhere = { ownerId: { in: ownerIds } };
        }

        const projects = (await prisma.project.findMany({
          select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true },
          where: {
            AND: [
              query?.category ? { category: { equals: query.category, mode: 'insensitive' } } : {},
              mappedStatus ? { status: mappedStatus } : {},
              ownerWhere,
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

        // Merge any memory projects belonging to this owner that were created earlier
        if (query?.ownerId) {
          const ownerIdsSet = new Set(ownerIds);
          for (const mp of this.memoryProjects) {
            if ((ownerIdsSet.has(mp.ownerId) || mp.ownerId === query.ownerId || mp.ownerId === targetOwnerId) && !resultList.some(rp => rp.id === mp.id)) {
              resultList.push(mp);
            }
          }
        }

        apiCache.set(cacheKey, resultList, 300, ['projects']);
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
      const ownerIdsSet = new Set(ownerIds);
      result = result.filter(p => ownerIdsSet.has(p.ownerId) || p.ownerId === query.ownerId || p.ownerId === targetOwnerId);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    resultList = result;
    apiCache.set(cacheKey, resultList, 300, ['projects']);
    return resultList;
  }

  async getProjectById(id: string) {
    const cacheKey = `project:detail:${id}`;
    const cached = apiCache.get<ProjectWithStats>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const project = (await prisma.project.findUnique({
          where: { id: targetId },
          select: { id: true, title: true, description: true, category: true, status: true, dueDate: true, ownerId: true, createdAt: true, updatedAt: true, tasks: { select: { id: true, status: true } } },
        })) as unknown as DbProjectRow | null;

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
        apiCache.set(cacheKey, res, 300, ['projects']);
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
    apiCache.set(cacheKey, res, 300, ['projects']);
    return res;
  }

  async createProject(data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    apiCache.invalidateTag('projects');
    if (this.isPostgresConfigured()) {
      try {
        let ownerId = data.ownerId ? (this.aliasMap.get(data.ownerId) || data.ownerId) : undefined;

        if (data.ownerId) {
          const memUser = this.memoryUsers.find(
            u => u.id === data.ownerId || u.id === ownerId || u.email.toLowerCase() === data.ownerId.toLowerCase()
          );
          if (memUser) {
            let dbUser = await prisma.user.findUnique({ where: { email: memUser.email.toLowerCase() }, select: { id: true } });
            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: { name: memUser.name, email: memUser.email.toLowerCase(), passwordHash: memUser.passwordHash, role: memUser.role as RoleEnum },
                select: { id: true },
              });
            }
            ownerId = dbUser.id;
            this.aliasMap.set(data.ownerId, dbUser.id);
            this.aliasMap.set(dbUser.id, data.ownerId);
            this.aliasMap.set(memUser.id, dbUser.id);
          } else {
            const userExists = await prisma.user.findFirst({
              where: { OR: [{ id: data.ownerId }, { email: data.ownerId.toLowerCase() }] },
              select: { id: true },
            });
            if (userExists) {
              ownerId = userExists.id;
            }
          }
        }

        if (!ownerId) {
          const firstUser = await prisma.user.findFirst({ select: { id: true } });
          if (firstUser) {
            ownerId = firstUser.id;
          } else {
            const newUser = await prisma.user.create({
              data: { name: 'Manmeet Singh', email: `admin.${Date.now()}@example.com`, passwordHash: defaultPasswordHash, role: 'ADMIN' },
              select: { id: true },
            });
            ownerId = newUser.id;
          }
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

        const memoryRecord: ProjectRecord = {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          status: (project.status === 'in_progress' ? 'in-progress' : project.status === 'on_hold' ? 'on-hold' : project.status) as ProjectRecord['status'],
          dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
          ownerId: data.ownerId || project.ownerId,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        };
        const existingIdx = this.memoryProjects.findIndex(p => p.id === project.id);
        if (existingIdx !== -1) {
          this.memoryProjects[existingIdx] = memoryRecord;
        } else {
          this.memoryProjects.push(memoryRecord);
        }

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
    apiCache.invalidateTag('tasks');
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
  async getAllTasks(query?: { projectId?: string; assigneeId?: string; status?: string; priority?: string; search?: string; ownerId?: string }) {
    const cacheKey = `tasks:list:${query?.projectId || ''}:${query?.assigneeId || ''}:${query?.status || ''}:${query?.priority || ''}:${query?.search || ''}:${query?.ownerId || ''}`;
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

        let ownerWhere = {};
        if (query?.ownerId) {
          const ownerIds = await this.resolveOwnerIds(query.ownerId);
          if (ownerIds.length > 0) {
            ownerWhere = { project: { ownerId: { in: ownerIds } } };
          }
        }

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
              ownerWhere,
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
        apiCache.set(cacheKey, resultList, 300, ['tasks']);
        return resultList;
      } catch (err) {
        console.warn('Prisma tasks fetch failed:', err);
      }
    }

    let result = [...this.memoryTasks];
    if (query?.ownerId) {
      const userProjIds = new Set(this.memoryProjects.filter(p => p.ownerId === query.ownerId).map(p => p.id));
      result = result.filter(t => userProjIds.has(t.projectId) || t.assigneeId === query.ownerId);
    }
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
    apiCache.set(cacheKey, resultList, 300, ['tasks']);
    return resultList;
  }

  async getTaskById(id: string) {
    const cacheKey = `task:detail:${id}`;
    const cached = apiCache.get<TaskWithRelations>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const targetId = this.aliasMap.get(id) || id;
        const task = (await prisma.task.findUnique({
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
        apiCache.set(cacheKey, res, 300, ['tasks']);
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
    apiCache.set(cacheKey, res, 300, ['tasks']);
    return res;
  }

  async createTask(data: Partial<TaskRecord> & { title: string; priority: TaskPriorityEnum; status: TaskRecord['status'] | TaskStatusEnum; projectId: string }) {
    apiCache.invalidateTag('tasks');
    apiCache.invalidateTag('projects');
    if (this.isPostgresConfigured()) {
      try {
        let projectId = data.projectId ? (this.aliasMap.get(data.projectId) || data.projectId) : undefined;
        if (projectId) {
          const projExists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
          if (!projExists) {
            const firstProj = await prisma.project.findFirst({ select: { id: true } });
            projectId = firstProj ? firstProj.id : undefined;
          }
        }

        if (!projectId) {
          const firstProj = await prisma.project.findFirst({ select: { id: true } });
          if (firstProj) {
            projectId = firstProj.id;
          } else {
            const u = await prisma.user.findFirst({ select: { id: true } });
            const ownerId = u ? u.id : (await this.createUser({ name: 'Admin', email: `admin.${Date.now()}@example.com`, passwordHash: 'hash' })).id;
            const p = await prisma.project.create({
              data: { title: 'General Workspace', category: 'General', status: 'in_progress', ownerId },
              select: { id: true },
            });
            projectId = p.id;
          }
        }

        let assigneeId = data.assigneeId ? (this.aliasMap.get(data.assigneeId) || data.assigneeId) : null;
        if (assigneeId) {
          const uExists = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
          if (!uExists) assigneeId = null;
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
            createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
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
      title: data.title,
      description: data.description || '',
      status: ((data.status as string) === 'in_progress' ? 'in-progress' : data.status) as TaskRecord['status'],
      priority: data.priority as TaskRecord['priority'],
      projectId: data.projectId,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate || null,
      createdAt: data.createdAt || new Date().toISOString(),
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
    apiCache.invalidateTag('projects');
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
  async getAllCredentials(query?: { projectId?: string; category?: string; search?: string; userId?: string }): Promise<CredentialRecord[]> {
    const cacheKey = `credentials:list:${query?.projectId || ''}:${query?.category || ''}:${query?.search || ''}:${query?.userId || ''}`;
    const cached = apiCache.get<CredentialRecord[]>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = {};
        if (query?.userId) where.userId = query.userId;
        if (query?.projectId) where.projectId = query.projectId;
        if (query?.category) where.category = { contains: query.category, mode: 'insensitive' };
        if (query?.search) {
          where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const creds = await prisma.credential.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        const mapped: CredentialRecord[] = creds.map(c => ({
          id: c.id,
          projectId: c.projectId,
          userId: c.userId,
          title: c.title,
          category: c.category,
          categoryBg: c.categoryBg || 'bg-[#DCFCE7] text-[#15803D]',
          addedOn: c.addedOn,
          fields: (Array.isArray(c.fields) ? c.fields : []) as unknown as CredentialField[],
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }));

        apiCache.set(cacheKey, mapped, 300, ['credentials']);
        return mapped;
      } catch (err) {
        console.warn('Prisma credentials fetch failed, fallback to memory:', err);
      }
    }

    let res = [...this.memoryCredentials];
    if (query?.userId) {
      res = res.filter(c => c.userId === query.userId);
    }
    if (query?.projectId) {
      res = res.filter(c => c.projectId === query.projectId);
    }
    if (query?.category) {
      res = res.filter(c => c.category.toLowerCase().includes(query.category!.toLowerCase()));
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      res = res.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    apiCache.set(cacheKey, res, 300, ['credentials']);
    return res;
  }

  async getCredentialById(id: string, userId?: string): Promise<CredentialRecord | null> {
    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = { id };
        if (userId) where.userId = userId;
        const c = await prisma.credential.findFirst({ where });
        if (c) {
          return {
            id: c.id,
            projectId: c.projectId,
            userId: c.userId,
            title: c.title,
            category: c.category,
            categoryBg: c.categoryBg || 'bg-[#DCFCE7] text-[#15803D]',
            addedOn: c.addedOn,
            fields: (Array.isArray(c.fields) ? c.fields : []) as unknown as CredentialField[],
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma getCredentialById failed:', err);
      }
    }

    const found = this.memoryCredentials.find(c => c.id === id && (!userId || c.userId === userId));
    return found || null;
  }

  async createCredential(data: Partial<CredentialRecord>): Promise<CredentialRecord> {
    apiCache.invalidateTag('credentials');
    if (this.isPostgresConfigured() && data.projectId && data.userId) {
      try {
        const cred = await prisma.credential.create({
          data: {
            projectId: data.projectId,
            userId: data.userId,
            title: data.title || 'Untitled Credential',
            category: data.category || 'API Key & Secret',
            categoryBg: data.categoryBg || 'bg-[#DCFCE7] text-[#15803D]',
            addedOn: data.addedOn || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            fields: (data.fields || []) as unknown as Prisma.InputJsonValue,
          },
        });
        return {
          id: cred.id,
          projectId: cred.projectId,
          userId: cred.userId,
          title: cred.title,
          category: cred.category,
          categoryBg: cred.categoryBg || 'bg-[#DCFCE7] text-[#15803D]',
          addedOn: cred.addedOn,
          fields: (Array.isArray(cred.fields) ? cred.fields : []) as unknown as CredentialField[],
          createdAt: cred.createdAt.toISOString(),
          updatedAt: cred.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createCredential failed, fallback to memory:', err);
      }
    }

    const newCred: CredentialRecord = {
      id: `c-${Date.now()}`,
      projectId: data.projectId,
      userId: data.userId,
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

  async updateCredential(id: string, data: Partial<CredentialRecord>, userId?: string): Promise<CredentialRecord | null> {
    apiCache.invalidateTag('credentials');
    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = { id };
        if (userId) where.userId = userId;
        const exists = await prisma.credential.findFirst({ where });
        if (!exists) return null;

        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.categoryBg !== undefined) updateData.categoryBg = data.categoryBg;
        if (data.fields !== undefined) updateData.fields = data.fields as unknown as Prisma.InputJsonValue;

        const updated = await prisma.credential.update({
          where: { id },
          data: updateData,
        });

        return {
          id: updated.id,
          projectId: updated.projectId,
          userId: updated.userId,
          title: updated.title,
          category: updated.category,
          categoryBg: updated.categoryBg || 'bg-[#DCFCE7] text-[#15803D]',
          addedOn: updated.addedOn,
          fields: (Array.isArray(updated.fields) ? updated.fields : []) as unknown as CredentialField[],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateCredential failed:', err);
      }
    }

    const index = this.memoryCredentials.findIndex(c => c.id === id && (!userId || c.userId === userId));
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

  async deleteCredential(id: string, userId?: string): Promise<boolean> {
    apiCache.invalidateTag('credentials');
    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = { id };
        if (userId) where.userId = userId;
        const exists = await prisma.credential.findFirst({ where });
        if (!exists) return false;

        await prisma.credential.delete({ where: { id } });
        return true;
      } catch (err) {
        console.warn('Prisma deleteCredential failed:', err);
      }
    }

    const index = this.memoryCredentials.findIndex(c => c.id === id && (!userId || c.userId === userId));
    if (index === -1) return false;
    this.memoryCredentials.splice(index, 1);
    return true;
  }

  // --- NOTE METHODS ---
  async getAllNotes(query?: { projectId?: string; search?: string; userId?: string }): Promise<NoteRecord[]> {
    const cacheKey = `notes:list:${query?.projectId || ''}:${query?.search || ''}:${query?.userId || ''}`;
    const cached = apiCache.get<NoteRecord[]>(cacheKey);
    if (cached) return cached;

    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = {};
        if (query?.userId) where.userId = query.userId;
        if (query?.projectId) where.projectId = query.projectId;
        if (query?.search) {
          where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { excerpt: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const notes = await prisma.note.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        const mapped: NoteRecord[] = notes.map(n => ({
          id: n.id,
          projectId: n.projectId,
          userId: n.userId,
          title: n.title,
          excerpt: n.excerpt,
          date: n.date,
          updated: n.updated,
          sections: (Array.isArray(n.sections) ? n.sections : []) as unknown as NoteSection[],
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        }));

        apiCache.set(cacheKey, mapped, 300, ['notes']);
        return mapped;
      } catch (err) {
        console.warn('Prisma notes fetch failed, fallback to memory:', err);
      }
    }

    let res = [...this.memoryNotes];
    if (query?.userId) {
      res = res.filter(n => n.userId === query.userId);
    }
    if (query?.projectId) {
      res = res.filter(n => n.projectId === query.projectId);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      res = res.filter(n => n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q));
    }
    apiCache.set(cacheKey, res, 300, ['notes']);
    return res;
  }

  async getNoteById(id: string, userId?: string): Promise<NoteRecord | null> {
    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = { id };
        if (userId) where.userId = userId;
        const n = await prisma.note.findFirst({ where });
        if (n) {
          return {
            id: n.id,
            projectId: n.projectId,
            userId: n.userId,
            title: n.title,
            excerpt: n.excerpt,
            date: n.date,
            updated: n.updated,
            sections: (Array.isArray(n.sections) ? n.sections : []) as unknown as NoteSection[],
            createdAt: n.createdAt.toISOString(),
            updatedAt: n.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma getNoteById failed:', err);
      }
    }

    const found = this.memoryNotes.find(n => n.id === id && (!userId || n.userId === userId));
    return found || null;
  }

  async createNote(data: Partial<NoteRecord>): Promise<NoteRecord> {
    apiCache.invalidateTag('notes');
    if (this.isPostgresConfigured() && data.projectId && data.userId) {
      try {
        const note = await prisma.note.create({
          data: {
            projectId: data.projectId,
            userId: data.userId,
            title: data.title || 'Untitled Note',
            excerpt: data.excerpt || 'New project note created.',
            date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            updated: 'Just now',
            sections: (data.sections || [
              {
                heading: '1. Note Content',
                items: [data.excerpt || 'Project note details and specifications.'],
              },
            ]) as unknown as Prisma.InputJsonValue,
          },
        });

        return {
          id: note.id,
          projectId: note.projectId,
          userId: note.userId,
          title: note.title,
          excerpt: note.excerpt,
          date: note.date,
          updated: note.updated,
          sections: (Array.isArray(note.sections) ? note.sections : []) as unknown as NoteSection[],
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createNote failed, fallback to memory:', err);
      }
    }

    const newNote: NoteRecord = {
      id: `n-${Date.now()}`,
      projectId: data.projectId,
      userId: data.userId,
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

  async updateNote(id: string, data: Partial<NoteRecord>, userId?: string): Promise<NoteRecord | null> {
    apiCache.invalidateTag('notes');
    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = { id };
        if (userId) where.userId = userId;
        const exists = await prisma.note.findFirst({ where });
        if (!exists) return null;

        const updateData: Record<string, unknown> = { updated: 'Just now' };
        if (data.title !== undefined) updateData.title = data.title;
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
        if (data.sections !== undefined) updateData.sections = data.sections as unknown as Prisma.InputJsonValue;

        const updated = await prisma.note.update({
          where: { id },
          data: updateData,
        });

        return {
          id: updated.id,
          projectId: updated.projectId,
          userId: updated.userId,
          title: updated.title,
          excerpt: updated.excerpt,
          date: updated.date,
          updated: updated.updated,
          sections: (Array.isArray(updated.sections) ? updated.sections : []) as unknown as NoteSection[],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateNote failed:', err);
      }
    }

    const index = this.memoryNotes.findIndex(n => n.id === id && (!userId || n.userId === userId));
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

  async deleteNote(id: string, userId?: string): Promise<boolean> {
    apiCache.invalidateTag('notes');
    if (this.isPostgresConfigured()) {
      try {
        const where: Record<string, unknown> = { id };
        if (userId) where.userId = userId;
        const exists = await prisma.note.findFirst({ where });
        if (!exists) return false;

        await prisma.note.delete({ where: { id } });
        return true;
      } catch (err) {
        console.warn('Prisma deleteNote failed:', err);
      }
    }

    const index = this.memoryNotes.findIndex(n => n.id === id && (!userId || n.userId === userId));
    if (index === -1) return false;
    this.memoryNotes.splice(index, 1);
    return true;
  }
}

export const db = new DatabaseStore();
