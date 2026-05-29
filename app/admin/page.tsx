import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories, media } from '@/lib/schema';
import styles from './admin.module.css';
import AdminTopbar from './AdminTopbar';
import AdminNav from './AdminNav';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/admin/login');

  const [cats, mediaRows] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(categories.sortOrder),
    db
      .select({
        id: media.id,
        caption: media.caption,
        imageUrl: media.imageUrl,
        videoUrl: media.videoUrl,
        type: media.type,
        categoryId: media.categoryId,
      })
      .from(media)
      .orderBy(desc(media.sortOrder), desc(media.id))
      .limit(200),
  ]);

  const firstName = session.user.name?.split(' ')[0] || 'Anshol';

  return (
    <>
      <AdminTopbar userName={session.user.name || session.user.email} />
      <div className={styles.shellInner}>
        <AdminNav />
        <main className={styles.main}>
          <div className={styles.dashboardHero}>
            <div className={styles.dashboardKicker}>Admin · Dashboard</div>
            <h1 className={styles.dashboardTitle}>Welcome back, {firstName}.</h1>
            <p className={styles.dashboardSub}>
              Upload photos, manage what&apos;s live on your gallery.
            </p>
          </div>
          <AdminDashboard categories={cats} initialMedia={mediaRows} />
        </main>
      </div>
    </>
  );
}
