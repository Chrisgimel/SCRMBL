// Karma: a derived stat, computed fresh from state.logs + hike data every
// time it's read — same pattern as achievements() in helpers.js. Nothing
// is stored incrementally, so there's no separate ledger to keep in sync.
import { allHikes, hikeById, weekAnchor, DAY, ACHIEVEMENTS } from "./helpers";

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
  const weekIndex = Math.floor(weekAnchor(state.communityLogs) / (7 * DAY));
  return eligible[weekIndex % eligible.length];
}

export function karmaForEntry(hike, spotlightId) {
  if (!hike) return BASE_KARMA;
  const effort = (hike.gain || 0) * GAIN_KARMA_PER_FT + (hike.mi || 0) * MILE_KARMA;
  const karma = Math.round(BASE_KARMA + effort);
  return hike.id === spotlightId ? karma * SPOTLIGHT_MULTIPLIER : karma;
}

/* Generalized over an arbitrary log list so it works for "you" (state.logs)
   and for any community handle (a filtered slice of state.communityLogs) alike —
   karma has to be publicly computable for other users' profiles too. */
export function karmaForLogs(logs, state, spotlightId) {
  return logs.reduce((sum, l) => sum + karmaForEntry(hikeById(state, l.hikeId), spotlightId), 0);
}

/* One-time bonus per unlocked achievement, scaled to how hard it is to earn.
   Every ach.check() only ever reads `.logs` off the state-shaped object it's
   given, so any log list — yours or a community handle's — can be wrapped
   as { logs } and checked the same way. Re-derived every read, same as
   everything else here: no separate ledger, so a deleted log naturally
   un-unlocks the bonus it granted with nothing to keep in sync. */
export function achievementKarmaForLogs(logs, hikes) {
  return ACHIEVEMENTS.reduce((sum, ach) => sum + (ach.check({ logs }, hikes) ? (ach.karmaValue || 0) : 0), 0);
}

export function achievementKarma(state) {
  return achievementKarmaForLogs(state.logs, allHikes(state));
}

export function totalKarma(state, spotlightId) {
  return totalKarmaForLogs(state.logs, state, spotlightId);
}

/* The one karma total to use anywhere a profile is shown — yours or a
   community handle's — since both now run the exact same math. */
export function totalKarmaForLogs(logs, state, spotlightId) {
  return karmaForLogs(logs, state, spotlightId) + achievementKarmaForLogs(logs, allHikes(state));
}

/* Levels are a read of total karma, not a stored field — same "derive,
   don't track" pattern as the rest of this file. Thresholds roughly double
   each tier: early levels come quickly, the top ones take real dedication. */
export const LEVELS = [
  { level: 1, name: "Trailhead", min: 0, icon: "/ranks/trailhead.png" },
  { level: 2, name: "Day Hiker", min: 50, icon: "/ranks/day-hiker.png" },
  { level: 3, name: "Ridge Runner", min: 1500, icon: "/ranks/ridge-runner.png" },
  { level: 4, name: "Peak Bagger", min: 3000, icon: "/ranks/peak-bagger.png" },
  { level: 5, name: "Alpinist", min: 6000, icon: "/ranks/alpinist.png" },
  { level: 6, name: "Summit Chaser", min: 11000, icon: "/ranks/summit-chaser.png" },
  { level: 7, name: "Mountaineer", min: 20000, icon: "/ranks/mountaineer.png" },
];

export function karmaLevel(karma) {
  const current = [...LEVELS].reverse().find((l) => karma >= l.min) || LEVELS[0];
  const next = LEVELS[LEVELS.indexOf(current) + 1] || null;
  const progress = next ? Math.min(1, (karma - current.min) / (next.min - current.min)) : 1;
  return { ...current, next, progress, karma };
}
