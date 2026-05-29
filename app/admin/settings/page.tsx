import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSiteSettings } from '@/lib/queries';
import styles from '../admin.module.css';
import AdminTopbar from '../AdminTopbar';
import AdminNav from '../AdminNav';
import SettingsEditor from './SettingsEditor';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/admin/login');

  const settings = await getSiteSettings();

  return (
    <>
      <AdminTopbar userName={session.user.name || session.user.email} />
      <div className={styles.shellInner}>
        <AdminNav />
        <main className={styles.main}>
          <div className={styles.dashboardHero}>
            <div className={styles.dashboardKicker}>Admin · Settings</div>
            <h1 className={styles.dashboardTitle}>Site settings.</h1>
            <p className={styles.dashboardSub}>
              Edit how your site identifies itself. Changes go live instantly.
            </p>
          </div>
          <SettingsEditor initial={settings} />
        </main>
      </div>
    </>
  );
}

