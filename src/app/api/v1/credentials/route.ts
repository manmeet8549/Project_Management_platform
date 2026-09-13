import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/middleware/middleware';
import { successResponse } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const credentials = await db.getAllCredentials({ projectId, category, search });
  return successResponse(credentials, 200, { total: credentials.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();

  const newCredential = await db.createCredential({
    projectId: body.projectId || undefined,
    title: body.title,
    category: body.category,
    categoryBg: body.categoryBg,
    addedOn: body.addedOn,
    fields: body.fields || [],
  });

  return successResponse(newCredential, 201);
});
