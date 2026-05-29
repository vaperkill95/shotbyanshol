import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import styles from '../admin.module.css';
import AdminTopbar from '../AdminTopbar';
import AdminNav from '../AdminNav';
import CategoriesEditor from './CategoriesEditor';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/admin/login');

  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return (
    <>
      <AdminTopbar userName={session.user.name || session.user.email} />
      <div className={styles.shellInner}>
        <AdminNav />
        <main className={styles.main}>
          <div className={styles.dashboardHero}>
            <div className={styles.dashboardKicker}>Admin · Categories</div>
            <h1 className={styles.dashboardTitle}>Categories.</h1>
            <p className={styles.dashboardSub}>
              These are the filter chips visitors see on the gallery. Add, rename, or remove anytime.
            </p>
          </div>
          <CategoriesEditor initial={cats} />
        </main>
      </div>
    </>
  );
}

