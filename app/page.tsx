import Gallery from './Gallery';
import { getCategories, getMedia, getSiteSettings } from '@/lib/queries';

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
      siteName={settings.siteName}
      bookingStatus={settings.bookingStatus}
    />
  );
}
