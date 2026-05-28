// Placeholder gallery data. These gradient "photos" are stand-ins so we can see
// the design live before the database + admin upload are built. In a later phase,
// this array gets replaced by real records (with image/video URLs) fetched from Neon.

export type MediaType = 'photo' | 'video';

export interface GalleryItem {
  id: number;
  bg: string; // placeholder gradient; becomes a real image URL later
  caption: string;
  category: string;
  type: MediaType;
}

const styles = [
  'radial-gradient(circle at 65% 28%, #ffd49a, #ff8b3a 8%, transparent 28%), linear-gradient(160deg, #c97a3f, #2a140a)',
  'linear-gradient(180deg, #c4dabf, #4a8062 45%, #1a2818)',
  'radial-gradient(circle at 32% 45%, #ff7ec7, #b03078 22%, transparent 55%), linear-gradient(160deg, #6a1850, #14081a)',
  'linear-gradient(180deg, #ffd0a0, #d97840 38%, #5a2818 72%, #1a0c08)',
  'radial-gradient(ellipse 28% 55% at 50% 45%, rgba(180,230,255,0.72), transparent 60%), linear-gradient(160deg, #2c5a93, #050b1a)',
  'radial-gradient(ellipse 40% 52% at 50% 50%, #d4d4d4, #555 48%, #1a1a1a)',
  'linear-gradient(180deg, #4a3850, #2a1838 50%, #0a0612)',
  'radial-gradient(circle at 50% 30%, #c0d8f0, transparent 50%), linear-gradient(180deg, #284868, #08101c)',
  'radial-gradient(circle at 50% 68%, #6ad8a0, #1a5840 38%, transparent 70%), linear-gradient(180deg, #0a1410, #1a2820)',
  'linear-gradient(160deg, #f0c098, #b08068 40%, #4a3528 78%, #1a1208)',
  'radial-gradient(circle at 45% 40%, #ffe0a0, #b08040 18%, transparent 50%), linear-gradient(160deg, #5a3818, #1a0e08)',
  'linear-gradient(180deg, #d4d8dc, #6a7480 50%, #1a1e22)',
  'radial-gradient(ellipse 50% 32% at 50% 62%, #ffa080, transparent 65%), linear-gradient(180deg, #2a1410, #050202)',
  'radial-gradient(circle at 35% 50%, #d878c0, transparent 33%), radial-gradient(circle at 72% 55%, #80a0e0, transparent 35%), #0a0814',
  'linear-gradient(180deg, #a0b888, #4a6038 50%, #14180a)',
  'linear-gradient(180deg, #383838, #1a1a1a 55%, #050505)',
];

const caps = [
  'Last light', 'The orchard', 'Encore', 'Coastal', 'Mainstage', 'Studio',
  'Blue hour', 'Wide open', 'First look', 'Golden hour', 'Candlelit', 'Overcast',
  'Embers', 'Stagelights', 'Ceremony', 'After hours',
];

const cats = [
  'weddings', 'events', 'esports', 'weddings', 'esports', 'portraits',
  'weddings', 'events', 'weddings', 'weddings', 'portraits', 'events',
  'weddings', 'esports', 'weddings', 'events',
];

const types: MediaType[] = [
  'photo', 'photo', 'video', 'photo', 'video', 'photo',
  'photo', 'photo', 'photo', 'photo', 'photo', 'photo',
  'photo', 'video', 'photo', 'photo',
];

// The categories that show up as filter chips (admin will manage these later).
export const categories = ['esports', 'weddings', 'portraits', 'events'];

const TOTAL = 234;

export const photos: GalleryItem[] = Array.from({ length: TOTAL }, (_, i) => {
  const idx = i % styles.length;
  const cycle = Math.floor(i / styles.length) + 1;
  return {
    id: i + 1,
    bg: styles[idx],
    caption: caps[idx] + (cycle > 1 ? ` · ${String(cycle).padStart(2, '0')}` : ''),
    category: cats[idx],
    type: types[idx],
  };
});
