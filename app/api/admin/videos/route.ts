import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { media, categories } from '@/lib/schema';
import { extractVimeoId, fetchVimeoMetadata, vimeoEmbedUrl } from '@/lib/vimeo';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const vimeoUrl =
    typeof body.vimeoUrl === 'string' ? body.vimeoUrl.trim() : '';
  const caption =
    typeof body.caption === 'string' ? body.caption.trim().slice(0, 200) : '';
  const categorySlug =
    typeof body.category === 'string' && body.category ? body.category : null;

  if (!vimeoUrl) {
    return NextResponse.json({ error: 'Vimeo URL is required.' }, { status: 400 });
  }

  const videoId = extractVimeoId(vimeoUrl);
  if (!videoId) {
    return NextResponse.json(
      { error: 'That doesn\u2019t look like a Vimeo URL. Try e.g. https://vimeo.com/123456789' },
      { status: 400 },
    );
  }

  // Resolve category if provided.
  let categoryId: number | null = null;
  if (categorySlug && categorySlug !== 'uncategorized') {
    const cat = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (cat.length > 0) categoryId = cat[0].id;
  }

  // Pull thumbnail + title from Vimeo's oEmbed.
  const meta = await fetchVimeoMetadata(vimeoUrl);
  const thumbnailUrl = meta?.thumbnailUrl ?? null;
  // Use the Vimeo title only if the admin didn't supply a caption.
  const finalCaption = caption || meta?.title || 'Video';

  // Highest existing sort_order so the new video lands on top.
  const last = await db
    .select({ max: media.sortOrder })
    .from(media)
    .orderBy(desc(media.sortOrder))
    .limit(1);
  const nextOrder = (last[0]?.max ?? 0) + 1;

  try {
    const [row] = await db
      .insert(media)
      .values({
        caption: finalCaption,
        type: 'video',
        imageUrl: thumbnailUrl,
        videoUrl: vimeoEmbedUrl(videoId),
        categoryId,
        sortOrder: nextOrder,
      })
      .returning();
    return NextResponse.json({ success: true, media: row });
  } catch (err) {
    console.error('Video insert failed:', err);
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
  }
}

