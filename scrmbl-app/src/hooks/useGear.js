import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

/**
 * Custom hook to manage gear and kits with backend sync
 * Mirrors useLikes: optimistic write into main state, rollback on API failure.
 *
 * Gear items are created client-side with a string id from uid("g"), but the
 * server assigns an integer primary key. On a successful create the optimistic
 * row is swapped for the server row — safe because nothing (no log, no kit)
 * can reference an item that was just made.
 *
 * Current gear/kits come in as arguments rather than being read back out of a
 * setState updater: an updater is not guaranteed to run synchronously, so
 * anything derived inside one can't be relied on by the next line.
 */
export function useGear(isSignedIn, gear, kits, setMainState) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load gear + kits from server when the user signs in
  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;
    setLoading(true);

    Promise.all([api.getGear(), api.getKits()])
      .then(([loadedGear, loadedKits]) => {
        if (cancelled) return;
        setMainState(s => ({ ...s, gear: loadedGear, kits: loadedKits }));
        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Failed to load gear:', err);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isSignedIn, setMainState]);

  // Create or update a gear item
  const saveGear = useCallback(async (item) => {
    if (!isSignedIn) {
      console.warn('Not signed in - cannot save gear');
      return false;
    }

    const isUpdate = typeof item.id === 'number';
    const prevGear = gear;

    // Optimistic update
    setMainState(s => {
      const exists = s.gear.some(g => g.id === item.id);
      return {
        ...s,
        gear: exists ? s.gear.map(g => (g.id === item.id ? item : g)) : [...s.gear, item],
      };
    });

    try {
      const saved = isUpdate
        ? await api.updateGear(item.id, item)
        : await api.addGear(item);

      // Swap the optimistic row for the server row (picks up the real id)
      setMainState(s => ({
        ...s,
        gear: s.gear.map(g => (g.id === item.id ? saved : g)),
      }));
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, gear: prevGear }));
      console.error('Failed to save gear:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, gear, setMainState]);

  // Delete a gear item, and scrub it from logs and kits
  const removeGear = useCallback(async (id) => {
    if (!isSignedIn) return false;

    let prev = null;
    setMainState(s => {
      prev = { gear: s.gear, logs: s.logs, kits: s.kits };
      return {
        ...s,
        gear: s.gear.filter(g => g.id !== id),
        logs: s.logs.map(l => ({ ...l, gear: (l.gear || []).filter(g => g !== id) })),
        kits: (s.kits || [])
          .map(k => ({ ...k, gearIds: k.gearIds.filter(g => g !== id) }))
          .filter(k => k.gearIds.length > 0),
      };
    });

    try {
      await api.deleteGear(id);
      return true;
    } catch (err) {
      // prev is only needed here, after the update has certainly been applied
      if (prev) setMainState(s => ({ ...s, ...prev }));
      console.error('Failed to delete gear:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, setMainState]);

  // Flip the featured flag on a gear item
  const toggleFeature = useCallback(async (id) => {
    if (!isSignedIn) return false;

    const current = gear.find(g => g.id === id);
    if (!current) return false;

    const next = { ...current, featured: !current.featured };
    const prevGear = gear;

    setMainState(s => ({
      ...s,
      gear: s.gear.map(g => (g.id === id ? next : g)),
    }));

    try {
      await api.updateGear(id, next);
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, gear: prevGear }));
      console.error('Failed to update gear:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, gear, setMainState]);

  // Create or update a kit
  const saveKit = useCallback(async (kit) => {
    if (!isSignedIn) return false;

    const isUpdate = typeof kit.id === 'number';
    const prevKits = kits || [];

    setMainState(s => {
      const exists = (s.kits || []).some(k => k.id === kit.id);
      return {
        ...s,
        kits: exists ? s.kits.map(k => (k.id === kit.id ? kit : k)) : [...(s.kits || []), kit],
      };
    });

    try {
      const saved = isUpdate
        ? await api.updateKit(kit.id, kit)
        : await api.addKit(kit);

      setMainState(s => ({
        ...s,
        kits: (s.kits || []).map(k => (k.id === kit.id ? saved : k)),
      }));
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, kits: prevKits }));
      console.error('Failed to save kit:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, kits, setMainState]);

  // Delete a kit
  const removeKit = useCallback(async (id) => {
    if (!isSignedIn) return false;

    const prevKits = kits || [];

    setMainState(s => ({ ...s, kits: (s.kits || []).filter(k => k.id !== id) }));

    try {
      await api.deleteKit(id);
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, kits: prevKits }));
      console.error('Failed to delete kit:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, kits, setMainState]);

  return {
    loading,
    error,
    saveGear,
    removeGear,
    toggleFeature,
    saveKit,
    removeKit,
  };
}
