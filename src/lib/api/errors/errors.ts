import { NextResponse } from 'next/server';

export interface FieldErrorDetail {
  field: string;
  issue: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: FieldErrorDetail[];

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_SERVER_ERROR', details?: FieldErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: FieldErrorDetail[]) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access token') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden resource access') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Requested resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: FieldErrorDetail[]) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: Record<string, unknown>,
  cacheTtlSeconds: number = 5
) {
  const body: { success: true; data: T; meta?: Record<string, unknown> } = {
    success: true,
    data,
  };
  if (meta) {
    body.meta = meta;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cacheTtlSeconds > 0) {
    headers['Cache-Control'] = `public, s-maxage=${cacheTtlSeconds}, stale-while-revalidate=15`;
  }

  return NextResponse.json(body, { status: statusCode, headers });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
          statusCode: error.statusCode,
          details: error.details || undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled Server Error:', error);
  const message = error instanceof Error ? error.message : 'An unexpected server error occurred';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}
