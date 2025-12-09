import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
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
    const body = await request.json();
    const { quota_mb } = body;

    if (quota_mb === undefined || quota_mb < 0) {
      return NextResponse.json(
        { error: 'Invalid quota value' },
        { status: 400 }
      );
    }

    // Convert MB to bytes
    const quotaBytes = BigInt(quota_mb * 1024 * 1024);

    // First verify the user exists
    const user = await prisma.usersExtended.findUnique({
      where: { email: decodedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create the mailbox metadata with the new quota
    const mailboxMetadata = await prisma.mailboxMetadata.upsert({
      where: { email: decodedEmail },
      update: {
        quotaBytes,
      },
      create: {
        email: decodedEmail,
        userId: user.id,
        quotaBytes,
        usageBytes: BigInt(0),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'quota_updated',
        adminEmail: currentUser.email,
        targetUserEmail: decodedEmail,
        details: `Quota updated to ${quota_mb} MB`,
      },
    });

    // Convert bytes to MB for response
    const bytesToMb = (bytes: bigint) => Math.round(Number(bytes) / (1024 * 1024));

    return NextResponse.json({
      success: true,
      email: decodedEmail,
      quota_mb: bytesToMb(mailboxMetadata.quotaBytes),
      storage_used_mb: bytesToMb(mailboxMetadata.usageBytes),
    });
  } catch (error) {
    console.error('Failed to update quota:', error);
    return NextResponse.json({ error: 'Failed to update quota' }, { status: 500 });
  }
}
