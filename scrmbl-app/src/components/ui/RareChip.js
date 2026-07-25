
import { Sparkles } from "lucide-react";

/* Inline rare-trail chip — reuses the app's .badge look. `label` omitted
   gives an icon-only compact chip (feed posts); pass label="RARE" for
   the full text version (pick lists). */
function RareChip({ label }) {
  return (
    <span className="badge" style={label ? undefined : { padding: "3px 5px", borderRadius: 6, gap: 0 }}>
      <Sparkles size={label ? 11 : 10} />
      {label}
    </span>
  );
}

export default RareChip;

