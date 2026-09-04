import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, validateBody } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError } from '@/lib/api/errors/errors';
import { updateTaskSchema } from '@/lib/api/validators/task.schema';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const task = await db.getTaskById(id);
  if (!task) {
    throw new NotFoundError(`Task with ID '${id}' not found`);
  }
  return successResponse(task, 200);
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await validateBody(req, updateTaskSchema);

  const existingTask = await db.getTaskById(id);
  if (!existingTask) {
    throw new NotFoundError(`Task with ID '${id}' not found`);
  }

  if (body.projectId) {
    const project = await db.getProjectById(body.projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID '${body.projectId}' does not exist`);
    }
  }

  if (body.assigneeId) {
    const assignee = await db.getUserById(body.assigneeId);
    if (!assignee) {
      throw new NotFoundError(`User (assignee) with ID '${body.assigneeId}' does not exist`);
    }
  }

  const updatedTask = await db.updateTask(id, body);
  return successResponse(updatedTask, 200);
});

export const DELETE = apiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const deleted = await db.deleteTask(id);
  if (!deleted) {
    throw new NotFoundError(`Task with ID '${id}' not found`);
  }
  return new NextResponse(null, { status: 204 });
});
