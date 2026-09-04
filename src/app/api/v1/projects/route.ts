import { NextRequest } from 'next/server';
import { apiHandler, validateBody } from '@/lib/api/middleware/middleware';
import { successResponse } from '@/lib/api/errors/errors';
import { createProjectSchema } from '@/lib/api/validators/project.schema';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const ownerId = url.searchParams.get('ownerId') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const projects = await db.getAllProjects({ category, status, ownerId, search });
  return successResponse(projects, 200, { total: projects.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await validateBody(req, createProjectSchema);

  const newProject = await db.createProject({
    title: body.title,
    description: body.description || '',
    category: body.category,
    status: body.status,
    dueDate: body.dueDate || null,
    ownerId: body.ownerId || 'usr-1',
  });

  return successResponse(newProject, 201);
});
