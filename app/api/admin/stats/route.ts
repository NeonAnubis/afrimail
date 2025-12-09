import { NextResponse } from 'next/server';
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

    // Get user counts
    const [totalUsers, activeUsers, suspendedUsers, totalDomains] = await Promise.all([
      prisma.usersExtended.count(),
      prisma.usersExtended.count({ where: { isSuspended: false } }),
      prisma.usersExtended.count({ where: { isSuspended: true } }),
      prisma.mailDomain.count({ where: { isActive: true } }),
    ]);

    // Get storage stats (placeholder - would need Mailcow API for real data)
    const storageStats = {
      total_allocated: 100 * 1024 * 1024 * 1024, // 100GB example
      total_used: 25 * 1024 * 1024 * 1024, // 25GB example
      average_usage_percent: 25,
      users_over_90_percent: 0,
    };

    // Get recent activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activeIn7Days, activeIn30Days, neverLoggedIn] = await Promise.all([
      prisma.usersExtended.count({
        where: { lastLogin: { gte: sevenDaysAgo } },
      }),
      prisma.usersExtended.count({
        where: { lastLogin: { gte: thirtyDaysAgo } },
      }),
      prisma.usersExtended.count({
        where: { lastLogin: null },
      }),
    ]);

    return NextResponse.json({
      total_users: totalUsers,
      active_users: activeUsers,
      suspended_users: suspendedUsers,
      total_domains: totalDomains,
      storage: storageStats,
      activity: {
        active_last_7_days: activeIn7Days,
        active_last_30_days: activeIn30Days,
        never_logged_in: neverLoggedIn,
      },
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
