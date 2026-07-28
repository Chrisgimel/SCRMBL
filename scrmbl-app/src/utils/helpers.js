// Extracted from App.js.
import { Award, Flag, Mountain, Sparkles, TrendingUp } from "lucide-react";
import { THEME, SEED_HIKES, COMMUNITY_LOGS, COMMUNITY_TOP } from "../constants";

/* ---------------- helpers ---------------- */
export const POSTER_PALETTES = [
  [THEME.slateDeep, THEME.slateMid, THEME.skyLight],
  [THEME.sageDeep, THEME.sageMid, THEME.mintLight],
  [THEME.ink, THEME.sage, THEME.creamGreen],
  [THEME.nearBlack, THEME.slate, THEME.sky],
  [THEME.sageDeep, "#767E6E", THEME.grayLight],
];
export const seededRand = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  return (n) => { h = (h * 137 + 71) % 997; return (h / 997) * n; };
};
export const uid = (p = "x") => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* Photos are usually a plain data-URL/URL string (seed/community data, and
   every entry logged before Phase 3 geotagging). PhotoPicker now emits
   {src, lat, lng} for newly-added photos so a pin can be placed on the
   map — these two helpers let every render site accept either shape. */
export const photoSrc = (p) => (typeof p === "string" ? p : p.src);
export const photoGeo = (p) => (p && typeof p === "object" && p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null);

export function allHikes(state) { return [...SEED_HIKES, ...state.customHikes]; }
export function hikeById(state, id) { return allHikes(state).find((h) => h.id === id); }

/* "This week" anchors to the newest community log date rather than the
   real clock — seed data is a fixed historical window, so anchoring to
   wall-clock "now" would always show an empty week. Shared by Discover's
   "Popular this week" and the Spotlight rotation so both move together. */
export const DAY = 24 * 60 * 60 * 1000;
export function weekAnchor() {
  const times = COMMUNITY_LOGS.map((l) => new Date(`${l.date}T00:00:00`).getTime());
  return times.length ? Math.max(...times) : Date.now();
}
export const hasStats = (h) => !!h && h.gain != null && h.mi != null;
export const fmtStats = (h) => (hasStats(h) ? `${h.mi} mi · ${h.gain.toLocaleString()}′` : "Stats not added");
export const ratingOut = (r) => (r / 2).toFixed(r % 2 === 0 ? 0 : 1);
export const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

/* Everyone's entries for a hike — yours and the community's, one shape. */
export function entriesFor(state, hikeId) {
  const mine = state.logs.filter((l) => l.hikeId === hikeId).map((l) => ({ ...l, handle: "you", mine: true }));
  const theirs = COMMUNITY_LOGS.filter((l) => l.hikeId === hikeId).map((l) => ({ ...l, mine: false }));
  return [...mine, ...theirs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
export function aggregate(state, hikeId) {
  const all = entriesFor(state, hikeId).filter((e) => e.rating > 0);
  if (!all.length) return { avg: 0, count: 0, hikers: 0 };
  const hikers = new Set(all.map((e) => e.handle)).size;
  return { avg: all.reduce((a, e) => a + e.rating, 0) / all.length, count: all.length, hikers };
}
export function rankedBy(hikeId) {
  return Object.entries(COMMUNITY_TOP)
    .map(([handle, list]) => ({ handle, rank: list.indexOf(hikeId) + 1 }))
    .filter((x) => x.rank > 0)
    .sort((a, b) => a.rank - b.rank);
}
/* Rarity: how many distinct people have logged it at all. (plan 4 — skill/niche) */
export function rarityOf(state, hikeId) {
  const hikers = new Set(COMMUNITY_LOGS.filter((l) => l.hikeId === hikeId).map((l) => l.handle));
  const n = hikers.size;
  if (n === 0) return { level: "unlogged", label: "Nobody's logged this", n };
  if (n === 1) return { level: "rare", label: "Only 1 scrmblr has logged this", n };
  if (n <= 2) return { level: "uncommon", label: `${n} scrmblrs have logged this`, n };
  return { level: "common", label: `${n} scrmblrs have logged this`, n };
}
/* Badge-eligible rarity — same bar as rarityOf, but a custom route you
   made up yourself is trivially "unlogged" and shouldn't earn the badge. */
export function isRareHike(state, hikeId) {
  return !hikeId.startsWith("c") && rarityOf(state, hikeId).n <= 1;
}

/* ================================================================
   PER-ENTRY BADGES — Fastest, PR. Per-trail badges — Distance (>10mi),
   Altitude (>13k ft). Rare lives above; these follow the same pattern:
   pure functions over state + static hike data. (plan 9, simplified)
   ================================================================ */

/* Fastest: the quickest recorded time for a trail, across the whole
   community and you — only entries with a logged time compete. */
export function fastestEntryFor(state, hikeId) {
  const all = [
    ...COMMUNITY_LOGS.filter((l) => l.hikeId === hikeId && l.time != null),
    ...state.logs.filter((l) => l.hikeId === hikeId && l.time != null),
  ];
  if (!all.length) return null;
  return all.reduce((best, l) => (l.time < best.time ? l : best));
}
export function isFastestEntry(state, entry) {
  if (entry.time == null) return false;
  const fastest = fastestEntryFor(state, entry.hikeId);
  return !!fastest && fastest.id === entry.id;
}

/* PR: this entry beat every one of your own earlier attempts at the
   same trail. A first-ever attempt has nothing to beat, so it never
   qualifies — PR is specifically about your personal best time. */
export function isPR(state, entry) {
  if (entry.time == null) return false;
  const priorTimes = state.logs
    .filter((l) => l.hikeId === entry.hikeId && l.time != null && l.date < entry.date)
    .map((l) => l.time);
  return priorTimes.length > 0 && entry.time < Math.min(...priorTimes);
}

/* Distance badge — static per-trail, awarded for hikes longer than 10 miles. */
export function hasDistanceBadge(hike) {
  return hike && hike.mi != null && hike.mi > 10;
}

/* Altitude badge — static per-trail, awarded for hikes with summit > 13,000 ft. */
export function hasAltitudeBadge(hike) {
  return hike && hike.summit != null && hike.summit > 13000;
}

/* ================================================================
   PROFILE ACHIEVEMENTS — longer-term accomplishments earned over time,
   displayed on profile as a trophy case. (plan 10)
   ================================================================ */

export const ACHIEVEMENTS = [
  { id: "hikes-10", icon: "/achievements/10-hikes.png", title: "10 Hikes", karmaValue: 100, check: (s) => s.logs.length >= 10, progress: (s) => s.logs.length },
  { id: "hikes-50", icon: "/achievements/50-hikes.png", title: "50 Hikes", karmaValue: 400, check: (s) => s.logs.length >= 50, progress: (s) => s.logs.length },
  { id: "hikes-100", icon: "/achievements/13.png", title: "100 Hikes", karmaValue: 800, check: (s) => s.logs.length >= 100, progress: (s) => s.logs.length },
  { id: "miles-20", icon: "/achievements/20-miles.png", title: "20 Miles", karmaValue: 80, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const miles = s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.mi || 0), 0);
    return miles >= 20;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return Math.floor(s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.mi || 0), 0));
  }},
  { id: "miles-100", icon: "/achievements/100-miles.png", title: "100 Miles", karmaValue: 300, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const miles = s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.mi || 0), 0);
    return miles >= 100;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return Math.floor(s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.mi || 0), 0));
  }},
  { id: "miles-1000", icon: "/achievements/1000-miles.png", title: "1000 Miles", karmaValue: 1500, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const miles = s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.mi || 0), 0);
    return miles >= 1000;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return Math.floor(s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.mi || 0), 0));
  }},
  { id: "elevation-5000", icon: "/achievements/5000-ft-gained.png", title: "5000 Ft", karmaValue: 100, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const gain = s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.gain || 0), 0);
    return gain >= 5000;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return Math.floor(s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.gain || 0), 0));
  }},
  { id: "elevation-50000", icon: "/achievements/50000-ft-gained.png", title: "50000 Ft", karmaValue: 500, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const gain = s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.gain || 0), 0);
    return gain >= 50000;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return Math.floor(s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.gain || 0), 0));
  }},
  { id: "elevation-100k", icon: "/achievements/100000-ft-gained.png", title: "100000 Ft", karmaValue: 1000, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const gain = s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.gain || 0), 0);
    return gain >= 100000;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return Math.floor(s.logs.reduce((a, l) => a + (hikes[l.hikeId]?.gain || 0), 0));
  }},
  { id: "seasonal-climber", icon: "/achievements/seasonal-climber.png", title: "All Seasons", karmaValue: 250, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const seasons = new Set(s.logs.map((l) => {
      const date = new Date(l.date);
      const month = date.getMonth();
      return month < 3 ? "winter" : month < 6 ? "spring" : month < 9 ? "summer" : "fall";
    }));
    return seasons.size === 4;
  } },
  { id: "14ers-53", icon: "/achievements/all-53-14ers.png", title: "All 53 14ers", karmaValue: 2500, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const count14ers = new Set(s.logs.filter((l) => (hikes[l.hikeId]?.summit || 0) >= 14000).map((l) => l.hikeId)).size;
    return count14ers >= 53;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return new Set(s.logs.filter((l) => (hikes[l.hikeId]?.summit || 0) >= 14000).map((l) => l.hikeId)).size;
  }},
  { id: "14ers-58-technical", icon: "/achievements/the-technical-58-14ers.png", title: "58 Technical 14ers", karmaValue: 3000, check: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    const count14ers = new Set(s.logs.filter((l) => (hikes[l.hikeId]?.summit || 0) >= 14000 && (hikes[l.hikeId]?.klass || 0) >= 2).map((l) => l.hikeId)).size;
    return count14ers >= 58;
  }, progress: (s, all) => {
    const hikes = Object.fromEntries(all.map((h) => [h.id, h]));
    return new Set(s.logs.filter((l) => (hikes[l.hikeId]?.summit || 0) >= 14000 && (hikes[l.hikeId]?.klass || 0) >= 2).map((l) => l.hikeId)).size;
  }},
];

export function userAchievements(state, allHikes) {
  return ACHIEVEMENTS.map((ach) => ({
    ...ach,
    unlocked: ach.check(state, allHikes),
    progressValue: ach.progress ? ach.progress(state, allHikes) : null,
  }));
}

/* Your record — the achievement surface the pitch was missing. (plan 5) */
export function achievements(state) {
  const hikes = allHikes(state);
  const byId = Object.fromEntries(hikes.map((h) => [h.id, h]));
  const unique = [...new Set(state.logs.map((l) => l.hikeId))];
  const withStats = unique.map((id) => byId[id]).filter(hasStats);
  const vert = state.logs.reduce((a, l) => a + (byId[l.hikeId]?.gain || 0), 0);
  const miles = state.logs.reduce((a, l) => a + (byId[l.hikeId]?.mi || 0), 0);
  const fourteeners = unique.filter((id) => (byId[id]?.summit || 0) >= 14000);
  const classThree = unique.filter((id) => (byId[id]?.klass || 0) >= 3);
  const rare = unique.filter((id) => isRareHike(state, id));
  const biggest = withStats.reduce((m, h) => (!m || h.gain > m.gain ? h : m), null);
  return {
    entries: state.logs.length, unique: unique.length, vert, miles,
    fourteeners, classThree, rare, biggest,
    badges: [
      fourteeners.length && { id: "14er", icon: Mountain, label: `${fourteeners.length} 14er${fourteeners.length > 1 ? "s" : ""}`, note: fourteeners.map((id) => byId[id].name).join(", ") },
      classThree.length && { id: "c3", icon: Award, label: "Class 3 logged", note: classThree.map((id) => byId[id].name).join(", ") },
      rare.length && { id: "rare", icon: Sparkles, label: `${rare.length} rare trail${rare.length > 1 ? "s" : ""}`, note: "Almost nobody on SCRMBL has logged these" },
      vert >= 10000 && { id: "vert", icon: TrendingUp, label: `${Math.round(vert / 1000)}k vertical feet`, note: "Total climbed across every entry" },
      state.logs.length >= 5 && { id: "diary", icon: Flag, label: `${state.logs.length} entries`, note: "Your diary, not your bucket list" },
    ].filter(Boolean),
  };
}

