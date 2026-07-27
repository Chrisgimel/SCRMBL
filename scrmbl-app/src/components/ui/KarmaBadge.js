import React from "react";
import { THEME } from "../../constants";
import { karmaLevel } from "../../utils/karma";

/* Shared by ProfileScreen (yours) and UserScreen (public) so karma reads
   identically everywhere it's shown — it's meant to be publicly comparable. */
function KarmaBadge({ karma }) {
  const { level, name, icon, next, progress } = karmaLevel(karma);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: THEME.slateDeep, borderRadius: 12, padding: "9px 12px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 16, background: "rgba(202,224,206,0.14)", flexShrink: 0, overflow: "hidden" }}>
        <img src={icon} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ color: THEME.mintLight, fontWeight: 700, fontSize: 13 }}>Lv.{level} {name}</span>
          <span style={{ color: THEME.textDim, fontSize: 11.5 }}>· {karma.toLocaleString()} karma</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress * 100}%`, background: THEME.mintLight, borderRadius: 2 }} />
        </div>
        {next && (
          <div style={{ color: THEME.textDim, fontSize: 10, marginTop: 3 }}>
            {(next.min - karma).toLocaleString()} to Lv.{next.level} {next.name}
          </div>
        )}
      </div>
    </div>
  );
}

export default KarmaBadge;
