import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const user = await prisma.usersExtended.update({
      where: { email: decodedEmail },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'user_unlocked',
        adminEmail: currentUser.email,
        targetUserEmail: decodedEmail,
        details: `User account unlocked`,
      },
    });

    // Check if user is still locked
    const isLocked = user.lockedUntil ? user.lockedUntil > new Date() : false;

    return NextResponse.json({
      success: true,
      email: user.email,
      is_locked: isLocked,
    });
  } catch (error) {
    console.error('Failed to unlock user:', error);
    return NextResponse.json({ error: 'Failed to unlock user' }, { status: 500 });
  }
}
