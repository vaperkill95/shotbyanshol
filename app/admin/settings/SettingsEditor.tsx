'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import type { SiteSettings } from '@/lib/types';

export default function SettingsEditor({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.editorCard} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Site name</span>
        <input
          type="text"
          className={styles.input}
          value={form.siteName}
          onChange={(e) => setField('siteName', e.target.value)}
          maxLength={100}
        />
        <span className={styles.fieldHint}>Shown as the brand on every page.</span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Booking status</span>
        <input
          type="text"
          className={styles.input}
          value={form.bookingStatus}
          onChange={(e) => setField('bookingStatus', e.target.value)}
          maxLength={100}
          placeholder="e.g. Currently booking 2026"
        />
        <span className={styles.fieldHint}>
          The small status line shown in the gallery footer.
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Contact email</span>
        <input
          type="email"
          className={styles.input}
          value={form.contactEmail}
          onChange={(e) => setField('contactEmail', e.target.value)}
          maxLength={200}
          placeholder="anshol@example.com"
        />
        <span className={styles.fieldHint}>
          Where contact-form submissions will be delivered.
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>About / bio</span>
        <textarea
          className={styles.textarea}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          maxLength={1000}
          rows={6}
          placeholder="A few sentences about yourself — shown on the About page."
        />
        <span className={styles.fieldHint}>Up to 1000 characters.</span>
      </label>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className={styles.savedNote}>Saved ✓</span>}
      </div>
    </form>
  );
}

