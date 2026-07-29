import React from "react";
import { Award, Flag, Mountain, Repeat } from "lucide-react";
import Sheet from "./Sheet";
import HikePoster from "../hike/HikePoster";
import Rating from "../ui/Rating";
import AchievementBadge from "../ui/AchievementBadge";
import { THEME } from "../../constants";
import { achievements, rarityOf, hasDistanceBadge, hasAltitudeBadge } from "../../utils/helpers";

/* The "you did it" moment the app never had. (plan 4) */
function LoggedSheet({ state, result, onClose, openHike }) {
  const { hike, wasOnBucket, firstEver, rating } = result;
  const st = achievements(state);
  const rare = rarityOf(state, hike.id);
  const isFirst = rare.n === 0;
  const hasDist = hasDistanceBadge(hike);
  const hasAlt = hasAltitudeBadge(hike);
  return (
    <Sheet title="Logged" onClose={onClose} closeLabel="Done"
      footer={<button className="primary-btn" onClick={() => { onClose(); openHike(hike.id); }}>See the trail page</button>}>
      <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
        <div style={{ width: 92, height: 92, borderRadius: 16, overflow: "hidden", margin: "0 auto 14px" }}>
          <HikePoster hike={hike} />
        </div>
        <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: THEME.grayLight }}>{hike.name}</div>
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <Rating value={rating} size={18} label="Your rating" />
        </div>
        {wasOnBucket && (
          <div style={{ color: THEME.mintLight, fontSize: 13, marginBottom: 6 }}>
            ✓ Off the bucket list — it's in your diary now.
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
          {isFirst && <span className="badge"><Flag size={11} /> First to log it</span>}
          {hike.summit >= 14000 && <span className="badge"><Mountain size={11} /> 14er · {st.fourteeners.length} total</span>}
          {hike.klass >= 3 && <span className="badge"><Award size={11} /> Class 3</span>}
          {!firstEver && <span className="badge"><Repeat size={11} /> Repeat</span>}
          {hasDist && <span className="badge"><AchievementBadge icon="/badges/distance.png" size={13} /> 10+ miles</span>}
          {hasAlt && <span className="badge"><AchievementBadge icon="/badges/altitude.png" size={13} /> 13,000+ feet</span>}
        </div>
        <div className="record-row" style={{ marginTop: 18 }}>
          <div><div className="stat-n">{st.entries}</div><div className="stat-l">entries</div></div>
          <div><div className="stat-n">{st.unique}</div><div className="stat-l">trails</div></div>
          <div><div className="stat-n">{st.vert >= 1000 ? `${(st.vert / 1000).toFixed(1)}k` : st.vert}</div><div className="stat-l">feet up</div></div>
        </div>
      </div>
    </Sheet>
  );
}

export default LoggedSheet;
