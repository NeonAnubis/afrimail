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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get user counts with activity stats
    const [
      totalUsers,
      activeLast7Days,
      activeLast30Days,
      neverLoggedIn,
      inactiveLast90Days,
      suspendedUsers,
      lockedUsers,
    ] = await Promise.all([
      prisma.usersExtended.count(),
      prisma.usersExtended.count({
        where: { lastLogin: { gte: sevenDaysAgo } },
      }),
      prisma.usersExtended.count({
        where: { lastLogin: { gte: thirtyDaysAgo } },
      }),
      prisma.usersExtended.count({
        where: { lastLogin: null },
      }),
      prisma.usersExtended.count({
        where: {
          OR: [
            { lastLogin: { lt: ninetyDaysAgo } },
            { lastLogin: null, createdAt: { lt: ninetyDaysAgo } },
          ],
        },
      }),
      prisma.usersExtended.count({
        where: { isSuspended: true },
      }),
      prisma.usersExtended.count({
        where: { lockedUntil: { gt: now } },
      }),
    ]);

    // Get recent logins
    const recentLogins = await prisma.usersExtended.findMany({
      where: { lastLogin: { not: null } },
      orderBy: { lastLogin: 'desc' },
      take: 50,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLogin: true,
        isSuspended: true,
        lockedUntil: true,
      },
    });

    // Get users with health issues (never logged in, inactive, locked, etc.)
    const usersWithIssues = await prisma.usersExtended.findMany({
      where: {
        OR: [
          { lastLogin: null },
          { lastLogin: { lt: ninetyDaysAgo } },
          { lockedUntil: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLogin: true,
        createdAt: true,
        isSuspended: true,
        lockedUntil: true,
      },
    });

    return NextResponse.json({
      stats: {
        total_users: totalUsers,
        active_last_7_days: activeLast7Days,
        active_last_30_days: activeLast30Days,
        never_logged_in: neverLoggedIn,
        inactive_last_90_days: inactiveLast90Days,
        suspended_users: suspendedUsers,
        locked_users: lockedUsers,
      },
      recent_logins: recentLogins.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        last_login: user.lastLogin?.toISOString() || null,
        is_suspended: user.isSuspended,
        is_locked: user.lockedUntil ? user.lockedUntil > now : false,
      })),
      users_with_issues: usersWithIssues.map(user => {
        const isLocked = user.lockedUntil ? user.lockedUntil > now : false;
        return {
          id: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          last_login: user.lastLogin?.toISOString() || null,
          created_at: user.createdAt.toISOString(),
          is_suspended: user.isSuspended,
          is_locked: isLocked,
          issue_type: isLocked
            ? 'locked'
            : !user.lastLogin
              ? 'never_logged_in'
              : user.lastLogin < ninetyDaysAgo
                ? 'inactive'
                : 'unknown',
        };
      }),
    });
  } catch (error) {
    console.error('Failed to fetch activity data:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}
