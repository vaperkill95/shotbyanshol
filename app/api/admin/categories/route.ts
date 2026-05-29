import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { asc, desc } from 'drizzle-orm';
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

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 50) : '';
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  // Next sort_order = highest + 1.
  const last = await db
    .select({ max: categories.sortOrder })
    .from(categories)
    .orderBy(desc(categories.sortOrder))
    .limit(1);
  const nextOrder = (last[0]?.max ?? 0) + 1;

  try {
    const [row] = await db
      .insert(categories)
      .values({ name, slug, sortOrder: nextOrder })
      .returning();
    return NextResponse.json({ success: true, category: row });
  } catch (err) {
    // Most likely a unique-slug collision.
    console.error('Category insert failed:', err);
    return NextResponse.json(
      { error: 'A category with that name already exists.' },
      { status: 409 },
    );
  }
}

