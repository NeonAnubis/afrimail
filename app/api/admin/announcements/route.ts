import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const transformedAnnouncements = announcements.map(a => ({
      id: a.id,
      title: a.title,
      message: a.message,
      target_group: a.targetGroup,
      priority: a.priority,
      published: a.published,
      published_at: a.publishedAt?.toISOString() || null,
      expires_at: a.expiresAt?.toISOString() || null,
      created_by: a.createdBy,
      created_at: a.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedAnnouncements);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, target_group, priority, expires_at } = body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        targetGroup: target_group || 'all',
        priority: priority || 'normal',
        expiresAt: expires_at ? new Date(expires_at) : null,
        createdBy: currentUser.id,
      },
    });

    return NextResponse.json({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      target_group: announcement.targetGroup,
      priority: announcement.priority,
      published: announcement.published,
      published_at: announcement.publishedAt?.toISOString() || null,
      expires_at: announcement.expiresAt?.toISOString() || null,
      created_by: announcement.createdBy,
      created_at: announcement.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
