import { NextRequest } from 'next/server';
import { apiHandler, getAuthUserOptional } from '@/lib/api/middleware/middleware';
import { successResponse, UnauthorizedError, BadRequestError, ForbiddenError } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) {
    return successResponse([], 200, { total: 0 });
  }

  const projectId = url.searchParams.get('projectId') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search') || undefined;

  // Validate that project belongs to the user if projectId is passed
  if (projectId) {
    const project = await db.getProjectById(projectId);
    if (project && project.ownerId && project.ownerId !== authUser.userId) {
      return successResponse([], 200, { total: 0 });
    }
  }

  const credentials = await db.getAllCredentials({ projectId, category, search, userId: authUser.userId });
  return successResponse(credentials, 200, { total: credentials.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) {
    throw new UnauthorizedError('Authentication required to create credentials');
  }

  const body = await req.json();
  if (!body.projectId) {
    throw new BadRequestError('projectId is required to create a credential');
  }

  const project = await db.getProjectById(body.projectId);
  if (project && project.ownerId && project.ownerId !== authUser.userId) {
    throw new ForbiddenError('You do not have permission to add credentials to this project');
  }

  const newCredential = await db.createCredential({
    projectId: body.projectId,
    userId: authUser.userId,
    title: body.title,
    category: body.category,
    categoryBg: body.categoryBg,
    addedOn: body.addedOn,
    fields: body.fields || [],
  });

  return successResponse(newCredential, 201);
});
