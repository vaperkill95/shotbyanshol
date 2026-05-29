import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { bookings } from '@/lib/schema';
import styles from '../admin.module.css';
import AdminTopbar from '../AdminTopbar';
import AdminNav from '../AdminNav';
import BookingsList from './BookingsList';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/admin/login');

  const rows = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt))
    .limit(200);

  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    eventType: r.eventType,
    eventDate: r.eventDate,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminTopbar userName={session.user.name || session.user.email} />
      <div className={styles.shellInner}>
        <AdminNav />
        <main className={styles.main}>
          <div className={styles.dashboardHero}>
            <div className={styles.dashboardKicker}>Admin · Bookings</div>
            <h1 className={styles.dashboardTitle}>Booking requests.</h1>
            <p className={styles.dashboardSub}>
              Messages sent through the contact form. Reply directly from your email.
            </p>
          </div>
          <BookingsList initial={items} />
        </main>
      </div>
    </>
  );
}

