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

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 500, // Limit to recent 500 logs
    });

    const transformedLogs = logs.map(log => ({
      id: log.id,
      action_type: log.actionType,
      admin_email: log.adminEmail,
      target_user_email: log.targetUserEmail,
      details: log.details,
      ip_address: log.ipAddress,
      timestamp: log.timestamp.toISOString(),
    }));

    return NextResponse.json(transformedLogs);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
