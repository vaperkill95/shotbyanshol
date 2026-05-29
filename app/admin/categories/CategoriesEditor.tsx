'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import type { Category } from '@/lib/types';

export default function CategoriesEditor({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>(initial);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add category');
      setItems((p) => [...p, data.category]);
      setNewName('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditingName(c.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = async (c: Category) => {
    const name = editingName.trim();
    if (!name || name === c.name) {
      cancelEdit();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not rename');
      setItems((p) => p.map((it) => (it.id === c.id ? data.category : it)));
      cancelEdit();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (
      !confirm(
        `Delete "${c.name}"? Photos in this category won't be deleted — they'll just become uncategorized.`,
      )
    ) {
      return;
    }
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== c.id));
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
    } catch (err) {
      console.error(err);
      setItems(prev);
      setError('Failed to delete — restored.');
    }
  };

  return (
    <div className={styles.editorCard}>
      <form className={styles.inlineForm} onSubmit={handleAdd}>
        <input
          type="text"
          className={styles.input}
          placeholder="Add a new category (e.g. Concerts)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={50}
          disabled={busy}
        />
        <button type="submit" className={styles.primaryBtn} disabled={busy || !newName.trim()}>
          Add
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {items.length === 0 ? (
        <div className={styles.emptyMedia}>
          No categories yet. Add one above.
        </div>
      ) : (
        <ul className={styles.categoryList}>
          {items.map((c) => (
            <li key={c.id} className={styles.categoryRow}>
              {editingId === c.id ? (
                <>
                  <input
                    type="text"
                    className={styles.input}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    maxLength={50}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(c);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <button
                    className={styles.primaryBtn}
                    onClick={() => saveEdit(c)}
                    disabled={busy}
                  >
                    Save
                  </button>
                  <button className={styles.secondaryBtn} onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.categoryName}>
                    <span>{c.name}</span>
                    <span className={styles.categorySlug}>/{c.slug}</span>
                  </div>
                  <button className={styles.secondaryBtn} onClick={() => startEdit(c)}>
                    Rename
                  </button>
                  <button
                    className={styles.dangerBtn}
                    onClick={() => handleDelete(c)}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

