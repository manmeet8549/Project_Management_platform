import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { apiHandler, validateBody, generateJwtToken } from '@/lib/api/middleware/middleware';
import { successResponse, ConflictError } from '@/lib/api/errors/errors';
import { registerUserSchema } from '@/lib/api/validators/user.schema';
import { db } from '@/lib/api/db/db';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await validateBody(req, registerUserSchema);

  const existingUser = await db.getUserByEmail(body.email);
  if (existingUser) {
    throw new ConflictError(`User with email '${body.email}' already exists`);
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const newUser = await db.createUser({
    name: body.name,
    email: body.email,
    passwordHash,
    role: body.role,
  });

  const token = generateJwtToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  return successResponse({ user: newUser, token }, 201);
});
