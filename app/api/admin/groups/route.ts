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

    const groups = await prisma.userGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    const transformedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || '',
      color: group.color || 'blue',
      member_count: group._count.members,
      created_at: group.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedGroups);
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
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
    const { name, description, color } = body;

    const group = await prisma.userGroup.create({
      data: {
        name,
        description,
        color: color || 'blue',
      },
    });

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description || '',
      color: group.color || 'blue',
      member_count: 0,
      created_at: group.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
