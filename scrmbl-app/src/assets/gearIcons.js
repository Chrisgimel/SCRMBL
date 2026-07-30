// Simple flat, single-color placeholder icons for the Loadout flat-lay —
// shown when a gear item has no attached photo yet. One per WORN_SLOTS id.
// currentColor fill so callers tint them via the wrapping element's color.
import React from "react";

const wrap = (children) => (
  <svg viewBox="0 0 48 48" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

export const GEAR_SLOT_ICONS = {
  head: wrap(
    <path d="M24 8c-8 0-13 6-13 13v6c0 2 1 3 3 3h20c2 0 3-1 3-3v-6c0-7-5-13-13-13z" fill="currentColor" />
  ),
  shell: wrap(
    <path d="M18 6l-9 5 3 6 4-2v25h16V15l4 2 3-6-9-5-2 3h-8l-2-3z" fill="currentColor" />
  ),
  insulation: wrap(
    <path d="M14 10h20l3 6-4 3v19H15V19l-4-3z" fill="currentColor" />
  ),
  base: wrap(
    <path d="M17 6l7 3 7-3 3 5-4 3v27H18V14l-4-3z" fill="currentColor" />
  ),
  legs: wrap(
    <path d="M15 6h18l1 20 1 14h-7l-2-19-2 19h-7l1-14z" fill="currentColor" />
  ),
  boots: wrap(
    <path d="M17 6h9v18l9 6c2 1 3 3 3 5v2H17c-2 0-3-1-3-3V6z" fill="currentColor" />
  ),
  pack: wrap(
    <path d="M15 12c0-4 3-6 9-6s9 2 9 6v4h2c2 0 3 1 3 3v16c0 2-1 3-3 3H13c-2 0-3-1-3-3V19c0-2 1-3 3-3h2z" fill="currentColor" />
  ),
};
