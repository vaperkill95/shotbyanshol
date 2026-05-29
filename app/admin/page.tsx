import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import styles from './admin.module.css';
import AdminTopbar from './AdminTopbar';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/admin/login');
  }

  const firstName = session.user.name?.split(' ')[0] || 'Anshol';

  return (
    <>
      <AdminTopbar userName={session.user.name || session.user.email} />
      <main className={styles.main}>
        <div className={styles.dashboardHero}>
          <div className={styles.dashboardKicker}>Admin · Dashboard</div>
          <h1 className={styles.dashboardTitle}>Welcome back, {firstName}.</h1>
          <p className={styles.dashboardSub}>
            You&apos;re signed in. The upload + manage panel slots in here next.
          </p>
        </div>

        <div className={styles.comingSoon}>
          ⌁ &nbsp; Upload, categories, bookings, and site settings — coming in the next step.
        </div>
      </main>
    </>
  );
}
