import { getSiteSettings } from '@/lib/queries';
import styles from './about.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'About · ShotByAnshol',
  description: 'About the photographer.',
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const brandShort =
    settings.siteName.replace(/^shot\s*by\s*/i, '').trim() || settings.siteName;

  return (
    <div className={styles.canvas}>
      <div className={`${styles.blob} ${styles.blobA}`} />
      <div className={`${styles.blob} ${styles.blobB}`} />
      <div className={styles.watermark}>
        {brandShort.toUpperCase()}<span>.</span>
      </div>
      <div className={styles.vignette} />

      <div className={styles.content}>
        <nav className={styles.nav}>
          <div className={styles.mark}>
            <a href="/">{settings.siteName}<span>.</span></a>
          </div>
          <div className={styles.links}>
            <a href="/">Work</a>
            <a href="/about" className={styles.linkActive}>About</a>
            <a href="/contact">Contact</a>
          </div>
        </nav>

        <div className={styles.body}>
          <div className={styles.kicker}>About</div>
          <h1 className={styles.title}>
            {brandShort}<span className={styles.titleAccent}>.</span>
          </h1>
          <div className={styles.titleSub}>Photographer · {settings.bookingStatus}</div>

          <div className={styles.rule} />

          {settings.bio.trim() ? (
            <div className={styles.bio}>{settings.bio}</div>
          ) : (
            <div className={styles.bioPlaceholder}>
              Bio coming soon — add it in Admin → Site settings.
            </div>
          )}

          <a href="/contact" className={styles.cta}>
            Get in touch <span className={styles.ctaArrow}>→</span>
          </a>

          <div className={styles.status}>
            <span className={styles.statusPulse} />
            {settings.bookingStatus}
          </div>
        </div>
      </div>
    </div>
  );
}

