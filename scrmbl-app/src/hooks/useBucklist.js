import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

/**
 * Custom hook to manage bucklist with backend sync
 * Replaces the local state.bucket array with server-backed data
 */
export function useBucklist(isSignedIn) {
  const [bucklist, setBucklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load bucklist from server when user signs in
  useEffect(() => {
    if (!isSignedIn) {
      setBucklist([]);
      return;
    }

    setLoading(true);
    api.getBucklist()
      .then((data) => {
        // Convert backend format to app format (just trail_ids)
        const trailIds = data.map(item => item.trail_id);
        setBucklist(trailIds);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load bucklist:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isSignedIn]);

  // Add trail to bucklist
  const addToBucklist = useCallback(async (trailId) => {
    if (!isSignedIn) {
      console.warn('Not signed in - cannot add to bucklist');
      return false;
    }

    // Optimistic update
    setBucklist(prev => {
      if (prev.includes(trailId)) return prev;
      return [...prev, trailId];
    });

    try {
      const result = await api.addToBucklist(trailId);
      console.log('Successfully added to bucklist:', result);
      return true;
    } catch (err) {
      // Rollback on error
      setBucklist(prev => prev.filter(id => id !== trailId));
      console.error('Failed to add to bucklist:', err);
      return false;
    }
  }, [isSignedIn]);

  // Remove trail from bucklist
  const removeFromBucklist = useCallback(async (trailId) => {
    if (!isSignedIn) return false;

    // Optimistic update
    setBucklist(prev => prev.filter(id => id !== trailId));

    try {
      await api.removeTrailFromBucklist(trailId);
      return true;
    } catch (err) {
      // Rollback on error
      setBucklist(prev => [...prev, trailId]);
      console.error('Failed to remove from bucklist:', err);
      return false;
    }
  }, [isSignedIn]);

  // Toggle trail in bucklist
  const toggleBucklist = useCallback(async (trailId) => {
    const inBucklist = bucklist.includes(trailId);
    if (inBucklist) {
      return await removeFromBucklist(trailId);
    } else {
      return await addToBucklist(trailId);
    }
  }, [bucklist, addToBucklist, removeFromBucklist]);

  return {
    bucklist,
    loading,
    error,
    addToBucklist,
    removeFromBucklist,
    toggleBucklist,
  };
}
