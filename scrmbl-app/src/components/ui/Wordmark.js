import React from "react";
import { Mountain } from "lucide-react";
import { THEME } from "../../constants";

// "SCR[mountain]BL." — the mountain glyph stands in for the M, same icon
// used for the placeholder park stamps (ParkStamp.js) so the mark reads as
// one consistent brand element rather than two different mountain drawings.
function Wordmark({ size = 28, color = THEME.grayLight, iconColor }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      fontFamily: "var(--display)", fontWeight: 700, fontSize: size,
      letterSpacing: size * 0.04, color, lineHeight: 1,
    }}>
      SCR
      <Mountain size={Math.round(size * 0.86)} color={iconColor || color} strokeWidth={2.4}
        style={{ margin: `0 ${Math.max(1, size * 0.01)}px`, flexShrink: 0 }} />
      BL.
    </div>
  );
}

export default Wordmark;
