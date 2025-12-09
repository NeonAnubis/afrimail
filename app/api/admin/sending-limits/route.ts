import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limits = await prisma.emailSendingLimit.findMany({
      orderBy: { tierName: 'asc' },
    });

    const transformedLimits = limits.map(limit => ({
      id: limit.id,
      user_id: limit.userId,
      tier_id: limit.tierId,
      tier_name: limit.tierName,
      daily_limit: limit.dailyLimit,
      hourly_limit: limit.hourlyLimit,
      emails_sent_today: limit.emailsSentToday,
      emails_sent_this_hour: limit.emailsSentThisHour,
      last_reset_date: limit.lastResetDate.toISOString(),
      last_reset_hour: limit.lastResetHour.toISOString(),
      is_sending_enabled: limit.isSendingEnabled,
      custom_limit_reason: limit.customLimitReason,
      created_at: limit.createdAt.toISOString(),
      updated_at: limit.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedLimits);
  } catch (error) {
    console.error('Failed to fetch sending limits:', error);
    return NextResponse.json({ error: 'Failed to fetch sending limits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_id,
      tier_id,
      tier_name,
      daily_limit,
      hourly_limit,
    } = body;

    if (!user_id || !tier_name) {
      return NextResponse.json(
        { error: 'User ID and tier name are required' },
        { status: 400 }
      );
    }

    const limit = await prisma.emailSendingLimit.create({
      data: {
        userId: user_id,
        tierId: tier_id || null,
        tierName: tier_name,
        dailyLimit: daily_limit || 100,
        hourlyLimit: hourly_limit || 50,
        emailsSentToday: 0,
        emailsSentThisHour: 0,
        lastResetDate: new Date(),
        lastResetHour: new Date(),
        isSendingEnabled: true,
      },
    });

    return NextResponse.json({
      id: limit.id,
      user_id: limit.userId,
      tier_id: limit.tierId,
      tier_name: limit.tierName,
      daily_limit: limit.dailyLimit,
      hourly_limit: limit.hourlyLimit,
      created_at: limit.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create sending limit:', error);
    return NextResponse.json({ error: 'Failed to create sending limit' }, { status: 500 });
  }
}
