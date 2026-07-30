// API service for SCRMBL backend
export const API_ORIGIN = 'http://localhost:3001';
const API_BASE = `${API_ORIGIN}/api`;

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

// Public profile for a handle — { handle, name }. Rejects with a 404 error
// when no account owns it, which is how UserScreen tells "real account" from
// "no such hiker".
export async function getUser(handle) {
  return apiCall(`/users/${handle}`);
}

export async function getUserGear(handle) {
  return apiCall(`/users/${handle}/gear`);
}

export async function getGear() {
  return apiCall('/gear');
}

export async function addGear(item) {
  return apiCall('/gear', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateGear(id, item) {
  return apiCall(`/gear/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function deleteGear(id) {
  return apiCall(`/gear/${id}`, { method: 'DELETE' });
}

// ============================================
// KITS API
// ============================================

export async function getKits() {
  return apiCall('/kits');
}

export async function addKit(kit) {
  return apiCall('/kits', {
    method: 'POST',
    body: JSON.stringify(kit),
  });
}

export async function updateKit(id, kit) {
  return apiCall(`/kits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(kit),
  });
}

export async function deleteKit(id) {
  return apiCall(`/kits/${id}`, { method: 'DELETE' });
}

// ============================================
// PHOTO API
// ============================================

// Trades a base64 data URI for a hosted URL. Passes non-data URLs straight
// back, so calling this on an already-uploaded photo is a no-op.
export async function uploadPhoto(dataUrl) {
  return apiCall('/photos', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  });
}

// Same contract as uploadPhoto, but the server runs background removal
// first — used for gear photos on the flat-lay Loadout view.
export async function uploadGearCutout(dataUrl) {
  return apiCall('/gear/cutout', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  });
}

// ============================================
// LOGS API
// ============================================

export async function getLogs() {
  return apiCall('/logs');
}

export async function saveLog(entry) {
  return apiCall('/logs', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function deleteLog(logId) {
  return apiCall(`/logs/${logId}`, { method: 'DELETE' });
}

export async function getUserLogs(handle) {
  return apiCall(`/users/${handle}/logs`);
}

// Everyone else's entries — the feed, trending math and trail pages read
// this. Excludes your own logs, which the client already holds.
export async function getCommunityLogs() {
  return apiCall('/community/logs');
}

// ============================================
// PROFILE API
// ============================================

// Your own editable profile — { name, handle, city, bio }.
export async function getProfile() {
  return apiCall('/profile');
}

// Saves the fields Settings can edit. The handle isn't one of them: it must
// stay unique and other users' links point at it.
export async function saveProfile({ name, city, bio }) {
  return apiCall('/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, city, bio }),
  });
}

// ============================================
// TOP HIKES API
// ============================================

export async function getTop() {
  return apiCall('/top');
}

// The whole ranked shelf goes up at once — every change is a reorder or a
// removal that shifts most positions anyway.
export async function saveTop(top) {
  return apiCall('/top', {
    method: 'PUT',
    body: JSON.stringify({ top }),
  });
}

// Everyone else's ranked shelves, keyed by handle. Powers "ranked by" on a
// trail page and the Top Hikes grid on a community profile. Excludes your
// own shelf, which the client already holds in state.top.
export async function getCommunityTop() {
  return apiCall('/community/top');
}

// ============================================
// CUSTOM HIKES API
// ============================================

export async function getCustomHikes() {
  return apiCall('/custom-hikes');
}

export async function saveCustomHike(hike) {
  return apiCall('/custom-hikes', {
    method: 'POST',
    body: JSON.stringify(hike),
  });
}

export async function deleteCustomHike(hikeId) {
  return apiCall(`/custom-hikes/${hikeId}`, { method: 'DELETE' });
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

// ============================================
// POI API (community tips/warnings/landmarks)
// ============================================

export async function getTrailPois(trailId) {
  return apiCall(`/trails/${trailId}/pois`);
}

export async function addPoi({ trail_id, lat, lng, type, title, note }) {
  return apiCall('/pois', {
    method: 'POST',
    body: JSON.stringify({ trail_id, lat, lng, type, title, note }),
  });
}

export async function deletePoi(id) {
  return apiCall(`/pois/${id}`, { method: 'DELETE' });
}
