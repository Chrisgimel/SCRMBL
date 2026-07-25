// Extracted from App.js.

/* Retailer link parsing — the real API integration lands here later.
   Today it reads what it can from the URL and says so plainly. */
export const RETAILERS = [
  { id: "rei", host: "rei.com", label: "REI" },
  { id: "amazon", host: "amazon.", label: "Amazon" },
  { id: "backcountry", host: "backcountry.com", label: "Backcountry" },
  { id: "patagonia", host: "patagonia.com", label: "Patagonia" },
  { id: "arcteryx", host: "arcteryx.com", label: "Arc'teryx" },
];
export function readProductLink(url) {
  if (!url || !url.trim()) return null;
  let u;
  try { u = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`); }
  catch { return { ok: false, reason: "That doesn't look like a web address." }; }
  const hit = RETAILERS.find((r) => u.hostname.includes(r.host));
  const slug = u.pathname.split("/").filter(Boolean).find((p) => /[a-z]{3,}-[a-z]{3,}/i.test(p));
  const guess = slug
    ? slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+\d+$/, "")
    : null;
  return { ok: true, retailer: hit ? hit.label : u.hostname.replace(/^www\./, ""), known: !!hit, guess, href: u.href };
}


