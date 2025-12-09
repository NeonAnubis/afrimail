import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { user_id, user_ids } = body;

    // Support both single user and multiple users
    const userIdsToAdd = user_ids || (user_id ? [user_id] : []);

    if (userIdsToAdd.length === 0) {
      return NextResponse.json(
        { error: 'User ID(s) required' },
        { status: 400 }
      );
    }

    const memberships = userIdsToAdd.map((uid: string) => ({
      groupId,
      userId: uid,
    }));

    const result = await prisma.userGroupMember.createMany({
      data: memberships,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      added_count: result.count,
    });
  } catch (error) {
    console.error('Failed to add members:', error);
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;
    const body = await request.json();
    const { user_id, user_ids } = body;

    // Support both single user and multiple users
    const userIdsToRemove = user_ids || (user_id ? [user_id] : []);

    if (userIdsToRemove.length === 0) {
      return NextResponse.json(
        { error: 'User ID(s) required' },
        { status: 400 }
      );
    }

    const result = await prisma.userGroupMember.deleteMany({
      where: {
        groupId,
        userId: { in: userIdsToRemove },
      },
    });

    return NextResponse.json({
      success: true,
      removed_count: result.count,
    });
  } catch (error) {
    console.error('Failed to remove members:', error);
    return NextResponse.json({ error: 'Failed to remove members' }, { status: 500 });
  }
}
