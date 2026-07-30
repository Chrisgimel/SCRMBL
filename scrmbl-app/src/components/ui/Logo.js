import { THEME } from "../../constants";
import Wordmark from "./Wordmark";

// Was previously a static illustrated "SCR[mountain]BL." image
// (ASSETS.wordmark) with an inline-SVG fallback behind it. Both replaced by
// one live Wordmark using the same mountain glyph as the placeholder park
// stamps (ParkStamp.js) — one brand mark instead of two different drawings.
function Logo({ size = 96 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: size * 0.22, borderRadius: size * 0.18, background: THEME.sage,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    }}>
      <Wordmark size={size * 0.34} color={THEME.ink} />
    </div>
  );
}

export default Logo;
