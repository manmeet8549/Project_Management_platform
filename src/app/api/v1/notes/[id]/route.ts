import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/middleware/middleware';
import { successResponse } from '@/lib/api/errors/errors';
import { NotFoundError } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const note = await db.getNoteById(id);
  if (!note) throw new NotFoundError('Note not found');
  return successResponse(note, 200);
});

export const PATCH = apiHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const body = await req.json();

  const updated = await db.updateNote(id, body);
  if (!updated) throw new NotFoundError('Note not found');

  return successResponse(updated, 200);
});

export const DELETE = apiHandler(async (_req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const success = await db.deleteNote(id);
  if (!success) throw new NotFoundError('Note not found');

  return successResponse({ deleted: true }, 200);
});
