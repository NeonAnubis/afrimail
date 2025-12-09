import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const limit = await prisma.emailSendingLimit.findUnique({
      where: { id },
    });

    if (!limit) {
      return NextResponse.json({ error: 'Sending limit not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Failed to fetch sending limit:', error);
    return NextResponse.json({ error: 'Failed to fetch sending limit' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.tier_id !== undefined) updateData.tierId = body.tier_id;
    if (body.tier_name !== undefined) updateData.tierName = body.tier_name;
    if (body.daily_limit !== undefined) updateData.dailyLimit = body.daily_limit;
    if (body.hourly_limit !== undefined) updateData.hourlyLimit = body.hourly_limit;
    if (body.is_sending_enabled !== undefined) updateData.isSendingEnabled = body.is_sending_enabled;
    if (body.custom_limit_reason !== undefined) updateData.customLimitReason = body.custom_limit_reason;

    const limit = await prisma.emailSendingLimit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: limit.id,
      user_id: limit.userId,
      tier_id: limit.tierId,
      tier_name: limit.tierName,
      daily_limit: limit.dailyLimit,
      hourly_limit: limit.hourlyLimit,
      is_sending_enabled: limit.isSendingEnabled,
      custom_limit_reason: limit.customLimitReason,
    });
  } catch (error) {
    console.error('Failed to update sending limit:', error);
    return NextResponse.json({ error: 'Failed to update sending limit' }, { status: 500 });
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

    const { id } = await params;

    await prisma.emailSendingLimit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete sending limit:', error);
    return NextResponse.json({ error: 'Failed to delete sending limit' }, { status: 500 });
  }
}
