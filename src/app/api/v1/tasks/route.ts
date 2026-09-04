import { NextRequest } from 'next/server';
import { apiHandler, validateBody } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError } from '@/lib/api/errors/errors';
import { createTaskSchema } from '@/lib/api/validators/task.schema';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId') || undefined;
  const assigneeId = url.searchParams.get('assigneeId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const priority = url.searchParams.get('priority') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const tasks = await db.getAllTasks({ projectId, assigneeId, status, priority, search });
  return successResponse(tasks, 200, { total: tasks.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await validateBody(req, createTaskSchema);

  const project = await db.getProjectById(body.projectId);
  if (!project) {
    throw new NotFoundError(`Project with ID '${body.projectId}' does not exist`);
  }

  if (body.assigneeId) {
    const assignee = await db.getUserById(body.assigneeId);
    if (!assignee) {
      throw new NotFoundError(`User (assignee) with ID '${body.assigneeId}' does not exist`);
    }
  }

  const newTask = await db.createTask({
    title: body.title,
    description: body.description || '',
    status: body.status,
    priority: body.priority,
    projectId: body.projectId,
    assigneeId: body.assigneeId || null,
    dueDate: body.dueDate || null,
  });

  return successResponse(newTask, 201);
});
