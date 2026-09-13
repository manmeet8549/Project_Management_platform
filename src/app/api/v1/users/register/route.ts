import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { apiHandler, validateBody, generateJwtToken } from '@/lib/api/middleware/middleware';
import { successResponse, ConflictError } from '@/lib/api/errors/errors';
import { registerUserSchema } from '@/lib/api/validators/user.schema';
import { db } from '@/lib/api/db/db';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await validateBody(req, registerUserSchema);

  const cleanEmail = body.email.trim().toLowerCase();
  const cleanPassword = body.password.trim();
  const cleanName = body.name.trim();

  const existingUser = await db.getUserByEmail(cleanEmail);
  if (existingUser) {
    throw new ConflictError(`User with email '${cleanEmail}' already exists`);
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 6);
  const newUser = await db.createUser({
    name: cleanName,
    email: cleanEmail,
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
