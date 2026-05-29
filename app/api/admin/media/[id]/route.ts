import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { db } from '@/lib/db';
import { media, categories } from '@/lib/schema';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const mediaId = parseInt(id, 10);
  if (Number.isNaN(mediaId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, string | number | null> = {};

  if (typeof body.caption === 'string') {
    update.caption = body.caption.slice(0, 200);
  }

  // categoryId can be null (uncategorized) or a number — validate it exists.
  if (body.categoryId === null) {
    update.categoryId = null;
  } else if (typeof body.categoryId === 'number') {
    const exists = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, body.categoryId))
      .limit(1);
    if (exists.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }
    update.categoryId = body.categoryId;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const [row] = await db
    .update(media)
    .set(update)
    .where(eq(media.id, mediaId))
    .returning();

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, media: row });
}

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

  const rows = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const row = rows[0];

  // Only delete the R2 object if the URL belongs to our bucket
  // (Vimeo thumbnails for videos live elsewhere — leave them).
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
