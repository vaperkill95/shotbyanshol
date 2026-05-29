import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { db } from '@/lib/db';
import { media } from '@/lib/schema';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const mediaId = parseInt(id, 10);
  if (Number.isNaN(mediaId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Find the row so we know what R2 key to delete.
  const rows = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const row = rows[0];

  // Delete the R2 object if the URL belongs to our bucket.
  if (row.imageUrl && row.imageUrl.startsWith(R2_PUBLIC_URL + '/')) {
    const key = row.imageUrl.slice(R2_PUBLIC_URL.length + 1);
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    } catch (err) {
      console.error('R2 delete failed (continuing to remove DB row):', err);
    }
  }

  await db.delete(media).where(eq(media.id, mediaId));
  return NextResponse.json({ success: true });
}

