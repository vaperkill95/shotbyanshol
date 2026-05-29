import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';

export const runtime = 'nodejs';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const catId = parseInt(id, 10);
  if (Number.isNaN(catId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, string | number> = {};
  if (typeof body.name === 'string') {
    const name = body.name.trim().slice(0, 50);
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    update.name = name;
    update.slug = slugify(name);
  }
  if (typeof body.sortOrder === 'number') {
    update.sortOrder = body.sortOrder;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const [row] = await db
      .update(categories)
      .set(update)
      .where(eq(categories.id, catId))
      .returning();
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, category: row });
  } catch (err) {
    console.error('Category update failed:', err);
    return NextResponse.json(
      { error: 'Another category already uses that name.' },
      { status: 409 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const catId = parseInt(id, 10);
  if (Number.isNaN(catId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Photos in this category will have their category_id set to null
  // (per the schema's onDelete: 'set null'), so no photos are deleted.
  await db.delete(categories).where(eq(categories.id, catId));
  return NextResponse.json({ success: true });
}

