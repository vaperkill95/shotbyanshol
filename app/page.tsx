import Gallery from './Gallery';
import { getCategories, getMedia, getSiteSettings } from '@/lib/queries';

// Render fresh on every request so admin uploads appear immediately.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [items, cats, settings] = await Promise.all([
    getMedia(),
    getCategories(),
    getSiteSettings(),
  ]);

  return (
    <Gallery
      items={items}
      categories={cats.map((c) => c.slug)}
      bookingStatus={settings.bookingStatus}
    />
  );
}
