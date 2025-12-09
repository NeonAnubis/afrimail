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

    const violations = await prisma.sendingLimitViolation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const transformedViolations = violations.map(violation => ({
      id: violation.id,
      user_id: violation.userId,
      violation_type: violation.violationType,
      attempted_count: violation.attemptedCount,
      limit_at_time: violation.limitAtTime,
      violation_details: violation.violationDetails,
      action_taken: violation.actionTaken,
      admin_notes: violation.adminNotes,
      is_resolved: violation.isResolved,
      resolved_at: violation.resolvedAt?.toISOString() || null,
      resolved_by: violation.resolvedBy,
      created_at: violation.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedViolations);
  } catch (error) {
    console.error('Failed to fetch violations:', error);
    return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 });
  }
}
