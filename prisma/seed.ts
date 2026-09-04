import { PrismaClient, Role, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Supabase PostgreSQL database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users
  const user1 = await prisma.user.upsert({
    where: { email: 'manmeet@example.com' },
    update: {},
    create: {
      name: 'Manmeet Singh',
      email: 'manmeet@example.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      passwordHash,
      role: Role.MANAGER,
    },
  });

  // 2. Seed Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'E-Commerce Platform Redesign',
      description: 'Modernizing frontend architecture and checkout flow.',
      category: 'Design & Dev',
      status: ProjectStatus.in_progress,
      dueDate: new Date('2026-10-15'),
      ownerId: user1.id,
    },
  });

  // 3. Seed Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Supabase PostgreSQL Schema',
        description: 'Define tables, foreign keys, and indexes.',
        status: TaskStatus.done,
        priority: TaskPriority.high,
        projectId: project1.id,
        assigneeId: user1.id,
        dueDate: new Date('2026-09-01'),
      },
      {
        title: 'Configure Connection Pooler & Prisma Client',
        description: 'Set pgBouncer connection strings for high performance.',
        status: TaskStatus.in_progress,
        priority: TaskPriority.urgent,
        projectId: project1.id,
        assigneeId: user2.id,
        dueDate: new Date('2026-09-10'),
      },
    ],
  });

  console.log('✅ Database seeding complete!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
