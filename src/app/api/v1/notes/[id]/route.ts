import { NextRequest } from 'next/server';
import { apiHandler, getAuthUserOptional } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError, UnauthorizedError } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) throw new UnauthorizedError('Authentication required');

  const { id } = await context.params;
  const note = await db.getNoteById(id, authUser.userId);
  if (!note) throw new NotFoundError('Note not found');
  return successResponse(note, 200);
});

export const PATCH = apiHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) throw new UnauthorizedError('Authentication required');

  const { id } = await context.params;
  const body = await req.json();

  const updated = await db.updateNote(id, body, authUser.userId);
  if (!updated) throw new NotFoundError('Note not found or permission denied');

  return successResponse(updated, 200);
});

export const DELETE = apiHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const authUser = getAuthUserOptional(req);
  if (!authUser?.userId) throw new UnauthorizedError('Authentication required');

  const { id } = await context.params;
  const success = await db.deleteNote(id, authUser.userId);
  if (!success) throw new NotFoundError('Note not found or permission denied');

  return successResponse({ deleted: true }, 200);
});
