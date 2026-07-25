import React, { useState } from "react";
import { Search } from "lucide-react";
import Sheet from "./Sheet";
import HikePoster from "../hike/HikePoster";
import { THEME } from "../../constants";
import { allHikes } from "../../utils/helpers";

/* Browse and add hikes to your bucketlist from a modal overlay. */
function BucketlistBrowserSheet({ state, setState, onClose, toggleBucklist, toast }) {
  const [q, setQ] = useState("");
  const all = allHikes(state);
  const matches = all.filter((h) => !state.bucket.includes(h.id) && h.name.toLowerCase().includes(q.trim().toLowerCase()));
  const results = matches.slice(0, 12);

  return (
    <Sheet title="Add to Bucket List" onClose={onClose}>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={16} color={THEME.gray} style={{ position: "absolute", left: 12, top: 13 }} />
        <input className="field" style={{ paddingLeft: 36 }} autoFocus value={q}
          onChange={(e) => setQ(e.target.value)} placeholder="Search trails..." aria-label="Search trails to add" />
      </div>
      {results.length === 0 && q.trim() ? (
        <div style={{ color: THEME.textDim, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
          No trails found matching "{q.trim()}"
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(q.trim() ? results : all.filter((h) => !state.bucket.includes(h.id)).slice(0, 12)).map((h) => (
            <button key={h.id} className="cell" onClick={async () => {
              const success = await toggleBucklist(h.id);
              if (!success) toast("Failed to add to bucket list", true);
            }}>
              <div className="thumb"><HikePoster hike={h} /></div>
              <div className="cell-name">{h.name}</div>
            </button>
          ))}
        </div>
      )}
      {results.length > 0 && results.length < matches.length && (
        <div style={{ color: THEME.textDim, fontSize: 12, textAlign: "center", marginTop: 10 }}>
          Showing {results.length} of {matches.length}
        </div>
      )}
    </Sheet>
  );
}

export default BucketlistBrowserSheet;
