'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import styles from './admin.module.css';

export default function AdminTopbar({ userName }: { userName: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.brand}>
        <a href="/admin">
          ShotByAnshol<span className={styles.brandTag}>Admin</span>
        </a>
      </div>
      <div className={styles.topRight}>
        <span>Signed in as {userName}</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
