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

    const admin = await prisma.adminUser.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role?.name || 'admin',
      permissions: admin.role?.permissions || {},
      is_active: admin.isActive,
      last_login: admin.lastLogin?.toISOString() || null,
      created_at: admin.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch admin:', error);
    return NextResponse.json({ error: 'Failed to fetch admin' }, { status: 500 });
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
    if (body.role_id !== undefined) updateData.roleId = body.role_id;
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.password !== undefined) {
      // TODO: Hash password in production
      updateData.passwordHash = body.password;
    }

    const admin = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'admin_updated',
        adminEmail: currentUser.email,
        targetUserEmail: admin.email,
        details: `Admin user updated`,
      },
    });

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role?.name || 'admin',
      permissions: admin.role?.permissions || {},
      is_active: admin.isActive,
    });
  } catch (error) {
    console.error('Failed to update admin:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
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

    // Prevent self-deletion
    const adminToDelete = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (adminToDelete.email === currentUser.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'admin_deleted',
        adminEmail: currentUser.email,
        targetUserEmail: adminToDelete.email,
        details: `Admin user deleted`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
