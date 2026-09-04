import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, validateBody } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError } from '@/lib/api/errors/errors';
import { updateProjectSchema } from '@/lib/api/validators/project.schema';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const project = await db.getProjectById(id);
  if (!project) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }
  return successResponse(project, 200);
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await validateBody(req, updateProjectSchema);

  const existingProject = await db.getProjectById(id);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }

  const updatedProject = await db.updateProject(id, body);
  return successResponse(updatedProject, 200);
});

export const DELETE = apiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const deleted = await db.deleteProject(id);
  if (!deleted) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }
  return new NextResponse(null, { status: 204 });
});
