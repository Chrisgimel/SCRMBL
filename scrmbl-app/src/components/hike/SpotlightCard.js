import React from "react";
import { Sparkles } from "lucide-react";
import { ASSETS, THEME } from "../../constants";

const textShadow = "0 1px 4px rgba(0,0,0,0.95), 0 0px 2px rgba(0,0,0,0.9)";

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 6, fontSize: 12, lineHeight: 1.6, textShadow }}>
      <span style={{ color: "rgba(255,255,255,0.8)" }}>{label}</span>
      <span style={{ color: "#fff", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SpotlightCard({ hike, karma, onClick }) {
  const loc = hike.location;
  const rank = hike.elevationRank;
  // Curated by hand, not derived from the hike — real per-hike cutouts
  // replace this placeholder one at a time as they're made. (see ASSETS.spotlightPeaks)
  const peakImg = ASSETS.spotlightPeaks[hike.id] || ASSETS.spotlightPeaks.default;

  return (
    <button className="spotlight-card" onClick={onClick} aria-label={`Spotlight: ${hike.name}`}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${THEME.slateDeep} 0%, ${THEME.ink} 100%)` }} />

      {/* Scrim behind the title only — keeps white text readable where the
          peak's semi-transparent edge (anti-aliasing) lightens things up. */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "80%", height: "65%", background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 75%)", pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: 16, left: 16, right: 90, zIndex: 1 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.15, textAlign: "left" }}>
          Spotlight<br />{hike.name}
        </div>
      </div>

      {/* Real cutout photo — transparent sky, opaque terrain — layered in
          front of the title so the peak visually sits in front of the text. */}
      {peakImg && (
        <img src={peakImg} alt="" aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "left bottom", zIndex: 2, pointerEvents: "none" }} />
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.8) 100%)" }} />

      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 3 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.5)", color: THEME.mintLight, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, borderRadius: 12, padding: "5px 9px" }}>
          <Sparkles size={11} /> 2X Karma
        </div>
      </div>

      <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, zIndex: 3, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
        {rank && <Stat label="Rank" value={`${rank.rank} of ${rank.of}`} />}
        {hike.summit != null && <Stat label="Elevation" value={`${hike.summit.toLocaleString()}′`} />}
        {loc && <Stat label="Range" value={loc.range} />}
        {loc && <Stat label="County" value={loc.county} />}
        {loc && <Stat label="Lat/Long" value={`${loc.lat}°, ${loc.long}°`} />}
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.8)", textShadow }}>Log this hike now for ~{karma} karma</div>
      </div>
    </button>
  );
}

export default SpotlightCard;
