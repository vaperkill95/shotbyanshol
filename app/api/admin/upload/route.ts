import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { db } from '@/lib/db';
import { media, categories } from '@/lib/schema';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB after client-side compression

export async function POST(req: NextRequest) {
  // Defense-in-depth: middleware already gated, but double-check.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const categorySlug = (formData.get('category') as string | null) || null;
  const caption = ((formData.get('caption') as string | null) || '').slice(0, 200);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB after compression.` },
      { status: 413 },
    );
  }

  // Look up category id if a slug was provided.
  let categoryId: number | null = null;
  if (categorySlug && categorySlug !== 'uncategorized') {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (cat.length > 0) categoryId = cat[0].id;
  }

  // Compute next sort_order so newest uploads appear first by default.
  const maxOrder = await db
    .select({ max: media.sortOrder })
    .from(media)
    .orderBy(desc(media.sortOrder))
    .limit(1);
  const nextOrder = (maxOrder[0]?.max ?? 0) + 1;

  // Generate unique R2 key.
  const ext = file.type === 'image/png' ? 'png'
    : file.type === 'image/webp' ? 'webp'
    : file.type === 'image/gif' ? 'gif'
    : 'jpg';
  const key = `media/${crypto.randomUUID()}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  } catch (err) {
    console.error('R2 upload failed:', err);
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 });
  }

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  try {
    const [row] = await db
      .insert(media)
      .values({
        caption,
        imageUrl: publicUrl,
        type: 'photo',
        categoryId,
        sortOrder: nextOrder,
      })
      .returning();

    return NextResponse.json({ success: true, media: row });
  } catch (err) {
    console.error('DB insert failed:', err);
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
  }
}

