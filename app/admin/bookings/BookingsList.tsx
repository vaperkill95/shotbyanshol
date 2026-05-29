'use client';

import { useState, useMemo } from 'react';
import styles from '../admin.module.css';

interface Booking {
  id: number;
  name: string;
  email: string;
  eventType: string | null;
  eventDate: string | null;
  message: string;
  status: string;
  createdAt: string;
}

type Filter = 'all' | 'new' | 'read' | 'archived';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BookingsList({ initial }: { initial: Booking[] }) {
  const [items, setItems] = useState<Booking[]>(initial);
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c = { all: items.length, new: 0, read: 0, archived: 0 };
    items.forEach((i) => {
      if (i.status === 'new') c.new++;
      else if (i.status === 'read') c.read++;
      else if (i.status === 'archived') c.archived++;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const setStatus = async (id: number, status: string) => {
    const prev = items;
    setItems((p) => p.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      setItems(prev);
    }
  };

  const handleDelete = async (b: Booking) => {
    if (!confirm(`Delete the message from ${b.name}? This cannot be undone.`)) return;
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== b.id));
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setItems(prev);
      alert('Could not delete. Try again.');
    }
  };

  return (
    <div>
      <div className={styles.bookingFilters}>
        {(['all', 'new', 'read', 'archived'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`${styles.bookingFilter} ${filter === f ? styles.bookingFilterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span className={styles.bookingFilterCount}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyMedia}>
          {filter === 'all'
            ? 'No booking requests yet. They\u2019ll show up here when people use the contact form.'
            : `No ${filter} messages.`}
        </div>
      ) : (
        <ul className={styles.bookingList}>
          {filtered.map((b) => (
            <li key={b.id} className={`${styles.bookingCard} ${b.status === 'new' ? styles.bookingNew : ''}`}>
              <div className={styles.bookingHeader}>
                <div>
                  <div className={styles.bookingName}>
                    {b.name}
                    {b.status === 'new' && <span className={styles.bookingBadge}>New</span>}
                  </div>
                  <a className={styles.bookingEmail} href={`mailto:${b.email}?subject=Re: Your booking request`}>
                    {b.email}
                  </a>
                </div>
                <div className={styles.bookingDate}>{formatDate(b.createdAt)}</div>
              </div>

              {(b.eventType || b.eventDate) && (
                <div className={styles.bookingMeta}>
                  {b.eventType && (
                    <span><span className={styles.bookingMetaLabel}>Event:</span> {b.eventType}</span>
                  )}
                  {b.eventDate && (
                    <span><span className={styles.bookingMetaLabel}>Date:</span> {b.eventDate}</span>
                  )}
                </div>
              )}

              <div className={styles.bookingMessage}>{b.message}</div>

              <div className={styles.bookingActions}>
                <a className={styles.secondaryBtn} href={`mailto:${b.email}?subject=Re: Your booking request`}>
                  Reply by email
                </a>
                {b.status !== 'read' && (
                  <button className={styles.secondaryBtn} onClick={() => setStatus(b.id, 'read')}>
                    Mark as read
                  </button>
                )}
                {b.status !== 'archived' && (
                  <button className={styles.secondaryBtn} onClick={() => setStatus(b.id, 'archived')}>
                    Archive
                  </button>
                )}
                <button className={styles.dangerBtn} onClick={() => handleDelete(b)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

