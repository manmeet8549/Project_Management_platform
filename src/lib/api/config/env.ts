import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional().default('postgresql://postgres:password@localhost:5432/postgres'),
  DIRECT_URL: z.string().optional().default('postgresql://postgres:password@localhost:5432/postgres'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default('https://ceicslawfqwpuzwdkvor.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),
  JWT_SECRET: z.string().default('super-secret-jwt-key-replace-in-production-12345'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
});
