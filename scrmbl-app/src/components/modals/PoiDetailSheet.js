import React, { useState } from "react";
import Sheet from "./Sheet";
import { THEME } from "../../constants";
import { POI_TYPE_BY_ID } from "../../constants/poiTypes";

function PoiDetailSheet({ poi, onDelete, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const meta = POI_TYPE_BY_ID[poi.type];

  async function handleDelete() {
    setDeleting(true);
    const ok = await onDelete();
    if (!ok) setDeleting(false);
  }

  return (
    <Sheet title="Trail tip" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
          borderRadius: 20, fontSize: 11.5, fontWeight: 700, color: THEME.grayLight,
          background: meta?.color || THEME.slateMid,
        }}>
          {meta?.label || poi.type}
        </span>
      </div>
      <div style={{ color: THEME.grayLight, fontFamily: "var(--display)", fontSize: 20, marginBottom: 6 }}>
        {poi.title}
      </div>
      {poi.note && (
        <div style={{ color: THEME.gray, fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
          {poi.note}
        </div>
      )}
      <div style={{ color: THEME.textDim, fontSize: 12 }}>
        By {poi.author} · {new Date(poi.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </div>
      {poi.is_mine && (
        <button className="outline-btn" style={{ marginTop: 18, color: "#8A3B3B", borderColor: "#8A3B3B" }}
          disabled={deleting} onClick={handleDelete}>
          {deleting ? "Removing…" : "Remove this tip"}
        </button>
      )}
    </Sheet>
  );
}

export default PoiDetailSheet;
