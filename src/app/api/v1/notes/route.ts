import { NextRequest } from 'next/server';
import { apiHandler, getAuthUserOptional } from '@/lib/api/middleware/middleware';
import { successResponse } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const authUser = getAuthUserOptional(req);
  const projectId = url.searchParams.get('projectId') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const notes = await db.getAllNotes({ projectId, search, userId: authUser?.userId });
  return successResponse(notes, 200, { total: notes.length });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const authUser = getAuthUserOptional(req);
  const body = await req.json();

  const newNote = await db.createNote({
    projectId: body.projectId || undefined,
    userId: authUser?.userId,
    title: body.title,
    excerpt: body.excerpt,
    date: body.date,
    sections: body.sections,
  });

  return successResponse(newNote, 201);
});
