import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/schema';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, string> = {};
  if (typeof body.siteName === 'string') update.siteName = body.siteName.slice(0, 100);
  if (typeof body.bio === 'string') update.bio = body.bio.slice(0, 1000);
  if (typeof body.contactEmail === 'string') update.contactEmail = body.contactEmail.slice(0, 200);
  if (typeof body.bookingStatus === 'string') update.bookingStatus = body.bookingStatus.slice(0, 100);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const [row] = await db
    .update(siteSettings)
    .set(update)
    .where(eq(siteSettings.id, 1))
    .returning();

  return NextResponse.json({ success: true, settings: row });
}

