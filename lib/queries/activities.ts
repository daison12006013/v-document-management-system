import { desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { activities, users } from '@/database/schema';

// Create activity
export async function createActivity(data: {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  description?: string | null;
  metadata?: any;
}) {
  const id = randomUUID();
  await db.insert(activities).values({
    id,
    userId: data.userId || null,
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId || null,
    description: data.description || null,
    metadata: data.metadata || null,
  });
  return db.query.activities.findFirst({
    where: (a, { eq }) => eq(a.id, id),
  });
}

// Get recent activities
export async function getRecentActivities(limit: number = 10) {
  return db.query.activities.findMany({
    limit,
    orderBy: [desc(activities.createdAt)],
    with: {
      user: true,
    },
  });
}

