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

    const templates = await prisma.userTemplate.findMany({
      orderBy: { name: 'asc' },
      include: {
        createdByAdmin: {
          select: { name: true, email: true },
        },
      },
    });

    // Convert bytes to MB for display
    const bytesToMb = (bytes: bigint) => Math.round(Number(bytes) / (1024 * 1024));

    const transformedTemplates = templates.map(template => ({
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
    }));

    return NextResponse.json(transformedTemplates);
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
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
      name,
      description,
      quota_mb,
      quota_bytes,
      permissions,
      is_system_template,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // Convert MB to bytes if quota_mb provided, otherwise use quota_bytes or default
    const quotaBytesValue = quota_bytes
      ? BigInt(quota_bytes)
      : quota_mb
        ? BigInt(quota_mb * 1024 * 1024)
        : BigInt(5368709120); // 5GB default

    // Get the admin user's ID
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: currentUser.email },
      select: { id: true },
    });

    const template = await prisma.userTemplate.create({
      data: {
        name,
        description,
        quotaBytes: quotaBytesValue,
        permissions: permissions || {},
        isSystemTemplate: is_system_template || false,
        createdBy: adminUser?.id || null,
      },
    });

    // Convert bytes to MB for response
    const bytesToMb = (bytes: bigint) => Math.round(Number(bytes) / (1024 * 1024));

    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      quota_bytes: template.quotaBytes.toString(),
      quota_mb: bytesToMb(template.quotaBytes),
      permissions: template.permissions,
      is_system_template: template.isSystemTemplate,
      created_by: template.createdBy,
      created_at: template.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
