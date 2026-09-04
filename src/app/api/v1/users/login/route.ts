import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { apiHandler, validateBody, generateJwtToken } from '@/lib/api/middleware/middleware';
import { successResponse, UnauthorizedError } from '@/lib/api/errors/errors';
import { loginUserSchema } from '@/lib/api/validators/user.schema';
import { db } from '@/lib/api/db/db';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await validateBody(req, loginUserSchema);

  const user = await db.getUserByEmail(body.email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password credentials');
  }

  const isMatch = await bcrypt.compare(body.password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password credentials');
  }

  const userProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const token = generateJwtToken({
    userId: userProfile.id,
    email: userProfile.email,
    role: userProfile.role,
  });

  return successResponse({ user: userProfile, token }, 200);
});
