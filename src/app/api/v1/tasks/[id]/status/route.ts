import { NextRequest } from 'next/server';
import { apiHandler, validateBody } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError } from '@/lib/api/errors/errors';
import { updateTaskStatusSchema } from '@/lib/api/validators/task.schema';
import { db } from '@/lib/api/db/db';

export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await validateBody(req, updateTaskStatusSchema);

  const existingTask = await db.getTaskById(id);
  if (!existingTask) {
    throw new NotFoundError(`Task with ID '${id}' not found`);
  }

  const updatedTask = await db.updateTaskStatus(id, body.status);
  return successResponse(updatedTask, 200, {
    previousStatus: existingTask.status,
    newStatus: body.status,
  });
});
