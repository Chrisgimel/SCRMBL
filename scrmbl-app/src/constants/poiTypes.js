import { THEME } from "./index";

/* Shared between AddPoiSheet (type picker), TrailMap (marker color), and
   PoiDetailSheet (type badge) so a POI's type reads consistently everywhere
   it's touched. warning uses the same red as Sheet's destructive Discard
   button, rather than adding a new color to THEME for one use. */
export const POI_TYPES = [
  { id: "tip", label: "Tip", color: THEME.slateMid },
  { id: "warning", label: "Warning", color: "#8A3B3B" },
  { id: "landmark", label: "Landmark", color: THEME.sageMid },
];

export const POI_TYPE_BY_ID = Object.fromEntries(POI_TYPES.map((t) => [t.id, t]));
