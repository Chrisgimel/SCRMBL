import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

/**
 * Custom hook to manage a trail's POIs (community tips/warnings/landmarks)
 * with backend sync. Unlike GPS tracks/photos, POIs are shared across
 * accounts, so this always reflects the server, not a local blob.
 */
export function usePois(trailId, isSignedIn) {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trailId) {
      setPois([]);
      return;
    }
    setLoading(true);
    api.getTrailPois(trailId)
      .then((data) => { setPois(data); setError(null); })
      .catch((err) => {
        console.error('Failed to load POIs:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [trailId]);

  // Add a POI. Not optimistic — the row needs a real id/author from the
  // server before it can render correctly, and this is a low-frequency action.
  const addPoi = useCallback(async ({ lat, lng, type, title, note }) => {
    if (!isSignedIn) return false;
    try {
      const created = await api.addPoi({ trail_id: trailId, lat, lng, type, title, note });
      setPois((prev) => [created, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add POI:', err);
      return false;
    }
  }, [trailId, isSignedIn]);

  const removePoi = useCallback(async (id) => {
    const prevPois = pois;
    setPois((p) => p.filter((x) => x.id !== id));
    try {
      await api.deletePoi(id);
      return true;
    } catch (err) {
      setPois(prevPois);
      console.error('Failed to delete POI:', err);
      return false;
    }
  }, [pois]);

  return { pois, loading, error, addPoi, removePoi };
}
