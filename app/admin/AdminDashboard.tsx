'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import styles from './admin.module.css';
import type { Category } from '@/lib/types';

interface MediaRow {
  id: number;
  caption: string;
  imageUrl: string | null;
  categoryId: number | null;
}

interface QueuedFile {
  id: string;
  name: string;
  status: 'queued' | 'compressing' | 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
}

interface Props {
  categories: Category[];
  initialMedia: MediaRow[];
}

const MAX_DIM = 2400;
const JPEG_QUALITY = 0.85;

async function compressImage(file: File): Promise<File> {
  // Already small enough — skip compression to preserve original.
  if (file.size < 600_000) return file;
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif') return file; // don't recompress GIFs

  const img = await loadImage(file);
  const { width, height } = scaledDims(img.width, img.height, MAX_DIM);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) return file;

  // If compression made it bigger somehow (small + already optimized), keep original.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.\w+$/, '.jpg');
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function scaledDims(w: number, h: number, maxDim: number) {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const ratio = w > h ? maxDim / w : maxDim / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

export default function AdminDashboard({ categories, initialMedia }: Props) {
  const [items, setItems] = useState<MediaRow[]>(initialMedia);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [category, setCategory] = useState<string>(categories[0]?.slug || 'uncategorized');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateQueueItem = (id: string, patch: Partial<QueuedFile>) => {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);

    // Add all to queue first with previews.
    const queued: QueuedFile[] = list.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      status: 'queued' as const,
      previewUrl: URL.createObjectURL(f),
    }));
    setQueue((q) => [...queued, ...q]);

    // Upload sequentially.
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const qid = queued[i].id;
      try {
        updateQueueItem(qid, { status: 'compressing' });
        const compressed = await compressImage(file);

        updateQueueItem(qid, { status: 'uploading' });
        const fd = new FormData();
        fd.append('file', compressed);
        fd.append('category', category);
        fd.append('caption', '');

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Upload failed (${res.status})`);
        }

        // Prepend the new media to the visible grid.
        setItems((prev) => [data.media as MediaRow, ...prev]);
        updateQueueItem(qid, { status: 'done' });

        // Auto-remove successful items from queue after a moment.
        setTimeout(() => {
          setQueue((q) => q.filter((it) => it.id !== qid));
        }, 1500);
      } catch (err) {
        updateQueueItem(qid, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }
  };

  const handleSelectFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== id));
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      console.error(err);
      alert('Failed to delete — restoring.');
      setItems(prev);
    }
  };

  return (
    <>
      <section className={styles.uploadCard}>
        <div className={styles.uploadHeader}>
          <div>
            <div className={styles.cardTitle}>Upload photos</div>
            <div className={styles.cardSub}>
              Drop files or click to select. Photos auto-compress on your computer before uploading.
            </div>
          </div>
          <label className={styles.categorySelector}>
            <span className={styles.label}>Assign to</span>
            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="uncategorized">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className={styles.dropzoneIcon}>↑</div>
          <div className={styles.dropzoneText}>
            <strong>Drop photos here</strong> or click to select
          </div>
          <div className={styles.dropzoneHint}>
            JPG, PNG, WebP, GIF · Multiple files OK
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={handleSelectFiles}
          />
        </div>

        {queue.length > 0 && (
          <ul className={styles.queueList}>
            {queue.map((it) => (
              <li key={it.id} className={styles.queueItem}>
                <div
                  className={styles.queueThumb}
                  style={
                    it.previewUrl ? { backgroundImage: `url(${it.previewUrl})` } : undefined
                  }
                />
                <div className={styles.queueMeta}>
                  <div className={styles.queueName}>{it.name}</div>
                  <div
                    className={`${styles.queueStatus} ${
                      it.status === 'error' ? styles.queueStatusError : ''
                    } ${it.status === 'done' ? styles.queueStatusDone : ''}`}
                  >
                    {it.status === 'queued' && 'Waiting…'}
                    {it.status === 'compressing' && 'Compressing on your device…'}
                    {it.status === 'uploading' && 'Uploading to storage…'}
                    {it.status === 'done' && 'Done ✓'}
                    {it.status === 'error' && (it.error || 'Failed')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.mediaSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Your photos</div>
          <div className={styles.sectionCount}>{items.length} total</div>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyMedia}>
            No photos uploaded yet. Drop some above to get started.
          </div>
        ) : (
          <div className={styles.mediaGrid}>
            {items.map((m) => (
              <div key={m.id} className={styles.mediaTile}>
                <div
                  className={styles.mediaThumb}
                  style={m.imageUrl ? { backgroundImage: `url(${m.imageUrl})` } : undefined}
                />
                <div className={styles.mediaOverlay}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(m.id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
                {m.caption && <div className={styles.mediaCaption}>{m.caption}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
