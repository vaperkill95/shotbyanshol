'use client';

import { useState, useEffect, FormEvent } from 'react';
import styles from './admin.module.css';
import type { Category } from '@/lib/types';

interface MediaRow {
  id: number;
  caption: string;
  imageUrl: string | null;
  videoUrl: string | null;
  type: string;
  categoryId: number | null;
}

interface Props {
  item: MediaRow;
  categories: Category[];
  onClose: () => void;
  onSaved: (updated: MediaRow) => void;
  onDeleted: (id: number) => void;
}

export default function EditMediaModal({
  item,
  categories,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [caption, setCaption] = useState(item.caption);
  const [categoryId, setCategoryId] = useState<number | null>(item.categoryId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasChanges =
    caption.trim() !== item.caption.trim() || categoryId !== item.categoryId;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: caption.trim(), categoryId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not save');
      }
      onSaved({
        id: item.id,
        caption: data.media.caption,
        imageUrl: data.media.imageUrl,
        videoUrl: data.media.videoUrl,
        type: data.media.type,
        categoryId: data.media.categoryId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this permanently? Cannot be undone.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onDeleted(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setBusy(false);
    }
  };

  const isVideo = item.type === 'video';

  return (
    <div className={styles.editModal}>
      <div className={styles.editBackdrop} onClick={onClose} />
      <div className={styles.editCard}>
        <button
          className={styles.editClose}
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        <div className={styles.editPreview}>
          <div
            className={styles.editPreviewImg}
            style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
          />
          {isVideo && <div className={styles.editVideoBadge}>▶ VIDEO</div>}
        </div>

        <form className={styles.editForm} onSubmit={handleSave}>
          <div className={styles.editTitle}>
            Edit {isVideo ? 'video' : 'photo'}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Caption</span>
            <input
              type="text"
              className={styles.input}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="Optional caption"
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Category</span>
            <select
              className={styles.select}
              value={categoryId === null ? '' : String(categoryId)}
              onChange={(e) =>
                setCategoryId(e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {isVideo && item.videoUrl && (
            <div className={styles.editMeta}>
              <span className={styles.label}>Vimeo embed</span>
              <code className={styles.editMetaValue}>{item.videoUrl}</code>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleDelete}
              disabled={busy}
            >
              Delete
            </button>
            <div className={styles.editActionsRight}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={busy || !hasChanges}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
