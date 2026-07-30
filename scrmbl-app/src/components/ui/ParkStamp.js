import React from "react";
import { Mountain } from "lucide-react";
import { PARK_ICONS } from "../../assets/parkIcons";

// Passport-style badge for parkStamps() (utils/helpers.js). Locked parks
// render as a faint outline; unlocked ones fill in like an ink stamp. Real
// artwork drops straight in via PARK_ICONS — this placeholder is only what
// renders until that entry exists for a given park.
//
// Rings + curved caption are one SVG (viewBox 0 0 100 100); the icon is a
// plain HTML overlay on top, since nesting the lucide icon's own <svg> just
// to get it centered isn't worth the coordinate math.
// Real park stamps/patches show the specific name, not the redundant
// "National Park" suffix — the badge shape already says that. Also keeps
// long official names short enough to actually fit the curved arc.
const SUFFIXES = [" National Park", " National Monument", " State Park", " National Forest"];
function shortParkLabel(park) {
  const hit = SUFFIXES.find((s) => park.endsWith(s));
  return hit ? park.slice(0, -hit.length) : park;
}

const ARC_LEN = 32 * (150 * Math.PI / 180); // matches the path's radius/span below

function ParkStamp({ park, unlocked, size = 84 }) {
  const art = PARK_ICONS[park];
  const ink = unlocked ? "#B5463A" : "rgba(255,255,255,0.3)";
  const label = shortParkLabel(park);
  // Fit the label to the arc, then clamp so very long names still get
  // *some* readable floor rather than shrinking to nothing.
  const fontSize = Math.max(4.5, Math.min(9.5, ARC_LEN / (label.length * 0.62)));
  const arcId = `stamp-arc-${park.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size + 10, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, position: "relative", flexShrink: 0,
        transform: `rotate(${unlocked ? -6 : 0}deg)`,
        opacity: unlocked ? 1 : 0.55,
      }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke={ink} strokeWidth="3" strokeDasharray="5 4.5" />
          <circle cx="50" cy="50" r="37" fill="none" stroke={ink} strokeWidth="1" />
          <path id={arcId} d="M 19.1,58.3 A 32,32 0 0 0 80.9,58.3" fill="none" />
          <text fontFamily="var(--hand-light)" fontWeight="700" fontSize={fontSize} fill={ink} letterSpacing="0.2">
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">{label}</textPath>
          </text>
        </svg>
        {art ? (
          <img src={art} alt="" style={{
            position: "absolute", left: "50%", top: "36%", transform: "translate(-50%, -50%)",
            width: "40%", height: "40%", objectFit: "contain", borderRadius: "50%",
          }} />
        ) : (
          <div style={{
            position: "absolute", left: "50%", top: "36%", transform: "translate(-50%, -50%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mountain size={Math.round(size * 0.3)} color={ink} strokeWidth={unlocked ? 2.5 : 2} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ParkStamp;
