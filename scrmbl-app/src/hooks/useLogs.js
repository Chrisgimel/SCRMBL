import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../utils/api';

/**
 * Custom hook to manage hike logs and custom hikes with backend sync
 * Follows useGear: optimistic write into main state, rollback on failure,
 * current values passed in as arguments rather than read out of a setState
 * updater (an updater isn't guaranteed to run synchronously).
 *
 * Unlike gear, a log keeps its client-generated id — likes.review_id already
 * points at it, so renumbering server-side would orphan every existing like.
 * The server upserts on (user_id, log_id) instead.
 */
export function useLogs(isSignedIn, logs, customHikes, isDemo, setMainState) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Latest local values, readable inside the load effect without making it
  // re-run (and re-sync) every time a log changes.
  const localRef = useRef();
  localRef.current = { logs, customHikes, isDemo };

  // Swap any base64 photo for an uploaded URL, preserving the {src, lat, lng}
  // shape when a photo carries geotag data. Photos already stored as URLs
  // pass through untouched.
  const uploadPhotos = useCallback(async (photos) => {
    return Promise.all((photos || []).map(async (photo) => {
      const src = typeof photo === 'string' ? photo : photo?.src;
      if (!src || !src.startsWith('data:')) return photo;

      const { url } = await api.uploadPhoto(src);
      return typeof photo === 'string' ? url : { ...photo, src: url };
    }));
  }, []);

  // On sign-in, reconcile local and server.
  //
  // The server wins when it has anything, but an account signing in for the
  // first time has an empty server and possibly a full local diary — adopting
  // the empty server there would delete the user's hiking history. So local
  // entries are pushed up instead. Demo data is never uploaded; it's fixtures,
  // not a real diary.
  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [serverLogs, serverHikes] = await Promise.all([api.getLogs(), api.getCustomHikes()]);
        if (cancelled) return;

        const local = localRef.current;
        const hasServerData = serverLogs.length > 0 || serverHikes.length > 0;
        const hasLocalOnly = !hasServerData && !local.isDemo && (local.logs || []).length > 0;

        if (!hasLocalOnly) {
          setMainState(s => ({ ...s, logs: serverLogs, customHikes: serverHikes }));
          setError(null);
          return;
        }

        // Custom hikes first, so every log's hikeId resolves server-side.
        for (const hike of local.customHikes || []) {
          await api.saveCustomHike(hike);
        }
        for (const entry of local.logs) {
          const photos = await uploadPhotos(entry.photos);
          await api.saveLog({ ...entry, photos });
        }

        if (cancelled) return;
        const [mergedLogs, mergedHikes] = await Promise.all([api.getLogs(), api.getCustomHikes()]);
        if (cancelled) return;

        setMainState(s => ({ ...s, logs: mergedLogs, customHikes: mergedHikes }));
        setError(null);
        console.log(`Migrated ${local.logs.length} local log(s) to your account`);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load logs:', err);
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isSignedIn, setMainState, uploadPhotos]);

  // Create or update a log entry
  const saveLog = useCallback(async (entry) => {
    if (!isSignedIn) {
      console.warn('Not signed in - cannot save log');
      return false;
    }

    const prevLogs = logs;

    // Optimistic update first, with the local data URIs still in place so the
    // entry renders immediately — uploads happen behind it.
    setMainState(s => {
      const exists = s.logs.some(l => l.id === entry.id);
      return {
        ...s,
        logs: exists ? s.logs.map(l => (l.id === entry.id ? entry : l)) : [...s.logs, entry],
      };
    });

    try {
      const photos = await uploadPhotos(entry.photos);
      const saved = await api.saveLog({ ...entry, photos });

      setMainState(s => ({
        ...s,
        logs: s.logs.map(l => (l.id === entry.id ? saved : l)),
      }));
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, logs: prevLogs }));
      console.error('Failed to save log:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, logs, setMainState, uploadPhotos]);

  // Delete a log entry
  const removeLog = useCallback(async (logId) => {
    if (!isSignedIn) return false;

    const prevLogs = logs;

    setMainState(s => ({ ...s, logs: s.logs.filter(l => l.id !== logId) }));

    try {
      await api.deleteLog(logId);
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, logs: prevLogs }));
      console.error('Failed to delete log:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, logs, setMainState]);

  // Create a custom hike. Kept separate from saveLog because a route is
  // created before the entry that uses it, and has to exist server-side or
  // the log's hikeId won't resolve on another device.
  const saveCustomHike = useCallback(async (hike) => {
    if (!isSignedIn) return false;

    const prevHikes = customHikes || [];

    setMainState(s => {
      const exists = (s.customHikes || []).some(h => h.id === hike.id);
      return {
        ...s,
        customHikes: exists
          ? s.customHikes.map(h => (h.id === hike.id ? hike : h))
          : [...(s.customHikes || []), hike],
      };
    });

    try {
      await api.saveCustomHike(hike);
      return true;
    } catch (err) {
      setMainState(s => ({ ...s, customHikes: prevHikes }));
      console.error('Failed to save custom hike:', err);
      setError(err.message);
      return false;
    }
  }, [isSignedIn, customHikes, setMainState]);

  return {
    loading,
    error,
    saveLog,
    removeLog,
    saveCustomHike,
  };
}
