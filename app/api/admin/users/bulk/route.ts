import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, emails, data } = body;

    if (!action || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and emails array required.' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'suspend':
        result = await prisma.usersExtended.updateMany({
          where: { email: { in: emails } },
          data: {
            isSuspended: true,
          },
        });
        break;

      case 'unsuspend':
        result = await prisma.usersExtended.updateMany({
          where: { email: { in: emails } },
          data: {
            isSuspended: false,
          },
        });
        break;

      case 'delete':
        result = await prisma.usersExtended.deleteMany({
          where: { email: { in: emails } },
        });
        break;

      case 'update_quota':
        if (!data?.quota_mb) {
          return NextResponse.json(
            { error: 'Quota value required for quota update' },
            { status: 400 }
          );
        }
        // Get user IDs and update mailbox metadata
        const usersForQuota = await prisma.usersExtended.findMany({
          where: { email: { in: emails } },
          select: { id: true, email: true },
        });

        const quotaBytes = BigInt(data.quota_mb * 1024 * 1024);

        // Upsert mailbox metadata for each user
        for (const user of usersForQuota) {
          await prisma.mailboxMetadata.upsert({
            where: { email: user.email },
            update: { quotaBytes },
            create: {
              email: user.email,
              userId: user.id,
              quotaBytes,
              usageBytes: BigInt(0),
            },
          });
        }
        result = { count: usersForQuota.length };
        break;

      case 'assign_group':
        if (!data?.group_id) {
          return NextResponse.json(
            { error: 'Group ID required for group assignment' },
            { status: 400 }
          );
        }
        // Get user IDs for the emails
        const users = await prisma.usersExtended.findMany({
          where: { email: { in: emails } },
          select: { id: true },
        });

        // Create group memberships
        const memberships = users.map(user => ({
          groupId: data.group_id,
          userId: user.id,
        }));

        result = await prisma.userGroupMember.createMany({
          data: memberships,
          skipDuplicates: true,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Log the bulk action
    await prisma.auditLog.create({
      data: {
        actionType: `bulk_${action}`,
        adminEmail: currentUser.email,
        targetUserEmail: emails.join(', ').substring(0, 255), // Limit length
        details: `Bulk ${action} applied to ${emails.length} users${data?.reason ? `. Reason: ${data.reason}` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      affected_count: 'count' in result ? result.count : emails.length,
    });
  } catch (error) {
    console.error('Failed to perform bulk action:', error);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
