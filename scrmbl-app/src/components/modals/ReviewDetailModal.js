import React, { useState } from "react";
import { Heart } from "lucide-react";
import Sheet from "./Sheet";
import Avatar from "../ui/Avatar";
import Rating from "../ui/Rating";
import AchievementBadge from "../ui/AchievementBadge";
import { THEME, USER_BY_HANDLE, EFFORT_LABEL } from "../../constants";
import { fmtDate, hikeById, hasDistanceBadge, hasAltitudeBadge, isFastestEntry, isPR } from "../../utils/helpers";

function ReviewDetailModal({ state, review, onClose, openHike, toggleLike, isLiked, getLikeCount, openPhotoViewer }) {
  const [explainBadge, setExplainBadge] = useState(null);
  const h = hikeById(state, review.hikeId);
  const u = USER_BY_HANDLE[review.handle] || { name: review.handle, hue: 0 };
  const hasDist = h && hasDistanceBadge(h);
  const hasAlt = h && hasAltitudeBadge(h);
  const fastest = isFastestEntry(state, review);
  const pr = isPR(state, review);
  const hasAchievements = hasDist || hasAlt || fastest || pr;

  const badges = {
    distance: { title: "Distance", desc: "Trail is longer than 10 miles" },
    altitude: { title: "Altitude", desc: "Summit elevation above 13,000 feet" },
    fastest: { title: "Fastest", desc: "Fastest logged completion time on this trail across all hikers" },
    pr: { title: "Personal Best", desc: "Your personal fastest time on this trail" },
  };

  return (
    <Sheet title={h?.name || "Review"} onClose={onClose}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <Avatar hue={u.hue} size={44} handle={review.handle} />
        <div style={{ flex: 1 }}>
          <div style={{ color: THEME.grayLight, fontWeight: 600, fontSize: 14 }}>{u.name}</div>
          <div style={{ color: THEME.gray, fontSize: 12 }}>{fmtDate(review.date)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Rating value={review.rating} size={16} label={`${u.name}'s rating`} />
        {review.effort && <div style={{ color: THEME.gray, fontSize: 12, marginTop: 6 }}>{EFFORT_LABEL[review.effort]}</div>}
      </div>

      {hasAchievements && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {hasDist && (
            <button onClick={() => setExplainBadge("distance")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <AchievementBadge icon="/badges/distance.png" label="Longer than 10 miles" size={11} />
            </button>
          )}
          {hasAlt && (
            <button onClick={() => setExplainBadge("altitude")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <AchievementBadge icon="/badges/altitude.png" label="Above 13,000 feet" size={11} />
            </button>
          )}
          {fastest && (
            <button onClick={() => setExplainBadge("fastest")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <AchievementBadge icon="/badges/fastest.png" label="Fastest completion" size={11} />
            </button>
          )}
          {pr && (
            <button onClick={() => setExplainBadge("pr")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <AchievementBadge icon="/badges/pr.png" label="Personal best time" size={11} />
            </button>
          )}
        </div>
      )}

      {explainBadge && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          padding: 20
        }} onClick={() => setExplainBadge(null)}>
          <div style={{
            background: THEME.surface, borderRadius: 16, padding: 24, maxWidth: 280, textAlign: "center", border: `1px solid ${THEME.hairline}`
          }} onClick={(e) => e.stopPropagation()}>
            <img src={`/badges/${explainBadge}.png`} alt="" style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: THEME.grayLight, marginBottom: 8 }}>{badges[explainBadge].title}</div>
            <div style={{ color: THEME.gray, fontSize: 13, lineHeight: 1.5 }}>{badges[explainBadge].desc}</div>
            <button onClick={() => setExplainBadge(null)} style={{
              background: "none", border: "none", color: THEME.mintLight, fontSize: 14, fontWeight: 600, marginTop: 16, cursor: "pointer"
            }}>Got it</button>
          </div>
        </div>
      )}

      {review.review && (
        <div style={{ color: THEME.creamGreen, fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
          {review.review}
        </div>
      )}

      {review.photos?.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {review.photos.map((p, i) => (
            <button key={i} onClick={() => openPhotoViewer(p)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: 10, overflow: "hidden" }} aria-label="View larger">
              <img src={p} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {toggleLike && (
          <button onClick={() => toggleLike(review.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: isLiked(review.id) ? THEME.mintLight : THEME.textDim }} aria-label={isLiked(review.id) ? "Unlike" : "Like"}>
            <Heart size={16} fill={isLiked(review.id) ? "currentColor" : "none"} />
            <span style={{ fontSize: 14 }}>{getLikeCount(review.id)}</span>
          </button>
        )}
        <button onClick={() => { openHike(review.hikeId); onClose(); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: THEME.mintLight, fontSize: 14, fontWeight: 600 }}>View Trail →</button>
      </div>
    </Sheet>
  );
}

export default ReviewDetailModal;
