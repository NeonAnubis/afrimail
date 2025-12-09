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

    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        role: true,
      },
    });

    const transformedAdmins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role?.name || 'admin',
      permissions: admin.role?.permissions || {},
      is_active: admin.isActive,
      last_login: admin.lastLogin?.toISOString() || null,
      created_at: admin.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedAdmins);
  } catch (error) {
    console.error('Failed to fetch admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, password, role_id } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      );
    }

    // In production, hash the password
    // For now, we'll store it as-is (NOT RECOMMENDED for production)
    const admin = await prisma.adminUser.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash: password, // TODO: Hash this in production
        roleId: role_id || null,
        isActive: true,
        createdBy: currentUser.id,
      },
      include: {
        role: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actionType: 'admin_created',
        adminEmail: currentUser.email,
        targetUserEmail: email,
        details: `Admin user created`,
      },
    });

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role?.name || 'admin',
      is_active: admin.isActive,
      created_at: admin.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create admin:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
