import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { BadRequestError, ValidationError, UnauthorizedError, errorResponse, FieldErrorDetail } from '../errors/errors';

export function parseZodError(error: z.ZodError): FieldErrorDetail[] {
  return error.issues.map(err => ({
    field: err.path.join('.') || 'body',
    issue: err.message,
  }));
}

export async function validateBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    throw new BadRequestError('Invalid JSON payload in request body');
  }

  const result = schema.safeParse(bodyJson);
  if (!result.success) {
    const details = parseZodError(result.error);
    throw new ValidationError('Validation failed for request body', details);
  }

  return result.data;
}

export function validateQuery<T>(req: NextRequest, schema: z.ZodSchema<T>): T {
  const url = new URL(req.url);
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    queryObj[key] = val;
  });

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    const details = parseZodError(result.error);
    throw new ValidationError('Validation failed for query parameters', details);
  }

  return result.data;
}

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateJwtToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
}

export function verifyAuthToken(req: NextRequest): JwtUserPayload {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header. Expected Bearer token');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    return decoded;
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}

export function apiHandler<T = unknown>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
