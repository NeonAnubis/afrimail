import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Convert bytes to MB for display
const bytesToMb = (bytes: bigint) => Math.round(Number(bytes) / (1024 * 1024));

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

    const template = await prisma.userTemplate.findUnique({
      where: { id },
      include: {
        createdByAdmin: {
          select: { name: true, email: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      quota_bytes: template.quotaBytes.toString(),
      quota_mb: bytesToMb(template.quotaBytes),
      permissions: template.permissions,
      is_system_template: template.isSystemTemplate,
      created_by: template.createdBy,
      created_by_admin: template.createdByAdmin ? {
        name: template.createdByAdmin.name,
        email: template.createdByAdmin.email,
      } : null,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
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
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.quota_bytes !== undefined) updateData.quotaBytes = BigInt(body.quota_bytes);
    if (body.quota_mb !== undefined) updateData.quotaBytes = BigInt(body.quota_mb * 1024 * 1024);
    if (body.permissions !== undefined) updateData.permissions = body.permissions;
    if (body.is_system_template !== undefined) updateData.isSystemTemplate = body.is_system_template;

    const template = await prisma.userTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      quota_bytes: template.quotaBytes.toString(),
      quota_mb: bytesToMb(template.quotaBytes),
      permissions: template.permissions,
      is_system_template: template.isSystemTemplate,
    });
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
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

    await prisma.userTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
