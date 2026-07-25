// Constants extracted from App.js. Data only - no logic lives here.
import { IMG, AVATAR_ME } from "../assets/images";

/* ================================================================
   SCRMBL. — for hikers, by hikers
   ----------------------------------------------------------------
   UPDATABILITY GUIDE (everything you'll want to change lives here):
   1. THEME    — every color, pulled from your palette PDF
   2. ASSETS   — drop real image URLs here (logo, hike photos, avatars).
                 Any entry left as null renders a procedural placeholder.
   3. SEED_*   — demo trails, listings, reviews. Edit freely.
   4. COPY     — user-facing strings (incl. "Yikes Cover up!")
   ================================================================ */

export const THEME = {
  // Base four from the mockup palette sheet
  sky: "#96B6C3",
  ink: "#262C27",
  sage: "#555B4F",
  slate: "#3F5969",
  // Tints & shades from the ramp sheet
  skyLight: "#C7DAE2",
  mintLight: "#CAE0CE",
  creamGreen: "#E2EDD8",
  sageMid: "#829385",
  sageDeep: "#454F47",
  slateDeep: "#243540",
  slateMid: "#5A7C92",
  nearBlack: "#0C151A",
  gray: "#9BA3A8",
  grayLight: "#EDEFF0",
  // Feed screen uses the muted purple backdrop from the mockups
  plum: "#6B5D6B",
  // Modern iOS dark-app canvas + surfaces
  canvas: "#000000",
  surface: "#141514",
  surfaceHi: "#1F211F",
  hairline: "rgba(255,255,255,0.10)",
  textDim: "#8A8F8B",
};

/* ---- embedded brand & photo assets (swap any value to update) ---- */
export const ASSETS = {
  logoUrl: null,
  wordmark: IMG.wordmark,      // SCR[mountain]BL. wordmark (login tile)
  treeLogo: IMG.treeLogo,      // SCRMB[tree] compact mark (loading)
  ridge: IMG.ridge,            // dithered ridge (login backdrop)
  mannequin: IMG.mannequin,    // gear screen figure
  gearArt: IMG.gearArt,        // gear flat-lay texture
  period: IMG.period,          // "." brand mark
  hikeImages: IMG.hikes,       // keyed by hike id — add more anytime
  listingImages: {},
  avatarImages: { me: AVATAR_ME },
};


export const COPY = {
  appName: "SCRMBL.",
  tagline: "for hikers, by hikers",
  gearEmpty: "Yikes Cover up!",
  gearEmptyCta: "Add Gear",
  commissionNote: "SCRMBL keeps 5% of each sale to keep the trail lights on.",
  adText: "Your gear deserves a second summit — list it on the SCRMBL market.",
};

/* ================================================================
   1. GEAR MODEL  (plan 3.7)
   Gear is an INVENTORY that lives on the profile. A subset is
   "featured" on the mannequin. Any items can be attached to a
   single log as the outfit worn that day.
   ================================================================ */
export const GEAR_SLOTS = [
  { id: "head", label: "Head", worn: true },
  { id: "shell", label: "Shell", worn: true },
  { id: "insulation", label: "Insulation", worn: true },
  { id: "base", label: "Baselayer", worn: true },
  { id: "legs", label: "Legs", worn: true },
  { id: "boots", label: "Boots", worn: true },
  { id: "pack", label: "Pack", worn: true },
  { id: "poles", label: "Poles", worn: false },
  { id: "traction", label: "Traction", worn: false },
  { id: "shelter", label: "Shelter", worn: false },
  { id: "sleep", label: "Sleep system", worn: false },
  { id: "stove", label: "Stove & cook", worn: false },
  { id: "other", label: "Other", worn: false },
];
export const SLOT = Object.fromEntries(GEAR_SLOTS.map((s) => [s.id, s]));
export const WORN_SLOTS = GEAR_SLOTS.filter((s) => s.worn);
export const GEAR_SOURCES = ["REI", "Amazon", "Backcountry", "Other"];

/* ================================================================
   2. RATING & EFFORT
   Ratings are stored 0–10 (half-sparks). Effort is what the hike
   FELT like to you — a separate vocabulary from the elevation
   bands used in Discover, so the two can't be confused. (plan 3.5)
   ================================================================ */
export const EFFORTS = [
  { id: "cruised", label: "Cruised it" },
  { id: "worked", label: "Worked for it" },
  { id: "brutal", label: "Brutal" },
  { id: "type2", label: "Type II fun" },
];
export const EFFORT_LABEL = Object.fromEntries(EFFORTS.map((e) => [e.id, e.label]));

/* Elevation bands are computed from trail data and never share a
   name with the user's effort rating. */
export const GAIN_BANDS = [
  { id: "b1", label: "Under 1,500′", test: (g) => g < 1500 },
  { id: "b2", label: "1,500–2,600′", test: (g) => g >= 1500 && g < 2600 },
  { id: "b3", label: "2,600–4,000′", test: (g) => g >= 2600 && g < 4000 },
  { id: "b4", label: "4,000′ and up", test: (g) => g >= 4000 },
];
export const SCRAMBLE = { 1: "Class 1 · trail", 2: "Class 2 · talus", 3: "Class 3 · hands on rock" };

/* ================================================================
   3. TRAIL DATA
   Ten hand-entered Colorado trails. A real build swaps this for a
   licensed source (see the audit) — the shape below is the
   contract: id, name, area, mi, gain, summit, klass.
   ================================================================ */
export const SEED_HIKES = [
  { id: "bierstadt", name: "Mount Bierstadt", area: "Front Range, CO", mi: 7.0, gain: 2850, summit: 14065, klass: 2, hue: 0 },
  { id: "skypond", name: "Sky Pond", area: "Rocky Mountain NP, CO", mi: 9.4, gain: 1780, summit: null, klass: 2, hue: 1 },
  { id: "quandary", name: "Quandary Peak", area: "Tenmile Range, CO", mi: 6.6, gain: 3450, summit: 14271, klass: 1, hue: 2 },
  { id: "icelakes", name: "Ice Lakes Basin", area: "San Juans, CO", mi: 8.0, gain: 2430, summit: null, klass: 1, hue: 3 },
  { id: "hanging", name: "Hanging Lake", area: "Glenwood Canyon, CO", mi: 3.2, gain: 1210, summit: null, klass: 1, hue: 4 },
  { id: "keyhole", name: "Longs Peak — Keyhole", area: "Rocky Mountain NP, CO", mi: 14.5, gain: 5100, summit: 14259, klass: 3, hue: 0 },
  { id: "bluelakes", name: "Blue Lakes Trail", area: "Sneffels Range, CO", mi: 8.6, gain: 2500, summit: null, klass: 1, hue: 1 },
  { id: "sanitas", name: "Mount Sanitas Loop", area: "Boulder, CO", mi: 3.3, gain: 1340, summit: null, klass: 1, hue: 2 },
  { id: "chicago", name: "Chicago Basin", area: "Weminuche, CO", mi: 17.0, gain: 3000, summit: null, klass: 2, hue: 3 },
  { id: "grays", name: "Grays & Torreys", area: "Front Range, CO", mi: 8.5, gain: 3600, summit: 14278, klass: 1, hue: 4 },
];

/* ================================================================
   4. THE COMMUNITY  (plan 3.1 / 3.8)
   These are OTHER hikers. They are never mixed into your logs.
   Their entries are what fill a hike page.
   ================================================================ */
export const SEED_USERS = [
  { handle: "ridgelinerachel", name: "Rachel P.", city: "Ouray, CO", hue: 1, bio: "San Juan loyalist. Will hike a long way for a cold lake." },
  { handle: "talus.tom", name: "Tom V.", city: "Golden, CO", hue: 3, bio: "Slow ascents, long lunches, no summit fever." },
  { handle: "cairn_queen", name: "Maya L.", city: "Denver, CO", hue: 0, bio: "31 of 58. Sundays are for 14ers." },
  { handle: "scree.sam", name: "Sam O.", city: "Boulder, CO", hue: 2, bio: "Trail runner who got talked into scrambling." },
  { handle: "basin.bri", name: "Bri K.", city: "Durango, CO", hue: 4, bio: "Weminuche or bust. Llama-curious." },
];
export const USER_BY_HANDLE = Object.fromEntries(SEED_USERS.map((u) => [u.handle, u]));

export const COMMUNITY_LOGS = [
  { id: "cl1", handle: "ridgelinerachel", hikeId: "icelakes", date: "2026-07-04", rating: 10, effort: "worked", review: "The upper basin is a different planet in early July. Wildflowers to the knee and that water color nobody believes in photos.", photos: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=400&h=400&fit=crop"] },
  { id: "cl2", handle: "ridgelinerachel", hikeId: "bluelakes", date: "2026-06-28", rating: 9, effort: "worked", review: "Do it midweek. The middle lake is the one worth the extra climb.", photos: ["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop"] },
  { id: "cl3", handle: "ridgelinerachel", hikeId: "skypond", date: "2026-06-11", rating: 8, effort: "worked", review: "Falls were still icy. Took the left line, wished for microspikes the whole way.", time: 300 },
  { id: "cl4", handle: "talus.tom", handleAlt: true, hikeId: "grays", date: "2026-07-06", rating: 8, effort: "worked", review: "Two summits, one parking headache. Get there before 5am or don't bother.", photos: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"] },
  { id: "cl5", handle: "talus.tom", hikeId: "bierstadt", date: "2026-06-19", rating: 7, effort: "cruised", review: "The friendliest 14er there is. Willows at the start are the worst part, which tells you everything." },
  { id: "cl6", handle: "talus.tom", hikeId: "sanitas", date: "2026-05-30", rating: 7, effort: "worked", review: "Short, steep, and honest. My default after-work punishment." },
  { id: "cl7", handle: "cairn_queen", hikeId: "quandary", date: "2026-06-30", rating: 9, effort: "worked", review: "Goats at 13,200 completely stole the show. East ridge is a highway but it earns its traffic.", photos: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1465056836643-15a5c3f00d8e?w=400&h=400&fit=crop"] },
  { id: "cl8", handle: "cairn_queen", hikeId: "keyhole", date: "2026-07-09", rating: 10, effort: "type2", review: "The Ledges will rearrange your relationship with exposure. Turned around twice in past years — this one counted.", photos: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop"] },
  { id: "cl9", handle: "cairn_queen", hikeId: "grays", date: "2026-06-14", rating: 7, effort: "cruised", review: "Good early-season legs check. Torreys is the better summit and nobody says so." },
  { id: "cl10", handle: "scree.sam", hikeId: "keyhole", date: "2026-06-27", rating: 9, effort: "brutal", review: "Left at 2am, back by noon, destroyed by 1pm. The Trough is a gravel treadmill." },
  { id: "cl11", handle: "scree.sam", hikeId: "sanitas", date: "2026-07-11", rating: 6, effort: "cruised", review: "Fine. It's a stairmaster with a view. I do it twice a week and complain every time." },
  { id: "cl12", handle: "scree.sam", hikeId: "skypond", date: "2026-05-24", rating: 9, effort: "worked", review: "Timberline Falls in snow is a genuinely different hike. Bring traction into June.", photos: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop"], time: 290 },
  { id: "cl13", handle: "basin.bri", hikeId: "chicago", date: "2026-06-22", rating: 10, effort: "brutal", review: "Three days, one train, zero regrets. The goats will eat your trekking pole grips if you let them." },
  { id: "cl14", handle: "basin.bri", hikeId: "icelakes", date: "2026-07-08", rating: 9, effort: "worked", review: "Second time here and it still doesn't look real. Island Lake if you have the legs left.", photos: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1511316695145-4992006ffddb?w=400&h=400&fit=crop"] },
  { id: "cl15", handle: "basin.bri", hikeId: "hanging", date: "2026-06-05", rating: 5, effort: "cruised", review: "Gorgeous, and you'll share every inch of it. The permit system helps more than people admit." },
  { id: "cl16", handle: "talus.tom", hikeId: "hanging", date: "2026-05-18", rating: 6, effort: "cruised", review: "Worth doing once. Bring the permit screenshot, service dies in the canyon." },
  { id: "cl17", handle: "cairn_queen", hikeId: "bierstadt", date: "2026-07-02", rating: 8, effort: "cruised", review: "Sunrise from the top with the whole Sawtooth lit up. First 14er I ever did, still on the shelf.", photos: ["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop"] },
];

/* Whose Top Hikes shelf holds what — powers "ranked by" on a hike page */
export const COMMUNITY_TOP = {
  ridgelinerachel: ["icelakes", "bluelakes", "skypond"],
  "talus.tom": ["grays", "bierstadt", "sanitas"],
  cairn_queen: ["keyhole", "quandary", "bierstadt", "grays"],
  "scree.sam": ["keyhole", "skypond"],
  "basin.bri": ["chicago", "icelakes", "bluelakes"],
};

/* Gear each community member has */
export const COMMUNITY_GEAR = {
  ridgelinerachel: [
    { id: "rr1", slot: "shell", name: "Alpha FL Jacket", brand: "Arc'teryx", price: 699, featured: true },
    { id: "rr2", slot: "pack", name: "Kestrel 48", brand: "Osprey", price: 220, featured: true },
    { id: "rr3", slot: "boots", name: "Teton 3 GTX", brand: "Merrell", price: 180, featured: true },
    { id: "rr4", slot: "base", name: "Merino 150 Baselayer", brand: "Smartwool", price: 80, featured: false },
  ],
  "talus.tom": [
    { id: "tt1", slot: "shell", name: "Outdoor Research Triolet", brand: "Outdoor Research", price: 449, featured: true },
    { id: "tt2", slot: "pack", name: "Deuter Aircontact 65+10", brand: "Deuter", price: 280, featured: true },
    { id: "tt3", slot: "boots", name: "Scarpa Mont Blanc Pro GTX", brand: "Scarpa", price: 320, featured: true },
    { id: "tt4", slot: "poles", name: "UL Flight Trek", brand: "Black Diamond", price: 130, featured: false },
  ],
  cairn_queen: [
    { id: "cq1", slot: "shell", name: "Storm10 Jacket", brand: "The North Face", price: 399, featured: true },
    { id: "cq2", slot: "pack", name: "Hiking Pack 60", brand: "Gregory", price: 240, featured: true },
    { id: "cq3", slot: "boots", name: "Speedgoat 5", brand: "Hoka", price: 160, featured: true },
    { id: "cq4", slot: "traction", name: "Microspikes", brand: "Kahtoola", price: 80, featured: false },
  ],
  "scree.sam": [
    { id: "ss1", slot: "shell", name: "Hyperlite Mountain Gear", brand: "Hyperlite", price: 285, featured: true },
    { id: "ss2", slot: "pack", name: "Osprey Stratos 34", brand: "Osprey", price: 180, featured: true },
    { id: "ss3", slot: "boots", name: "Salomon Speed Assault", brand: "Salomon", price: 170, featured: true },
  ],
  "basin.bri": [
    { id: "bb1", slot: "shell", name: "Torrentshell 3D Jacket", brand: "Patagonia", price: 339, featured: true },
    { id: "bb2", slot: "pack", name: "Peak Design Travel Backpack", brand: "Peak Design", price: 250, featured: true },
    { id: "bb3", slot: "boots", name: "Lowa Renegade GTX", brand: "Lowa", price: 260, featured: true },
    { id: "bb4", slot: "sleep", name: "Nemo Disco 15", brand: "Nemo", price: 399, featured: false },
  ],
};

export const SEED_LISTINGS = [
  { id: "l1", title: "Pocket Stove with Snow Peak fuel", price: 30, location: "Boulder", dist: 35, hue: 2, cat: "stove", kind: "sell", seller: "talus.tom", desc: "Used two seasons, burns clean.", sold: false },
  { id: "l2", title: "Camping set up! Stove + cook kit", price: 150, location: "Boulder", dist: 35, hue: 0, cat: "stove", kind: "both", lookingFor: "A 2P tent, or cash", seller: "scree.sam", desc: "Full kit, ready for the weekend.", sold: false },
  { id: "l3", title: "Vintage Eddie Bauer pack — OBO", price: 30, location: "Golden", dist: 22, hue: 1, cat: "pack", kind: "sell", seller: "talus.tom", desc: "70L external frame. Character included.", sold: false },
  { id: "l4", title: "5-gal Igloo cooler", price: 15, location: "Littleton", dist: 9, hue: 3, cat: "other", kind: "sell", seller: "cairn_queen", desc: "Trailhead hydration station.", sold: false },
  { id: "l5", title: "Sleeping pads (x3)", price: 10, location: "Black Hawk", dist: 28, hue: 4, cat: "sleep", kind: "sell", seller: "basin.bri", desc: "Foam, a little scuffed, plenty of nights left.", sold: false },
  { id: "l6", title: "Truck bed tent — JOYTUTUS 5ft", price: 120, location: "Boulder", dist: 34, hue: 0, cat: "shelter", kind: "sell", seller: "ridgelinerachel", desc: "Fits mid-size beds. Used twice.", sold: false },
  { id: "l7", title: "Kahtoola microspikes, size L", price: 45, location: "Denver", dist: 12, hue: 2, cat: "traction", kind: "trade", lookingFor: "Trekking poles or a 30L pack", seller: "cairn_queen", desc: "One season of RMNP shoulder days. Trade only.", sold: false },
  { id: "l8", title: "Osprey Exos 58 — men's M", price: 130, location: "Golden", dist: 20, hue: 3, cat: "pack", kind: "both", lookingFor: "A lighter 40L", seller: "scree.sam", desc: "Frame's perfect, hipbelt has a scuff from talus.", sold: false },
];
export const MARKET_CATS = [
  { id: "all", label: "All Marketplace" },
  { id: "pack", label: "Packs" },
  { id: "shelter", label: "Shelter" },
  { id: "sleep", label: "Sleep" },
  { id: "stove", label: "Cook" },
  { id: "traction", label: "Traction" },
  { id: "other", label: "Other" },
];
export const DIST_FILTERS = [
  { id: "any", label: "Any distance", max: Infinity },
  { id: "10", label: "Within 10 mi", max: 10 },
  { id: "25", label: "Within 25 mi", max: 25 },
  { id: "50", label: "Within 50 mi", max: 50 },
];

/* Demo fixtures — a signed-in DEMO account only, never a new one. (plan 3.8) */
export const DEMO_LOGS = [
  { id: "d1", hikeId: "skypond", rating: 10, effort: "worked", review: "Timberline Falls scramble is the whole price of admission. Glass Lake at sunrise felt unreal.", liked: true, date: "2026-06-21", photos: [], gear: [], time: 310 },
  { id: "d2", hikeId: "quandary", rating: 8, effort: "brutal", review: "East ridge is a conveyor belt of people but the goat sightings redeem it. Start pre-dawn.", liked: true, date: "2026-06-02", photos: [], gear: [] },
  { id: "d3", hikeId: "hanging", rating: 6, effort: "cruised", review: "Beautiful but you'll share it with half of Glenwood. Permits helped.", liked: false, date: "2026-05-17", photos: [], gear: [] },
  { id: "d4", hikeId: "skypond", rating: 7, effort: "cruised", review: "Second lap, hazy from the fires out west. Same trail, completely different day.", liked: false, date: "2026-07-05", photos: [], gear: [], time: 275 },
];
export const DEMO_TOP = ["skypond", "quandary"];
export const DEMO_BUCKET = ["keyhole", "chicago"];
export const DEMO_GEAR = [
  { id: "g1", slot: "shell", name: "Beta AR Jacket", brand: "Arc'teryx", price: 600, source: "REI", url: "", featured: true },
  { id: "g2", slot: "pack", name: "Exos 58", brand: "Osprey", price: 260, source: "REI", url: "", featured: true },
  { id: "g3", slot: "boots", name: "Nucleo High GTX", brand: "La Sportiva", price: 230, source: "Backcountry", url: "", featured: true },
  { id: "g4", slot: "poles", name: "Distance Carbon Z", brand: "Black Diamond", price: 170, source: "REI", url: "", featured: false },
];

export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "scrmbl-app-state-v2";
export const LEGACY_KEY = "scrmbl-app-state-v1";

export const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  signedIn: false,
  account: null,              // { email }
  premium: false,
  user: { name: "New Scrmblr", handle: "you", city: "Somewhere, CO", bio: "", hue: 2 },
  following: [],              // handles
  followers: [],              // handles
  logs: [],                   // many entries per hike (plan 3.2)
  top: [],                    // ordered hikeIds — rank IS the index (plan 1.1 / 3.4)
  bucket: [],
  customHikes: [],
  gear: [],
  kits: [],                   // named groups of gear IDs for quick-attach when logging
  likedReviewIds: [],         // reviewIds that current user has liked
  likeCounts: {},             // like counts per review
  listings: SEED_LISTINGS,
  saved: [],
  threads: [],
  sales: [],
  isDemo: false,
};
export const TOP_CAP = 5;

