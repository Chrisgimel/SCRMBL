import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../utils/api';

/**
 * Custom hook to manage the Top Hikes shelf with backend sync
 * Follows useGear/useLogs: optimistic write into main state, rollback on
 * failure, current values passed in as arguments rather than read out of a
 * setState updater (an updater isn't guaranteed to run synchronously).
 *
 * Unlike gear and logs, the shelf has no per-item API. It's an ordered list
 * capped at TOP_CAP where almost every change shifts several positions, so
 * the whole array is PUT at once and the server rewrites its rows.
 */
export function useTop(isSignedIn, top, isDemo, setMainState) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Latest local values, readable inside the load effect without making it
  // re-run (and re-sync) every time the shelf changes.
  const localRef = useRef();
  localRef.current = { top, isDemo };

  // On sign-in, reconcile local and server — same rule as useLogs. The server
  // wins when it has anything, but an account signing in for the first time
  // has an empty server and possibly a curated local shelf, and adopting the
  // empty server there would erase it. Demo data is never uploaded.
  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const serverTop = await api.getTop();
        if (cancelled) return;

        const local = localRef.current;
        const hasLocalOnly = serverTop.length === 0 && !local.isDemo && (local.top || []).length > 0;

        if (!hasLocalOnly) {
          setMainState(s => ({ ...s, top: serverTop }));
          setError(null);
          return;
        }

        const saved = await api.saveTop(local.top);
        if (cancelled) return;
        setMainState(s => ({ ...s, top: saved }));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load top hikes:', err);
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isSignedIn, setMainState]);

  // Replace the shelf wholesale. Callers compute `next` from the current top
  // value they were handed, never from inside a setState updater.
  const setTop = useCallback(async (next) => {
    const prevTop = top;

    setMainState(s => ({ ...s, top: next }));

    if (!isSignedIn) return true;

    try {
      const saved = await api.saveTop(next);
      setMainState(s => ({ ...s, top: saved }));
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, top: prevTop }));
      console.error('Failed to save top hikes:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, top, setMainState]);

  return {
    loading,
    error,
    setTop,
  };
}
