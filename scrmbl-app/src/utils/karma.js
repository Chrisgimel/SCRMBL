// Karma: a derived stat, computed fresh from state.logs + hike data every
// time it's read — same pattern as achievements() in helpers.js. Nothing
// is stored incrementally, so there's no separate ledger to keep in sync.
import { allHikes, hikeById, weekAnchor, DAY } from "./helpers";

const BASE_KARMA = 10;          // just for posting an entry
const GAIN_KARMA_PER_FT = 0.05; // 1000ft of gain -> 50 karma
const MILE_KARMA = 8;           // per mile hiked
export const SPOTLIGHT_MULTIPLIER = 2;

/* Only hikes with real location/elevationRank data are spotlight-eligible —
   right now that's the 4 seed hikes with a real summit elevation. Sorted
   by id for a stable, deterministic rotation order. */
export function spotlightEligible(state) {
  return allHikes(state)
    .filter((h) => h.location && h.elevationRank)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* Deterministic weekly rotation, anchored to the same "week" as Popular
   This Week — not random, so it's stable within a week and reproducible. */
export function spotlightHike(state) {
  const eligible = spotlightEligible(state);
  if (!eligible.length) return null;
  const weekIndex = Math.floor(weekAnchor() / (7 * DAY));
  return eligible[weekIndex % eligible.length];
}

export function karmaForEntry(hike, spotlightId) {
  if (!hike) return BASE_KARMA;
  const effort = (hike.gain || 0) * GAIN_KARMA_PER_FT + (hike.mi || 0) * MILE_KARMA;
  const karma = Math.round(BASE_KARMA + effort);
  return hike.id === spotlightId ? karma * SPOTLIGHT_MULTIPLIER : karma;
}

export function totalKarma(state, spotlightId) {
  return state.logs.reduce((sum, l) => sum + karmaForEntry(hikeById(state, l.hikeId), spotlightId), 0);
}
