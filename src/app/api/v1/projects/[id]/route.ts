import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, validateBody, getAuthUserOptional } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError, UnauthorizedError, ForbiddenError } from '@/lib/api/errors/errors';
import { updateProjectSchema } from '@/lib/api/validators/project.schema';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUserOptional(req);
  const { id } = await params;
  const project = await db.getProjectById(id);
  if (!project) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }

  // Cross-tenant protection: if project is owned, only the owner or an admin can access it
  if (authUser?.userId && project.ownerId && project.ownerId !== authUser.userId && authUser.role !== 'ADMIN') {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }

  return successResponse(project, 200);
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const { id } = await params;
  const existingProject = await db.getProjectById(id);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }

  if (existingProject.ownerId && existingProject.ownerId !== authUser.userId && authUser.role !== 'ADMIN') {
    throw new ForbiddenError('You do not have permission to update this project');
  }

  const body = await validateBody(req, updateProjectSchema);
  const updatedProject = await db.updateProject(id, body);
  return successResponse(updatedProject, 200);
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const { id } = await params;
  const existingProject = await db.getProjectById(id);
  if (!existingProject) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }

  if (existingProject.ownerId && existingProject.ownerId !== authUser.userId && authUser.role !== 'ADMIN') {
    throw new ForbiddenError('You do not have permission to delete this project');
  }

  const deleted = await db.deleteProject(id);
  if (!deleted) {
    throw new NotFoundError(`Project with ID '${id}' not found`);
  }
  return new NextResponse(null, { status: 204 });
});
