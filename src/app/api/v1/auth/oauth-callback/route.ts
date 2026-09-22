import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { apiHandler, generateJwtToken } from '@/lib/api/middleware/middleware';
import { successResponse, BadRequestError } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim() || email?.split('@')[0] || 'User';

  if (!email) {
    throw new BadRequestError('Email is required for OAuth callback synchronization');
  }

  // Check if user already exists
  let user = await db.getUserByEmail(email);

  if (!user) {
    // Generate secure random placeholder hash for OAuth user
    const randomPass = Math.random().toString(36) + Date.now().toString(36);
    const passwordHash = await bcrypt.hash(randomPass, 10);

    const newUser = await db.createUser({
      name,
      email,
      passwordHash,
      role: 'MEMBER',
    });

    user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      passwordHash,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
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
