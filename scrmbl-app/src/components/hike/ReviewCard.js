
import { UserCheck, UserPlus, Shirt, Heart } from "lucide-react";
import Avatar from "../ui/Avatar";
import Rating from "../ui/Rating";
import RareChip from "../ui/RareChip";
import AchievementBadge from "../ui/AchievementBadge";

import { EFFORT_LABEL, THEME } from "../../constants";
import { fmtDate, hasAltitudeBadge, hasDistanceBadge, isRareHike, photoSrc, userForHandle } from "../../utils/helpers";

function ReviewCard({ state, setState, entry, openUser, hikeName, hike, toggleLike, isLiked, getLikeCount, openPhotoViewer }) {
  const u = entry.mine ? { name: "You", hue: state.user.hue } : userForHandle(entry.handle);
  const gear = entry.mine ? (entry.gear || []).map((id) => state.gear.find((g) => g.id === id)).filter(Boolean) : [];
  const following = state.following.includes(entry.handle);
  const rare = hikeName && isRareHike && isRareHike(state, entry.hikeId);
  const hasDist = hike && hasDistanceBadge && hasDistanceBadge(hike);
  const hasAlt = hike && hasAltitudeBadge && hasAltitudeBadge(hike);
  const hasAchievements = hasDist || hasAlt;
  return (
    <div className="review-card">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={(e) => { e.stopPropagation(); !entry.mine && openUser(entry.handle); }} disabled={entry.mine}
          style={{ background: "none", border: "none", padding: 0, cursor: entry.mine ? "default" : "pointer" }}
          aria-label={entry.mine ? "Your entry" : `${u.name}'s profile`}>
          <Avatar hue={u.hue} size={36} handle={entry.mine ? "me" : entry.handle} ring={false} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); !entry.mine && openUser(entry.handle); }} disabled={entry.mine}
            style={{ background: "none", border: "none", padding: 0, cursor: entry.mine ? "default" : "pointer", textAlign: "left", width: "100%", color: THEME.grayLight, fontWeight: 600, fontSize: 13.5, font: "inherit" }}
            aria-label={entry.mine ? "Your entry" : `${u.name}'s profile`}>
            {u.name}
          </button>
          <div style={{ color: THEME.gray, fontSize: 11.5, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
            {hikeName && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                {hikeName}{rare && <RareChip />}
              </span>
            )}
            <span>{hikeName ? "· " : ""}{fmtDate(entry.date)}{entry.effort ? ` · ${EFFORT_LABEL[entry.effort]}` : ""}</span>
          </div>
        </div>
        {!entry.mine && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="follow-btn" aria-pressed={following}
              style={following ? { background: "transparent", border: `1px solid ${THEME.hairline}`, color: THEME.textDim } : undefined}
              onClick={(e) => { e.stopPropagation(); setState((s) => ({
                ...s, following: following ? s.following.filter((x) => x !== entry.handle) : [...s.following, entry.handle],
              })); }}>
              {following ? <><UserCheck size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
            </button>
            {toggleLike && (
              <button onClick={(e) => { e.stopPropagation(); toggleLike(entry.id); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: isLiked(entry.id) ? THEME.mintLight : THEME.textDim }} aria-label={isLiked(entry.id) ? "Unlike" : "Like"}>
                <Heart size={13} fill={isLiked(entry.id) ? "currentColor" : "none"} />
                {getLikeCount(entry.id) > 0 && <span style={{ fontSize: 12 }}>{getLikeCount(entry.id)}</span>}
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: 8 }}><Rating value={entry.rating} size={13} label={`${u.name}'s rating`} /></div>
      {hasAchievements && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
          {hasDist && <AchievementBadge icon="/badges/distance.png" label="Longer than 10 miles" size={11} />}
          {hasAlt && <AchievementBadge icon="/badges/altitude.png" label="Above 13,000 feet" size={11} />}
        </div>
      )}
      {entry.review && <div style={{ color: THEME.creamGreen, fontSize: 13.5, marginTop: 6, lineHeight: 1.45 }}>{entry.review}</div>}
      {entry.photos?.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {entry.photos.map((p, i) => (
            <button key={i} onClick={() => openPhotoViewer?.(photoSrc(p))} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", borderRadius: 8, overflow: "hidden" }} aria-label="View larger">
              <img src={photoSrc(p)} alt="" style={{ width: 62, height: 62, borderRadius: 8, objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
      {gear.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
          {gear.map((g) => (
            <span key={g.id} className="gear-tag"><Shirt size={9} /> {g.brand} {g.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewCard;



