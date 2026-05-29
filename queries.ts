import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { categories, media, siteSettings } from './schema';
import type { Category, GalleryItem, SiteSettings } from './types';

const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'ShotByAnshol',
  bio: '',
  contactEmail: '',
  bookingStatus: 'Currently booking 2026',
};

export async function getCategories(): Promise<Category[]> {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder));
    return rows;
  } catch (err) {
    console.error('getCategories failed:', err);
    return [];
  }
}

export async function getMedia(): Promise<GalleryItem[]> {
  try {
    const rows = await db
      .select({
        id: media.id,
        caption: media.caption,
        type: media.type,
        imageUrl: media.imageUrl,
        videoUrl: media.videoUrl,
        categorySlug: categories.slug,
      })
      .from(media)
      .leftJoin(categories, eq(media.categoryId, categories.id))
      .orderBy(asc(media.sortOrder));

    return rows.map((r) => ({
      id: r.id,
      caption: r.caption,
      type: r.type === 'video' ? 'video' : 'photo',
      imageUrl: r.imageUrl,
      videoUrl: r.videoUrl,
      category: r.categorySlug ?? 'uncategorized',
    }));
  } catch (err) {
    console.error('getMedia failed:', err);
    return [];
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.select().from(siteSettings).limit(1);
    if (rows.length === 0) return FALLBACK_SETTINGS;
    const r = rows[0];
    return {
      siteName: r.siteName,
      bio: r.bio,
      contactEmail: r.contactEmail,
      bookingStatus: r.bookingStatus,
    };
  } catch (err) {
    console.error('getSiteSettings failed:', err);
    return FALLBACK_SETTINGS;
  }
}
