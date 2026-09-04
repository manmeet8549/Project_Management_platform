import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(2, 'Project title must be at least 2 characters'),
  description: z.string().optional().default(''),
  category: z.string().min(1, 'Category cannot be empty'),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['planning', 'in-progress', 'completed', 'on-hold']).default('planning'),
  ownerId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(2, 'Project title must be at least 2 characters').optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category cannot be empty').optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['planning', 'in-progress', 'completed', 'on-hold']).optional(),
  ownerId: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
