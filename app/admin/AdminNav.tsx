'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/settings', label: 'Site settings' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.sideNav}>
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.sideNavLink} ${active ? styles.sideNavLinkActive : ''}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
