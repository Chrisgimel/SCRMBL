import React from "react";
import { ChevronRight } from "lucide-react";
import Sheet from "./Sheet";
import { THEME } from "../../constants";
import { POI_TYPE_BY_ID } from "../../constants/poiTypes";
import { clusterPois } from "../../utils/poiClusters";

/* Groups a hike's beta into sections by proximity (see poiClusters.js) —
   popular hikes tend to collect several notes near the same crux, and this
   surfaces that instead of making you find them one pin at a time on the
   map. Picking an entry hands off to the same PoiDetailSheet the map's
   markers already open, then closes this sheet so they don't stack. */
function PoiSectionsSheet({ pois, onSelectPoi, onClose }) {
  const clusters = clusterPois(pois);

  return (
    <Sheet title="Beta by section" onClose={onClose}>
      {clusters.length === 0 ? (
        <div style={{ color: THEME.textDim, fontSize: 13, textAlign: "center", padding: "30px 0" }}>
          No beta on this trail yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {clusters.map((cluster, i) => (
            <div key={i}>
              <div style={{ color: THEME.textDim, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
                Section {i + 1} · {cluster.pois.length} {cluster.pois.length === 1 ? "entry" : "entries"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cluster.pois.map((p) => {
                  const meta = POI_TYPE_BY_ID[p.type];
                  return (
                    <button key={p.id} className="row-card" style={{ background: THEME.surfaceHi, padding: "10px 12px" }}
                      onClick={() => { onSelectPoi(p); onClose(); }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: meta?.color || THEME.slateMid, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: THEME.grayLight, fontWeight: 600, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.title}
                        </div>
                        <div style={{ color: THEME.gray, fontSize: 11.5 }}>By {p.author}</div>
                      </div>
                      <ChevronRight size={15} color={THEME.textDim} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export default PoiSectionsSheet;
