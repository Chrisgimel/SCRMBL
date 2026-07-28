// API service for SCRMBL backend
const API_BASE = 'http://localhost:3001/api';

// Helper function to make API calls with credentials (cookies)
async function apiCall(endpoint, options = {}) {
  try {
    console.log(`API call: ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    console.log(`API response (${response.status}):`, data);

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', endpoint, error);
    throw error;
  }
}

// ============================================
// AUTH API
// ============================================

export async function signIn(email, name) {
  return apiCall('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  });
}

export async function checkAuth() {
  return apiCall('/auth/me');
}

export async function signOut() {
  return apiCall('/auth/signout', {
    method: 'POST',
  });
}

// ============================================
// BUCKLIST API
// ============================================

export async function getBucklist() {
  return apiCall('/bucklist');
}

export async function addToBucklist(trailId) {
  return apiCall('/bucklist', {
    method: 'POST',
    body: JSON.stringify({ trail_id: trailId }),
  });
}

export async function removeFromBucklist(bucklistItemId) {
  return apiCall(`/bucklist/${bucklistItemId}`, {
    method: 'DELETE',
  });
}

export async function removeTrailFromBucklist(trailId) {
  return apiCall(`/bucklist/trail/${trailId}`, {
    method: 'DELETE',
  });
}

export async function checkInBucklist(trailId) {
  return apiCall(`/bucklist/check/${trailId}`);
}

// ============================================
// LIKES API
// ============================================

export async function getLikesForReview(reviewId) {
  return apiCall(`/likes/${reviewId}`);
}

export async function likeReview(reviewId) {
  return apiCall('/likes', {
    method: 'POST',
    body: JSON.stringify({ review_id: reviewId }),
  });
}

export async function unlikeReview(reviewId) {
  return apiCall(`/likes/${reviewId}`, {
    method: 'DELETE',
  });
}

export async function getLikeCount(reviewId) {
  return apiCall(`/likes/${reviewId}/count`);
}

// ============================================
// GEAR API
// ============================================

export async function getUserGear(handle) {
  return apiCall(`/users/${handle}/gear`);
}

// ============================================
// TRAIL API
// ============================================

export async function getTrailGeometry(trailId, { name, lat, long, mi } = {}) {
  const params = new URLSearchParams();
  if (name != null) params.set('name', name);
  if (lat != null) params.set('lat', lat);
  if (long != null) params.set('long', long);
  if (mi != null) params.set('mi', mi);
  const qs = params.toString();
  return apiCall(`/trails/${trailId}/geometry${qs ? `?${qs}` : ''}`);
}

export async function geocodeLocation(query) {
  return apiCall(`/geocode?q=${encodeURIComponent(query)}`);
}
