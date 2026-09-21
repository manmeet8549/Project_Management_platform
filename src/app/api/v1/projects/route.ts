import { NextRequest } from 'next/server';
import { apiHandler, validateBody, getAuthUserOptional } from '@/lib/api/middleware/middleware';
import { successResponse, UnauthorizedError } from '@/lib/api/errors/errors';
import { createProjectSchema } from '@/lib/api/validators/project.schema';
import { db } from '@/lib/api/db/db';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) {
    return successResponse([], 200, { total: 0 });
  }

  const category = url.searchParams.get('category') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;

  // Strict tenant scoping: Each user ONLY sees their own projects
  // Admins can optionally inspect another user's projects via ?ownerId=
  const requestedOwnerId = url.searchParams.get('ownerId');
  const ownerId = (authUser.role === 'ADMIN' && requestedOwnerId)
    ? requestedOwnerId
    : authUser.userId;

  const projects = await db.getAllProjects({ category, status, ownerId, search });
  return successResponse(projects, 200, { total: projects.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) {
    throw new UnauthorizedError('Authentication required to create a project');
  }
  const body = await validateBody(req, createProjectSchema);

  const newProject = await db.createProject({
    title: body.title,
    description: body.description || '',
    category: body.category,
    status: body.status,
    dueDate: body.dueDate || null,
    ownerId: authUser.userId,
  });

  return successResponse(newProject, 201);
});
