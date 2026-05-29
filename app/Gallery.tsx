'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import styles from './gallery.module.css';
import type { GalleryItem, MediaType } from '@/lib/types';

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

interface GalleryProps {
  items: GalleryItem[];
  categories: string[];
  bookingStatus: string;
  siteName: string;
}

export default function Gallery({ items, categories, bookingStatus, siteName }: GalleryProps) {
  // The watermark looks best with a single short word. Derive it from siteName:
  // strip a leading "ShotBy" if present, otherwise take the first word.
  const brandShort = (() => {
    const stripped = siteName.replace(/^shot\s*by\s*/i, '').trim();
    const word = (stripped || siteName).split(/\s+/)[0] || 'Studio';
    return word;
  })();
  const [category, setCategory] = useState<string>('all');
  const [mediaType, setMediaType] = useState<'all' | MediaType>('all');
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (p) =>
          (category === 'all' || p.category === category) &&
          (mediaType === 'all' || p.type === mediaType),
      ),
    [items, category, mediaType],
  );

  useEffect(() => {
    setPage(1);
  }, [category, mediaType, perPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + perPage, filtered.length);

  const canvasRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!canvas || !cursor) return;
    let tx = 0, ty = 0, cx = -300, cy = -300, raf = 0, running = false;
    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursor.style.transform = `translate3d(${cx - 210}px, ${cy - 210}px, 0)`;
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      cursor.style.opacity = '1';
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const onLeave = () => { cursor.style.opacity = '0'; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const turbRef = useRef<SVGFETurbulenceElement>(null);
  useEffect(() => {
    let seed = 1;
    const id = setInterval(() => {
      seed = (seed + 1) % 200;
      turbRef.current?.setAttribute('seed', String(seed));
    }, 90);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      else if (e.key === 'ArrowRight')
        setLightboxIndex((i) =>
          i !== null && i < filtered.length - 1 ? i + 1 : i,
        );
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  const lbItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;
  const gridKey = `${category}-${mediaType}-${perPage}-${safePage}`;

  const photoStyle = (url: string | null) =>
    url
      ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: 'linear-gradient(160deg, #2a2418, #14110c)' };

  const lbMediaStyle = (url: string | null) =>
    url
      ? {
          backgroundImage: `url(${url})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }
      : { background: 'linear-gradient(160deg, #2a2418, #14110c)' };

  return (
    <div className={styles.canvas} ref={canvasRef}>
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={`${styles.blob} ${styles.blobC}`} />

      <div className={styles.watermark}>
        {brandShort.toUpperCase()}<span>.</span>
      </div>
      <div className={styles.edgeL}>PHOTOGRAPHY · {brandShort.toUpperCase()} · 2026</div>
      <div className={styles.edgeR}>EST. 2026 · TX</div>

      <div className={styles.cursor} ref={cursorRef} />

      <svg
        className={styles.grain}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="grain-noise" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="2.4"
              numOctaves="2"
              seed="1"
            />
            <feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.6 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>

      <div className={styles.vignette} />

      <div className={styles.content}>
        <nav className={styles.nav}>
          <div className={styles.mark}>
            {siteName}<span>.</span>
          </div>
          <div className={styles.links}>
            <a href="#">Work</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </div>
        </nav>

        <div className={styles.bar}>
          <div className={styles.chips}>
            {['all', ...categories].map((c) => (
              <button
                key={c}
                className={`${styles.chip} ${category === c ? styles.chipActive : ''}`}
                onClick={() => setCategory(c)}
              >
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.rightControls}>
            <div className={styles.mediaSeg}>
              {(['all', 'photo', 'video'] as const).map((t) => (
                <button
                  key={t}
                  className={`${styles.segBtn} ${mediaType === t ? styles.segActive : ''}`}
                  onClick={() => setMediaType(t)}
                >
                  {t === 'all' ? 'All' : t === 'photo' ? 'Photos' : 'Videos'}
                </button>
              ))}
            </div>

            <div className={styles.show}>
              <button
                className={styles.showBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((o) => !o);
                }}
              >
                Show {perPage} <span style={{ opacity: 0.55, marginLeft: 4 }}>▾</span>
              </button>
              {menuOpen && (
                <div className={styles.showMenu}>
                  {PER_PAGE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      className={`${styles.showOpt} ${perPage === n ? styles.showOptActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPerPage(n);
                        setMenuOpen(false);
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyMark}>✦</div>
            <div className={styles.emptyTitle}>Gallery coming online</div>
            <div className={styles.emptySub}>First images uploading soon.</div>
          </div>
        ) : (
          <div className={styles.grid} key={gridKey}>
            {visible.map((p, i) => (
              <button
                key={p.id}
                className={styles.photo}
                style={{ animationDelay: `${i * 38}ms` }}
                onClick={() => setLightboxIndex(start + i)}
                aria-label={`Open ${p.caption || 'media'}`}
              >
                <span className={styles.photoInner}>
                  <span className={styles.photoBg} style={photoStyle(p.imageUrl)} />
                  <span className={styles.photoOverlay}>
                    <span className={styles.photoCap}>{p.caption || 'Untitled'}</span>
                  </span>
                </span>
                {p.type === 'video' && <span className={styles.playBadge}>▶</span>}
              </button>
            ))}
          </div>
        )}

        <div className={styles.foot}>
          <span>
            <span className={styles.pulse} />
            {items.length === 0
              ? bookingStatus
              : `Showing ${from}\u2013${to} of ${filtered.length}`}
          </span>
          {items.length > 0 && (
            <span className={styles.pager}>
              <button
                className={`${styles.pagerBtn} ${safePage === 1 ? styles.disabled : ''}`}
                onClick={() => setPage((pg) => Math.max(1, pg - 1))}
              >
                ← Prev
              </button>
              <span className={styles.pagerInfo}>
                Page {safePage} of {totalPages}
              </span>
              <button
                className={`${styles.pagerBtn} ${safePage === totalPages ? styles.disabled : ''}`}
                onClick={() => setPage((pg) => Math.min(totalPages, pg + 1))}
              >
                Next →
              </button>
            </span>
          )}
        </div>
      </div>

      {lbItem && lightboxIndex !== null && (
        <div className={styles.lb}>
          <div className={styles.lbBack} onClick={() => setLightboxIndex(null)} />
          <div className={styles.lbCounter}>
            {String(lightboxIndex + 1).padStart(3, '0')} /{' '}
            {String(filtered.length).padStart(3, '0')}
          </div>
          <div className={styles.lbType}>
            {lbItem.type === 'video' ? 'VIDEO' : 'PHOTO'}
          </div>
          <button className={styles.lbClose} onClick={() => setLightboxIndex(null)}>
            ×
          </button>
          <button
            className={`${styles.lbArrow} ${styles.lbPrev} ${lightboxIndex === 0 ? styles.disabled : ''}`}
            onClick={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          >
            ←
          </button>
          <button
            className={`${styles.lbArrow} ${styles.lbNext} ${lightboxIndex === filtered.length - 1 ? styles.disabled : ''}`}
            onClick={() =>
              setLightboxIndex((i) =>
                i !== null && i < filtered.length - 1 ? i + 1 : i,
              )
            }
          >
            →
          </button>
          <div className={styles.lbWrap}>
            <div className={styles.lbMedia} style={lbMediaStyle(lbItem.imageUrl)} />
            <div className={styles.lbInfo}>
              <div className={styles.lbCap}>{lbItem.caption || 'Untitled'}</div>
              <div className={styles.lbMeta}>
                {lbItem.category.toUpperCase()} · 2026
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
