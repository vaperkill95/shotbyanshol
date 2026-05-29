'use client';

import { useState, FormEvent } from 'react';
import styles from './contact.module.css';

export default function ContactForm({
  siteName,
  bookingStatus,
}: {
  siteName: string;
  bookingStatus: string;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    eventType: '',
    eventDate: '',
    message: '',
    website: '', // honeypot
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send. Try again.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.canvas}>
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={styles.watermark}>
        {siteName.replace(/^shot\s*by\s*/i, '').toUpperCase()}<span>.</span>
      </div>

      <div className={styles.content}>
        <nav className={styles.nav}>
          <div className={styles.mark}>
            <a href="/">{siteName}<span>.</span></a>
          </div>
          <div className={styles.links}>
            <a href="/">Work</a>
            <a href="/about">About</a>
            <a href="/contact" className={styles.linkActive}>Contact</a>
          </div>
        </nav>

        <div className={styles.body}>
          <div className={styles.intro}>
            <div className={styles.kicker}>Booking inquiries</div>
            <h1 className={styles.title}>Let&apos;s make something.</h1>
            <p className={styles.lede}>
              Weddings, events, portraits, or something off the map — send a quick note and
              I&apos;ll get back to you with availability and rates.
            </p>
            <div className={styles.meta}>
              <span><span className={styles.metaPulse} />{bookingStatus}</span>
              <span>Most replies within 48 hours</span>
            </div>
          </div>

          <div className={styles.card}>
            {sent ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>✦</div>
                <h2 className={styles.successTitle}>Message received.</h2>
                <p className={styles.successSub}>
                  Thanks for reaching out. You&apos;ll hear back soon.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                {error && <div className={styles.error}>{error}</div>}

                <label className={styles.field}>
                  <span className={styles.label}>Your name</span>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input
                    type="email"
                    className={styles.input}
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    required
                    maxLength={200}
                    autoComplete="email"
                  />
                </label>

                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.label}>Event type</span>
                    <input
                      type="text"
                      className={styles.input}
                      value={form.eventType}
                      onChange={(e) => set('eventType', e.target.value)}
                      maxLength={80}
                      placeholder="Wedding, event, portrait…"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Event date</span>
                    <input
                      type="text"
                      className={styles.input}
                      value={form.eventDate}
                      onChange={(e) => set('eventDate', e.target.value)}
                      maxLength={50}
                      placeholder="Approximate is fine"
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.label}>Message</span>
                  <textarea
                    className={styles.textarea}
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    required
                    maxLength={3000}
                    rows={6}
                    placeholder="Tell me a bit about what you're planning."
                  />
                </label>

                {/* Honeypot — bots fill this, humans don't see it */}
                <label className={styles.honeypot} aria-hidden="true">
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => set('website', e.target.value)}
                  />
                </label>

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

