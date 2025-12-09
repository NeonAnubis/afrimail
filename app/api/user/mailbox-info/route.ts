import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create response object for cookie handling
    const response = NextResponse.json({ error: 'Processing' });

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Get authenticated user (more secure than getSession)
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = authUser.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get mailbox metadata for the user
    let mailboxMetadata = await prisma.mailboxMetadata.findUnique({
      where: { email: userEmail },
    });

    // If no mailbox metadata exists, create default entry
    if (!mailboxMetadata) {
      // Default quota: 5GB = 5 * 1024 * 1024 * 1024 bytes
      const defaultQuotaBytes = BigInt(5368709120);

      mailboxMetadata = await prisma.mailboxMetadata.create({
        data: {
          email: userEmail,
          userId: authUser.id,
          quotaBytes: defaultQuotaBytes,
          usageBytes: BigInt(0),
        },
      });
    }

    // Calculate usage percentage
    const quotaBytes = Number(mailboxMetadata.quotaBytes);
    const usageBytes = Number(mailboxMetadata.usageBytes);
    const quotaUsedPercentage = quotaBytes > 0
      ? (usageBytes / quotaBytes) * 100
      : 0;

    return NextResponse.json({
      email: userEmail,
      quota_bytes: quotaBytes,
      usage_bytes: usageBytes,
      quota_used_percentage: quotaUsedPercentage,
    });
  } catch (error) {
    console.error('Get mailbox info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
