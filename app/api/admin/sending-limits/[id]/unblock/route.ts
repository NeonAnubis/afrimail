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

    const { id } = await params;

    const limit = await prisma.emailSendingLimit.update({
      where: { id },
      data: {
        isSendingEnabled: true,
        customLimitReason: null,
        emailsSentToday: 0,
        emailsSentThisHour: 0,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'sending_limit_unblocked',
        adminEmail: currentUser.email,
        targetUserEmail: limit.userId,
        details: `Sending limit unblocked and counters reset`,
      },
    });

    return NextResponse.json({
      success: true,
      id: limit.id,
      is_sending_enabled: limit.isSendingEnabled,
    });
  } catch (error) {
    console.error('Failed to unblock sending limit:', error);
    return NextResponse.json({ error: 'Failed to unblock sending limit' }, { status: 500 });
  }
}
