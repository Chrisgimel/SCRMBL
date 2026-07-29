import React, { useMemo } from "react";
import { UserPlus, Users } from "lucide-react";
import Avatar from "../../components/ui/Avatar";
import Empty from "../../components/ui/Empty";
import ReviewCard from "../../components/hike/ReviewCard";
import { THEME, SEED_USERS } from "../../constants";
import { hikeById } from "../../utils/helpers";

/* Built from the follow graph and real entries — no literal activity strings. */
function FriendsTab({ state, setState, openHike, openUser, toggleLike, isLiked, getLikeCount, openReviewDetail, openPhotoViewer }) {
  const follow = (handle) => setState((s) => ({
    ...s,
    following: s.following.includes(handle) ? s.following.filter((h) => h !== handle) : [...s.following, handle],
  }));

  const feed = useMemo(() => (state.communityLogs || [])
    .filter((l) => state.following.includes(l.handle))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20), [state.following, state.communityLogs]);

  const suggestions = SEED_USERS.filter((u) => !state.following.includes(u.handle));

  return (
    <div style={{ padding: "16px 18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {feed.map((l) => {
        const h = hikeById(state, l.hikeId);
        return (
          <div key={l.id} onClick={() => openReviewDetail(l)} style={{ cursor: "pointer" }}>
            <ReviewCard state={state} setState={setState} entry={l} openUser={openUser}
              toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openPhotoViewer={openPhotoViewer}
              hikeName={h?.name} hike={h} />
          </div>
        );
      })}

      {feed.length === 0 && (
        <Empty icon={Users} title="Your feed is empty"
          subtitle="Follow a few scrmblrs and their entries land here." />
      )}

      {suggestions.length > 0 && (
        <>
          <div className="section-title">{feed.length ? "More scrmblrs" : "Scrmblrs to follow"}</div>
          {suggestions.map((u) => (
            <div key={u.handle} className="row-card" style={{ cursor: "default" }}>
              <button onClick={() => openUser(u.handle)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label={`${u.name}'s profile`}>
                <Avatar hue={u.hue} size={42} handle={u.handle} />
              </button>
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <button onClick={() => openUser(u.handle)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%", color: THEME.grayLight, fontWeight: 600, fontSize: 14, font: "inherit" }} aria-label={`${u.name}'s profile`}>
                  {u.name}
                </button>
                <div style={{ color: THEME.gray, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.bio}</div>
              </div>
              <button className="follow-btn" onClick={() => follow(u.handle)}>
                <UserPlus size={13} /> Follow
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default FriendsTab;
