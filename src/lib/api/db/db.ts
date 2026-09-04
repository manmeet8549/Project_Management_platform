import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

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

const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

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
    {
      id: 'usr-2',
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      passwordHash: defaultPasswordHash,
      role: 'MANAGER',
      createdAt: '2026-08-05T12:00:00.000Z',
      updatedAt: '2026-08-05T12:00:00.000Z',
    },
    {
      id: 'usr-3',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      createdAt: '2026-08-10T14:30:00.000Z',
      updatedAt: '2026-08-10T14:30:00.000Z',
    },
  ];

  private memoryProjects: ProjectRecord[] = [
    {
      id: 'proj-1',
      title: 'E-Commerce Platform Redesign',
      description: 'Modernizing frontend architecture and improving core checkout metrics.',
      category: 'Design & Dev',
      status: 'in-progress',
      dueDate: '2026-10-15',
      ownerId: 'usr-1',
      createdAt: '2026-08-15T09:00:00.000Z',
      updatedAt: '2026-08-20T11:00:00.000Z',
    },
    {
      id: 'proj-2',
      title: 'Mobile App API Integration',
      description: 'REST API backend endpoints connecting iOS & Android apps to database.',
      category: 'Backend',
      status: 'planning',
      dueDate: '2026-11-30',
      ownerId: 'usr-2',
      createdAt: '2026-08-18T14:00:00.000Z',
      updatedAt: '2026-08-18T14:00:00.000Z',
    },
  ];

  private memoryTasks: TaskRecord[] = [
    {
      id: 'tsk-1',
      title: 'Design Database Schema for User Auth',
      description: 'Define PostgreSQL/SQLite tables for user accounts, roles, and refresh tokens.',
      status: 'done',
      priority: 'high',
      projectId: 'proj-1',
      assigneeId: 'usr-1',
      dueDate: '2026-09-01',
      createdAt: '2026-08-20T09:30:00.000Z',
      updatedAt: '2026-09-01T16:00:00.000Z',
    },
    {
      id: 'tsk-2',
      title: 'Implement JWT Token Authentication Middleware',
      description: 'Add verification logic to ensure protected routes inspect Bearer headers.',
      status: 'in-progress',
      priority: 'urgent',
      projectId: 'proj-1',
      assigneeId: 'usr-3',
      dueDate: '2026-09-10',
      createdAt: '2026-08-22T10:00:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z',
    },
    {
      id: 'tsk-3',
      title: 'Setup OpenAPI Swagger Documentation',
      description: 'Document endpoints, request bodies, and error response schemas.',
      status: 'todo',
      priority: 'medium',
      projectId: 'proj-2',
      assigneeId: 'usr-2',
      dueDate: '2026-09-20',
      createdAt: '2026-08-25T15:00:00.000Z',
      updatedAt: '2026-08-25T15:00:00.000Z',
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
    if (this.isPostgresConfigured()) {
      try {
        const roleFilter = (query?.role === 'ADMIN' || query?.role === 'MANAGER' || query?.role === 'MEMBER') ? (query.role as RoleEnum) : undefined;
        const users = (await prisma.user.findMany({
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

        return users.map((u: DbUserRow) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as UserRecord['role'],
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        }));
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
    return result.map(sanitizeUser);
  }

  async getUserById(id: string): Promise<SafeUserRecord | null> {
    if (this.isPostgresConfigured()) {
      try {
        const user = (await prisma.user.findUnique({ where: { id } })) as unknown as DbUserRow | null;
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRecord['role'],
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma fetch failed, using fallback store:', err);
      }
    }

    const user = this.memoryUsers.find(u => u.id === id);
    if (!user) return null;
    return sanitizeUser(user);
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    if (this.isPostgresConfigured()) {
      try {
        const user = (await prisma.user.findUnique({ where: { email: email.toLowerCase() } })) as unknown as DbUserRow | null;
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
    if (this.isPostgresConfigured()) {
      try {
        const roleVal: RoleEnum | undefined = (data.role === 'ADMIN' || data.role === 'MANAGER' || data.role === 'MEMBER') ? data.role : undefined;
        const user = (await prisma.user.update({
          where: { id },
          data: {
            name: data.name,
            email: data.email?.toLowerCase(),
            role: roleVal,
          },
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
    if (this.isPostgresConfigured()) {
      try {
        await prisma.user.delete({ where: { id } });
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

        return projects.map((p: DbProjectRow) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          status: p.status === 'in_progress' ? 'in-progress' : p.status === 'on_hold' ? 'on-hold' : p.status,
          dueDate: p.dueDate ? p.dueDate.toISOString().split('T')[0] : null,
          ownerId: p.ownerId,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
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
    return result;
  }

  async getProjectById(id: string) {
    if (this.isPostgresConfigured()) {
      try {
        const project = (await prisma.project.findUnique({
          where: { id },
          include: { tasks: true },
        })) as unknown as DbProjectRow | null;
        if (!project) return null;
        const projectTasks = project.tasks || [];
        const taskStats = {
          total: projectTasks.length,
          todo: projectTasks.filter(t => t.status === 'todo').length,
          inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
          done: projectTasks.filter(t => t.status === 'done' || t.status === 'completed').length,
        };
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          status: project.status === 'in_progress' ? 'in-progress' : project.status === 'on_hold' ? 'on-hold' : project.status,
          dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
          ownerId: project.ownerId,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          taskStats,
        };
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
    return {
      ...project,
      taskStats,
    };
  }

  async createProject(data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    if (this.isPostgresConfigured()) {
      try {
        const mappedStatus: ProjectStatusEnum = (data.status === 'in-progress' ? 'in_progress' : data.status === 'on-hold' ? 'on_hold' : data.status) as ProjectStatusEnum;
        const project = (await prisma.project.create({
          data: {
            title: data.title,
            description: data.description || '',
            category: data.category,
            status: mappedStatus,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            ownerId: data.ownerId,
          },
        })) as unknown as DbProjectRow;
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          status: data.status,
          dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
          ownerId: project.ownerId,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        };
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
    return newProject;
  }

  async updateProject(id: string, data: Partial<Omit<ProjectRecord, 'id' | 'createdAt'>>) {
    if (this.isPostgresConfigured()) {
      try {
        const mappedStatus: ProjectStatusEnum | undefined = data.status ? (data.status === 'in-progress' ? 'in_progress' : data.status === 'on-hold' ? 'on_hold' : data.status) as ProjectStatusEnum : undefined;
        const project = (await prisma.project.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            category: data.category,
            status: mappedStatus,
            dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
            ownerId: data.ownerId,
          },
        })) as unknown as DbProjectRow;
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          status: data.status || (project.status === 'in_progress' ? 'in-progress' : project.status === 'on_hold' ? 'on-hold' : project.status),
          dueDate: project.dueDate ? project.dueDate.toISOString().split('T')[0] : null,
          ownerId: project.ownerId,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        };
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
    if (this.isPostgresConfigured()) {
      try {
        await prisma.project.delete({ where: { id } });
        return true;
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
    if (this.isPostgresConfigured()) {
      try {
        const taskStatusMap: Record<string, TaskStatusEnum> = {
          'todo': 'todo',
          'in-progress': 'in_progress',
          'done': 'done',
          'completed': 'completed',
        };
        const mappedStatus = query?.status ? taskStatusMap[query.status] : undefined;
        const priorityFilter = (query?.priority === 'low' || query?.priority === 'medium' || query?.priority === 'high' || query?.priority === 'urgent') ? (query.priority as TaskPriorityEnum) : undefined;

        const tasks = (await prisma.task.findMany({
          where: {
            AND: [
              query?.projectId ? { projectId: query.projectId } : {},
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
          include: {
            project: { select: { id: true, title: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        })) as unknown as DbTaskRow[];

        return tasks.map((t: DbTaskRow) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status === 'in_progress' ? 'in-progress' : t.status,
          priority: t.priority,
          projectId: t.projectId,
          assigneeId: t.assigneeId,
          dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          project: t.project,
          assignee: t.assignee,
        }));
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

    return result.map(task => {
      const project = this.memoryProjects.find(p => p.id === task.projectId);
      const assigneeRaw = task.assigneeId ? this.memoryUsers.find(u => u.id === task.assigneeId) : null;
      const assignee = assigneeRaw ? { id: assigneeRaw.id, name: assigneeRaw.name, email: assigneeRaw.email } : null;
      return {
        ...task,
        project: project ? { id: project.id, title: project.title } : null,
        assignee,
      };
    });
  }

  async getTaskById(id: string) {
    if (this.isPostgresConfigured()) {
      try {
        const task = (await prisma.task.findUnique({
          where: { id },
          include: {
            project: { select: { id: true, title: true, category: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
        })) as unknown as DbTaskRow | null;
        if (!task) return null;
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status === 'in_progress' ? 'in-progress' : task.status,
          priority: task.priority,
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          project: task.project,
          assignee: task.assignee,
        };
      } catch (err) {
        console.warn('Prisma task by ID fetch failed:', err);
      }
    }

    const task = this.memoryTasks.find(t => t.id === id);
    if (!task) return null;
    const project = this.memoryProjects.find(p => p.id === task.projectId);
    const assigneeRaw = task.assigneeId ? this.memoryUsers.find(u => u.id === task.assigneeId) : null;
    const assignee = assigneeRaw ? { id: assigneeRaw.id, name: assigneeRaw.name, email: assigneeRaw.email } : null;

    return {
      ...task,
      project: project ? { id: project.id, title: project.title, category: project.category } : null,
      assignee,
    };
  }

  async createTask(data: Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    if (this.isPostgresConfigured()) {
      try {
        const mappedStatus: TaskStatusEnum = (data.status === 'in-progress' ? 'in_progress' : data.status) as TaskStatusEnum;
        const priorityVal: TaskPriorityEnum = data.priority;
        const task = (await prisma.task.create({
          data: {
            title: data.title,
            description: data.description || '',
            status: mappedStatus,
            priority: priorityVal,
            projectId: data.projectId,
            assigneeId: data.assigneeId || null,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          },
        })) as unknown as DbTaskRow;
        return this.getTaskById(task.id);
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
    if (this.isPostgresConfigured()) {
      try {
        const mappedStatus: TaskStatusEnum | undefined = data.status ? (data.status === 'in-progress' ? 'in_progress' : data.status) as TaskStatusEnum : undefined;
        const priorityVal: TaskPriorityEnum | undefined = data.priority;
        await prisma.task.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            status: mappedStatus,
            priority: priorityVal,
            projectId: data.projectId,
            assigneeId: data.assigneeId,
            dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
          },
        });
        return this.getTaskById(id);
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
    if (this.isPostgresConfigured()) {
      try {
        const mappedStatus: TaskStatusEnum = (status === 'in-progress' ? 'in_progress' : status) as TaskStatusEnum;
        await prisma.task.update({
          where: { id },
          data: {
            status: mappedStatus,
          },
        });
        return this.getTaskById(id);
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
    if (this.isPostgresConfigured()) {
      try {
        await prisma.task.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    }

    const index = this.memoryTasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.memoryTasks.splice(index, 1);
    return true;
  }
}

export const db = new DatabaseStore();
