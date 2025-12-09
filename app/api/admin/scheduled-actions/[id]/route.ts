import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const action = await prisma.scheduledAction.findUnique({
      where: { id },
    });

    if (!action) {
      return NextResponse.json({ error: 'Scheduled action not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Failed to fetch scheduled action:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled action' }, { status: 500 });
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

    // Only allow updates to pending actions
    const existingAction = await prisma.scheduledAction.findUnique({
      where: { id },
    });

    if (!existingAction) {
      return NextResponse.json({ error: 'Scheduled action not found' }, { status: 404 });
    }

    if (existingAction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only modify pending actions' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.action_type !== undefined) updateData.actionType = body.action_type;
    if (body.target_ids !== undefined) updateData.targetIds = body.target_ids;
    if (body.action_data !== undefined) updateData.actionData = body.action_data;
    if (body.scheduled_for !== undefined) {
      const scheduledDate = new Date(body.scheduled_for);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
      updateData.scheduledFor = scheduledDate;
    }

    const action = await prisma.scheduledAction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: action.id,
      action_type: action.actionType,
      target_type: action.targetType,
      target_ids: action.targetIds,
      action_data: action.actionData,
      scheduled_for: action.scheduledFor.toISOString(),
      status: action.status,
    });
  } catch (error) {
    console.error('Failed to update scheduled action:', error);
    return NextResponse.json({ error: 'Failed to update scheduled action' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only allow deletion of pending actions
    const existingAction = await prisma.scheduledAction.findUnique({
      where: { id },
    });

    if (!existingAction) {
      return NextResponse.json({ error: 'Scheduled action not found' }, { status: 404 });
    }

    if (existingAction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending actions' },
        { status: 400 }
      );
    }

    await prisma.scheduledAction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete scheduled action:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled action' }, { status: 500 });
  }
}
