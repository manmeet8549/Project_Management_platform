import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, validateBody } from '@/lib/api/middleware/middleware';
import { successResponse, NotFoundError, ConflictError } from '@/lib/api/errors/errors';
import { updateUserSchema } from '@/lib/api/validators/user.schema';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await db.getUserById(id);
  if (!user) {
    throw new NotFoundError(`User with ID '${id}' not found`);
  }
  return successResponse(user, 200);
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await validateBody(req, updateUserSchema);

  const existingUser = await db.getUserById(id);
  if (!existingUser) {
    throw new NotFoundError(`User with ID '${id}' not found`);
  }

  if (body.email && body.email !== existingUser.email) {
    const emailCheck = await db.getUserByEmail(body.email);
    if (emailCheck) {
      throw new ConflictError(`Email '${body.email}' is already in use by another user`);
    }
  }

  const updatedUser = await db.updateUser(id, body);
  return successResponse(updatedUser, 200);
});

export const DELETE = apiHandler(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const deleted = await db.deleteUser(id);
  if (!deleted) {
    throw new NotFoundError(`User with ID '${id}' not found`);
  }
  return new NextResponse(null, { status: 204 });
});
