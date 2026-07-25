import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

/**
 * Custom hook to manage likes with backend sync
 * Tracks which reviews the user has liked
 */
export function useLikes(isSignedIn, likedReviewIds, likeCounts, setMainState) {
  const [likedReviews, setLikedReviews] = useState(new Set(likedReviewIds || []));
  const [localLikeCounts, setLocalLikeCounts] = useState(likeCounts || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load likes from server when user signs in
  useEffect(() => {
    if (!isSignedIn) {
      setLikedReviews(new Set());
      setLocalLikeCounts({});
      return;
    }

    // Sync from main state
    if (likedReviewIds && likedReviewIds.length > 0) {
      setLikedReviews(new Set(likedReviewIds));
    } else {
      setLikedReviews(new Set());
    }
    if (likeCounts && Object.keys(likeCounts).length > 0) {
      setLocalLikeCounts(likeCounts);
    } else {
      setLocalLikeCounts({});
    }
  }, [isSignedIn, likedReviewIds, likeCounts]);

  // Get likes for a specific review
  const getLikesForReview = useCallback(async (reviewId) => {
    try {
      const likes = await api.getLikesForReview(reviewId);
      const count = likes.length;
      setLocalLikeCounts(prev => ({ ...prev, [reviewId]: count }));
      if (setMainState) {
        setMainState(s => ({
          ...s,
          likeCounts: { ...(s.likeCounts || {}), [reviewId]: count }
        }));
      }
      return count;
    } catch (err) {
      console.error('Failed to load likes for review:', err);
      setError(err.message);
      return 0;
    }
  }, [setMainState]);

  // Like a review
  const likeReview = useCallback(async (reviewId) => {
    if (!isSignedIn) {
      console.warn('Not signed in - cannot like review');
      return false;
    }

    // Optimistic update
    setLikedReviews(prev => new Set([...prev, reviewId]));
    setLocalLikeCounts(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));

    // Sync to main state
    if (setMainState) {
      setMainState(s => ({
        ...s,
        likedReviewIds: [...(s.likedReviewIds || []), reviewId],
        likeCounts: { ...(s.likeCounts || {}), [reviewId]: (s.likeCounts?.[reviewId] || 0) + 1 }
      }));
    }

    try {
      await api.likeReview(reviewId);
      return true;
    } catch (err) {
      // Rollback on error
      setLikedReviews(prev => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
      setLocalLikeCounts(prev => ({
        ...prev,
        [reviewId]: Math.max(0, (prev[reviewId] || 1) - 1)
      }));
      if (setMainState) {
        setMainState(s => ({
          ...s,
          likedReviewIds: (s.likedReviewIds || []).filter(id => id !== reviewId),
          likeCounts: { ...(s.likeCounts || {}), [reviewId]: Math.max(0, (s.likeCounts?.[reviewId] || 1) - 1) }
        }));
      }
      console.error('Failed to like review:', err);
      return false;
    }
  }, [isSignedIn, setMainState]);

  // Unlike a review
  const unlikeReview = useCallback(async (reviewId) => {
    if (!isSignedIn) return false;

    // Optimistic update
    setLikedReviews(prev => {
      const next = new Set(prev);
      next.delete(reviewId);
      return next;
    });
    setLocalLikeCounts(prev => ({
      ...prev,
      [reviewId]: Math.max(0, (prev[reviewId] || 1) - 1)
    }));

    // Sync to main state
    if (setMainState) {
      setMainState(s => ({
        ...s,
        likedReviewIds: (s.likedReviewIds || []).filter(id => id !== reviewId),
        likeCounts: { ...(s.likeCounts || {}), [reviewId]: Math.max(0, (s.likeCounts?.[reviewId] || 1) - 1) }
      }));
    }

    try {
      await api.unlikeReview(reviewId);
      return true;
    } catch (err) {
      // Rollback on error
      setLikedReviews(prev => new Set([...prev, reviewId]));
      setLocalLikeCounts(prev => ({
        ...prev,
        [reviewId]: (prev[reviewId] || 0) + 1
      }));
      if (setMainState) {
        setMainState(s => ({
          ...s,
          likedReviewIds: [...(s.likedReviewIds || []), reviewId],
          likeCounts: { ...(s.likeCounts || {}), [reviewId]: (s.likeCounts?.[reviewId] || 0) + 1 }
        }));
      }
      console.error('Failed to unlike review:', err);
      return false;
    }
  }, [isSignedIn, setMainState]);

  // Toggle like on a review
  const toggleLike = useCallback(async (reviewId) => {
    const isLiked = likedReviews.has(reviewId);
    if (isLiked) {
      return await unlikeReview(reviewId);
    } else {
      return await likeReview(reviewId);
    }
  }, [likedReviews, likeReview, unlikeReview]);

  // Check if review is liked
  const isLiked = useCallback((reviewId) => {
    return likedReviews.has(reviewId);
  }, [likedReviews]);

  // Get like count for a review
  const getLikeCount = useCallback((reviewId) => {
    return localLikeCounts[reviewId] || 0;
  }, [localLikeCounts]);

  return {
    likedReviews,
    likeCounts: localLikeCounts,
    loading,
    error,
    likeReview,
    unlikeReview,
    toggleLike,
    isLiked,
    getLikeCount,
    getLikesForReview,
  };
}
