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

    // Get all users with their mailbox metadata for storage data
    const users = await prisma.usersExtended.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuspended: true,
        mailboxMetadata: {
          select: {
            quotaBytes: true,
            usageBytes: true,
          },
        },
      },
      orderBy: { email: 'asc' },
    });

    // Convert bytes to MB for display
    const bytesToMb = (bytes: bigint | number) => Math.round(Number(bytes) / (1024 * 1024));

    // Calculate aggregate stats
    const usersWithStorage = users.map(user => ({
      ...user,
      quotaMb: user.mailboxMetadata ? bytesToMb(user.mailboxMetadata.quotaBytes) : 0,
      storageUsedMb: user.mailboxMetadata ? bytesToMb(user.mailboxMetadata.usageBytes) : 0,
    }));

    const totalAllocated = usersWithStorage.reduce((sum, user) => sum + user.quotaMb, 0);
    const totalUsed = usersWithStorage.reduce((sum, user) => sum + user.storageUsedMb, 0);
    const usersOverQuota = usersWithStorage.filter(
      user => user.storageUsedMb >= user.quotaMb * 0.9
    ).length;
    const usersNearQuota = usersWithStorage.filter(
      user => {
        const percentage = user.quotaMb > 0 ? (user.storageUsedMb / user.quotaMb) * 100 : 0;
        return percentage >= 75 && percentage < 90;
      }
    ).length;

    // Sort by storage used descending
    usersWithStorage.sort((a, b) => b.storageUsedMb - a.storageUsedMb);

    return NextResponse.json({
      stats: {
        total_allocated: totalAllocated,
        total_used: totalUsed,
        users_over_quota: usersOverQuota,
        users_near_quota: usersNearQuota,
        total_users: users.length,
        average_usage_percentage: totalAllocated > 0
          ? Math.round((totalUsed / totalAllocated) * 100)
          : 0,
      },
      users: usersWithStorage.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        quota_mb: user.quotaMb,
        storage_used_mb: user.storageUsedMb,
        usage_percentage: user.quotaMb > 0
          ? Math.round((user.storageUsedMb / user.quotaMb) * 100)
          : 0,
        is_suspended: user.isSuspended,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch storage data:', error);
    return NextResponse.json({ error: 'Failed to fetch storage data' }, { status: 500 });
  }
}
