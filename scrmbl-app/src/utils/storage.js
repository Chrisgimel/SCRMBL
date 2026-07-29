// Extracted from App.js.
import { SLOT, SCHEMA_VERSION, STORAGE_KEY, LEGACY_KEY, DEFAULT_STATE, TOP_CAP } from "../constants";

/* ---------------- persistence ---------------- */
/* window.storage only exists inside the artifact host. Fall back to
   localStorage, then to memory, so the same file runs in a real build. (plan 5) */
export const memStore = {};
export const store = {
  async get(key) {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key);
      return r ? r.value : null;
    }
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return memStore[key] ?? null;
  },
  async set(key, value) {
    if (typeof window !== "undefined" && window.storage) return window.storage.set(key, value);
    if (typeof localStorage !== "undefined") return localStorage.setItem(key, value);
    memStore[key] = value;
  },
};

export const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);
/* Shallow merge dropped every nested default the moment a field was
   added. Deep merge fixes it for good. (plan 1.3) */
export function deepMergeDefaults(defaults, saved) {
  if (!isPlainObject(defaults) || !isPlainObject(saved)) return saved === undefined ? defaults : saved;
  const out = { ...defaults };
  for (const k of Object.keys(saved)) out[k] = deepMergeDefaults(defaults[k], saved[k]);
  return out;
}

/* v1 kept one log per hike with an absolute topRank. Carry those
   people forward rather than dropping their shelf on the floor. */
export function migrate(raw) {
  if (!raw) return null;
  const v = raw.schemaVersion || 1;
  if (v >= SCHEMA_VERSION) return raw;
  const logs = (raw.logs || []).map((l, i) => ({
    id: `m${i}_${l.hikeId}`,
    hikeId: l.hikeId,
    date: l.date || new Date().toISOString().slice(0, 10),
    rating: typeof l.rating === "number" ? Math.max(0, Math.min(10, l.rating * 2)) : 0,
    effort: ({ Easy: "cruised", Moderate: "worked", Hard: "brutal", "Class 3+": "type2" })[l.difficulty] || "worked",
    review: l.review || "",
    liked: !!l.favorite,
    photos: [],
    gear: [],
  }));
  const top = (raw.logs || [])
    .filter((l) => l.topRank != null)
    .sort((a, b) => a.topRank - b.topRank)
    .map((l) => l.hikeId)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .slice(0, TOP_CAP);
  return {
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    logs,
    top,
    gear: (raw.gear || []).map((g, i) => ({ ...g, id: g.id || `mg${i}`, featured: SLOT[g.slot]?.worn ?? false })),
    user: { handle: "you", bio: "", ...(raw.user || {}) },
    following: [],
    followers: [],
    threads: [],
    sales: [],
    /* A v1 user's entries are theirs, not fixtures. Only an explicit
       "load demo" ever sets this — otherwise Settings would offer to
       clear a real diary. */
    isDemo: false,
  };
}

export async function loadPersisted() {
  try {
    let saved = await store.get(STORAGE_KEY);
    if (!saved) {
      const legacy = await store.get(LEGACY_KEY);
      if (legacy) saved = JSON.stringify(migrate(JSON.parse(legacy)));
    }
    if (saved) {
      const parsed = migrate(JSON.parse(saved));
      return deepMergeDefaults(DEFAULT_STATE, parsed);
    }
  } catch { /* first run, or unreadable save — start clean */ }
  return DEFAULT_STATE;
}
export async function persist(state) {
  /* Community data is server-owned and refetched at every launch, so keeping
     a copy here would only bloat the save and risk showing a stale feed
     before the fetch lands. */
  const { communityLogs, communityHikes, ...persisted } = state;
  await store.set(STORAGE_KEY, JSON.stringify(persisted));
}

