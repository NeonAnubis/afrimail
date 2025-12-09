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

    const actions = await prisma.scheduledAction.findMany({
      orderBy: { scheduledFor: 'asc' },
    });

    const transformedActions = actions.map(action => ({
      id: action.id,
      action_type: action.actionType,
      target_type: action.targetType,
      target_ids: action.targetIds,
      action_data: action.actionData,
      scheduled_for: action.scheduledFor.toISOString(),
      status: action.status,
      created_by: action.createdBy,
      executed_at: action.executedAt?.toISOString() || null,
      created_at: action.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedActions);
  } catch (error) {
    console.error('Failed to fetch scheduled actions:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled actions' }, { status: 500 });
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
      action_type,
      target_type,
      target_ids,
      action_data,
      scheduled_for,
    } = body;

    if (!action_type || !target_type || !target_ids || !scheduled_for) {
      return NextResponse.json(
        { error: 'Action type, target type, target IDs, and scheduled time are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduled_for);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const action = await prisma.scheduledAction.create({
      data: {
        actionType: action_type,
        targetType: target_type,
        targetIds: target_ids,
        actionData: action_data || {},
        scheduledFor: scheduledDate,
        status: 'pending',
        createdBy: currentUser.email,
      },
    });

    return NextResponse.json({
      id: action.id,
      action_type: action.actionType,
      target_type: action.targetType,
      target_ids: action.targetIds,
      action_data: action.actionData,
      scheduled_for: action.scheduledFor.toISOString(),
      status: action.status,
      created_by: action.createdBy,
      created_at: action.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create scheduled action:', error);
    return NextResponse.json({ error: 'Failed to create scheduled action' }, { status: 500 });
  }
}
