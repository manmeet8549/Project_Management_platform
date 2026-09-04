import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/middleware/middleware';
import { successResponse } from '@/lib/api/errors/errors';
import { db } from '@/lib/api/db/db';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || undefined;
  const role = url.searchParams.get('role') || undefined;

  const users = await db.getAllUsers({ search, role });
  return successResponse(users, 200, { total: users.length });
});
