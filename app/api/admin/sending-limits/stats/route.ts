import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total sent today across all users
    const limits = await prisma.emailSendingLimit.findMany();
    const totalSentToday = limits.reduce((sum, limit) => sum + limit.emailsSentToday, 0);

    // Count users at their daily limit
    const usersAtLimit = limits.filter(
      limit => limit.emailsSentToday >= limit.dailyLimit
    ).length;

    // Count blocked users (sending disabled)
    const blockedUsers = limits.filter(limit => !limit.isSendingEnabled).length;

    // Count violations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const violationsToday = await prisma.sendingLimitViolation.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Average sending per user
    const avgSendingPerUser = limits.length > 0
      ? Math.round(totalSentToday / limits.length)
      : 0;

    return NextResponse.json({
      total_sent_today: totalSentToday,
      users_at_limit: usersAtLimit,
      blocked_users: blockedUsers,
      violations_today: violationsToday,
      avg_sending_per_user: avgSendingPerUser,
      total_users_with_limits: limits.length,
    });
  } catch (error) {
    console.error('Failed to fetch sending limit stats:', error);
    return NextResponse.json({ error: 'Failed to fetch sending limit stats' }, { status: 500 });
  }
}
