import React, { useState, useMemo } from "react";
import { Settings, Sparkles, Award, ArrowUp, ArrowDown, X, Bookmark, Users, UserCheck } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import StatCol from "../components/ui/StatCol";
import UnderlineTabs from "../components/ui/UnderlineTabs";
import Empty from "../components/ui/Empty";
import HikePoster from "../components/hike/HikePoster";
import Rating from "../components/ui/Rating";
import ReviewCard from "../components/hike/ReviewCard";
import RareBadge from "../components/ui/RareBadge";
import KarmaBadge from "../components/ui/KarmaBadge";
import { UI } from "../assets/images";
import { THEME, TOP_CAP, USER_BY_HANDLE } from "../constants";
import { achievements, allHikes, fmtStats, hikeById, isRareHike, userAchievements } from "../utils/helpers";
import { spotlightHike, totalKarma } from "../utils/karma";

function ProfileScreen({ state, setState, openHike, openSettings, openUser, onLog, toggleBucklist, toast, toggleLike, isLiked, getLikeCount, openBucketlistBrowser }) {
  const [tab, setTab] = useState("Top Hikes");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersTab, setFollowersTab] = useState("Followers");
  const stats = useMemo(() => achievements(state), [state]);
  const karma = useMemo(() => totalKarma(state, spotlightHike(state)?.id), [state]);
  /* Unlocked achievements rendered as the same tiny pill as the live stat
     badges (2 14ers, 1 rare trail, ...) — one unified "badges" row instead
     of a separate trophy-case section. Keeps their PNG artwork, just styled
     to match. */
  const achievementBadges = useMemo(() => userAchievements(state, allHikes(state))
    .filter((a) => a.unlocked)
    .map((a) => ({ id: a.id, icon: a.icon, label: a.title, note: `+${a.karmaValue || 0} karma` })), [state]);
  const allBadges = [...stats.badges, ...achievementBadges];

  const move = (hikeId, dir) => setState((s) => {
    const i = s.top.indexOf(hikeId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= s.top.length) return s;
    const top = [...s.top];
    [top[i], top[j]] = [top[j], top[i]];
    return { ...s, top };
  });
  const unpin = (hikeId) => setState((s) => ({ ...s, top: s.top.filter((id) => id !== hikeId) }));

  const liked = state.logs.filter((l) => l.liked);
  const diary = [...state.logs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <>
    <style>{`
      @keyframes slideUp {
        from {
          transform: translateY(40px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "18px 18px 0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="round-btn" onClick={openSettings} aria-label="Settings">
          {UI.gearIcon ? <img src={UI.gearIcon} alt="" style={{ width: 20, filter: "invert(0.85)" }} /> : <Settings size={20} color={THEME.grayLight} />}
        </button>
      </div>

      <div style={{ padding: "4px 18px 0" }}>
        <Avatar hue={state.user.hue} size={84} handle="me" />
        <div style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 700, color: THEME.grayLight, lineHeight: 1.05, marginTop: 14 }}>{state.user.name}</div>
        <div style={{ color: THEME.textDim, fontWeight: 500, marginTop: 2, fontSize: 15 }}>{state.user.city}</div>
        {state.user.bio && <div style={{ color: THEME.creamGreen, fontSize: 13.5, marginTop: 8, lineHeight: 1.45 }}>{state.user.bio}</div>}

        <KarmaBadge karma={karma} />

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0 4px", gap: 22 }}>
          <StatCol n={state.followers.length} label="Followers" onClick={() => { setShowFollowersModal(true); setFollowersTab("Followers"); }} />
          <div style={{ width: 1, height: 30, background: THEME.hairline }} />
          <StatCol n={state.following.length} label="Following" onClick={() => { setShowFollowersModal(true); setFollowersTab("Following"); }} />
        </div>

        <div className="record">
          <div className="record-row">
            <div><div className="stat-n">{stats.entries}</div><div className="stat-l">entries</div></div>
            <div><div className="stat-n">{stats.unique}</div><div className="stat-l">trails</div></div>
            <div><div className="stat-n">{stats.vert >= 1000 ? `${(stats.vert / 1000).toFixed(1)}k` : stats.vert}</div><div className="stat-l">feet up</div></div>
            <div><div className="stat-n">{Math.round(stats.miles)}</div><div className="stat-l">miles</div></div>
          </div>
          {allBadges.length > 0 ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {allBadges.map((b) => (
                <span key={b.id} className="badge" title={b.note}>
                  {typeof b.icon === "string" ? <img src={b.icon} alt="" style={{ width: 12, height: 12, borderRadius: 2 }} /> : <b.icon size={11} />}
                  {" "}{b.label}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: THEME.textDim, fontSize: 12, marginTop: 10, lineHeight: 1.45 }}>
              Log a 14er, a Class 3 route, or a trail nobody else has done, and it'll show up here.
            </div>
          )}
        </div>

        {!state.premium && (
          <div style={{ margin: "14px 0 4px" }}>
            <button className="list-row" onClick={openSettings}>
              <Sparkles size={20} color={THEME.slateMid} />
              <span style={{ flex: 1, textAlign: "left", color: THEME.grayLight, fontWeight: 600, fontSize: 16 }}>Try SCRMBL Premium</span>
              <span style={{ color: THEME.textDim, fontSize: 20 }}>›</span>
            </button>
          </div>
        )}

        <div style={{ height: 1, background: THEME.hairline, marginTop: 12, marginBottom: 12 }} />
        <div style={{ marginTop: 0 }}>
          <UnderlineTabs tabs={["Top Hikes", "Diary", "Liked", "Bucket List"]} active={tab} onChange={setTab} />
        </div>
      </div>

      <div style={{ padding: "16px 18px 18px" }}>
        {tab === "Top Hikes" && (
          <>
            <div style={{ color: THEME.textDim, fontSize: 12, marginBottom: 12, lineHeight: 1.45 }}>
              Up to {TOP_CAP} hikes, in your order. This is the shelf people read first.
            </div>
            {state.top.length === 0 ? (
              <Empty icon={Award} title="Nothing ranked yet"
                subtitle={`Pin a hike from its page or your diary. ${TOP_CAP} slots, ordered by you.`}
                action={<button className="outline-btn" onClick={() => onLog(null)}>Log a hike</button>} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {state.top.map((id, i) => {
                  const h = hikeById(state, id);
                  const best = state.logs.filter((l) => l.hikeId === id).sort((a, b) => b.rating - a.rating)[0];
                  return (
                    <div key={id} className="rank-card">
                      <div className="rank-num">{i + 1}</div>
                      <button style={{ width: 62, height: 62, borderRadius: 10, overflow: "hidden", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, position: "relative" }}
                        onClick={() => openHike(id)} aria-label={`Open ${h?.name}`}>
                        <HikePoster hike={h} />
                        {isRareHike(state, id) && <RareBadge />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h?.name}</div>
                        {best && <Rating value={best.rating} size={12} label="Your rating" />}
                        <div style={{ color: THEME.gray, fontSize: 12 }}>{fmtStats(h)}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button className="mini-btn" onClick={() => move(id, -1)} disabled={i === 0} aria-label={`Move ${h?.name} up`}><ArrowUp size={15} /></button>
                        <button className="mini-btn" onClick={() => move(id, 1)} disabled={i === state.top.length - 1} aria-label={`Move ${h?.name} down`}><ArrowDown size={15} /></button>
                      </div>
                      <button className="mini-btn" onClick={() => unpin(id)} aria-label={`Remove ${h?.name} from Top Hikes`}><X size={15} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "Diary" && (
          diary.length === 0
            ? <Empty title="No entries yet" subtitle="Every hike you log lands here — including the ones you've done twice."
                action={<button className="outline-btn" onClick={() => onLog(null)}>Log a hike</button>} />
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {diary.map((l) => (
                  <div key={l.id}>
                    <ReviewCard state={state} setState={setState} entry={{ ...l, mine: true, handle: "you" }}
                      openUser={openUser} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} hikeName={hikeById(state, l.hikeId)?.name} hike={hikeById(state, l.hikeId)} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <button className="ghost-btn" style={{ fontSize: 12 }} onClick={() => onLog(l.hikeId, l.id)}>Edit</button>
                      <button className="ghost-btn" style={{ fontSize: 12 }} onClick={() => openHike(l.hikeId)}>Trail page</button>
                      <button className="ghost-btn" style={{ fontSize: 12, color: "#E8A0A0", marginLeft: "auto" }}
                        onClick={() => setState((s) => ({ ...s, logs: s.logs.filter((x) => x.id !== l.id) }))}>Delete entry</button>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {tab === "Liked" && (
          liked.length === 0
            ? <Empty title="Nothing liked" subtitle="♥ is the quick signal — Top Hikes is the ranked shelf. Different jobs." />
            : <div className="grid3">
                {[...new Set(liked.map((l) => l.hikeId))].map((id) => {
                  const h = hikeById(state, id);
                  const best = liked.filter((l) => l.hikeId === id).sort((a, b) => b.rating - a.rating)[0];
                  return (
                    <button key={id} className="cell" onClick={() => openHike(id)}>
                      <div className="thumb" style={{ position: "relative" }}>
                        <HikePoster hike={h} />
                        {isRareHike(state, id) && <RareBadge />}
                      </div>
                      <div className="cell-name">{h?.name}</div>
                      <Rating value={best.rating} size={10} label="Your rating" />
                    </button>
                  );
                })}
              </div>
        )}

        {tab === "Bucket List" && (
          state.bucket.length === 0
            ? <Empty icon={Bookmark} title="Nothing saved" subtitle="Bookmark trails from a hike page and they wait for you here."
                action={<button className="outline-btn" onClick={openBucketlistBrowser}>Browse to add</button>} />
            : <>
                <div style={{ marginBottom: 12 }}>
                  <button className="outline-btn" style={{ width: "100%", fontSize: 14 }} onClick={openBucketlistBrowser}>
                    + Add hikes
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {state.bucket.map((id) => {
                    const h = hikeById(state, id);
                    if (!h) return null;
                    return (
                      <div key={id} className="rank-card">
                        <button style={{ width: 54, height: 54, borderRadius: 10, overflow: "hidden", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, position: "relative" }}
                          onClick={() => openHike(id)} aria-label={`Open ${h.name}`}>
                          <HikePoster hike={h} />
                          {isRareHike(state, id) && <RareBadge />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14.5 }}>{h.name}</div>
                          <div style={{ color: THEME.gray, fontSize: 12 }}>{h.area} · {fmtStats(h)}</div>
                        </div>
                        <button className="mini-btn" aria-label={`Remove ${h.name} from bucket list`}
                          onClick={async () => {
                            if (toggleBucklist) {
                              const success = await toggleBucklist(id);
                              if (!success && toast) toast("Failed to update bucket list", true);
                            } else {
                              setState((s) => ({ ...s, bucket: s.bucket.filter((b) => b !== id) }));
                            }
                          }}><X size={15} /></button>
                      </div>
                    );
                  })}
                </div>
              </>
        )}

        {showFollowersModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            padding: 20, animation: "fadeIn 0.3s ease-out"
          }} onClick={() => setShowFollowersModal(false)}>
            <div style={{
              background: THEME.surface, borderRadius: 16, width: "100%", maxWidth: 400, maxHeight: "80vh", display: "flex", flexDirection: "column", border: `1px solid ${THEME.hairline}`,
              animation: "slideUp 0.35s cubic-bezier(0.23, 1, 0.320, 1)"
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${THEME.hairline}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setFollowersTab("Followers")} style={{
                    background: "none", border: "none", padding: "8px 12px", cursor: "pointer", color: followersTab === "Followers" ? THEME.mintLight : THEME.gray, fontWeight: followersTab === "Followers" ? 600 : 400, fontSize: 14, borderBottom: followersTab === "Followers" ? `2px solid ${THEME.mintLight}` : "none"
                  }}>Followers</button>
                  <button onClick={() => setFollowersTab("Following")} style={{
                    background: "none", border: "none", padding: "8px 12px", cursor: "pointer", color: followersTab === "Following" ? THEME.mintLight : THEME.gray, fontWeight: followersTab === "Following" ? 600 : 400, fontSize: 14, borderBottom: followersTab === "Following" ? `2px solid ${THEME.mintLight}` : "none"
                  }}>Following</button>
                </div>
                <button onClick={() => setShowFollowersModal(false)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: THEME.textDim, fontSize: 24 }}>×</button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {followersTab === "Followers" && (
                  state.followers.length === 0
                    ? <Empty icon={Users} title="No followers yet" subtitle="When people follow you, they'll show up here." />
                    : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {state.followers.map((hn) => {
                          const u = USER_BY_HANDLE[hn];
                          if (!u) return null;
                          const isFollowing = state.following.includes(hn);
                          return (
                            <div key={hn} className="row-card" style={{ cursor: "default" }}>
                              <button onClick={() => { openUser(hn); setShowFollowersModal(false); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label={`${u.name}'s profile`}>
                                <Avatar hue={u.hue} size={42} handle={hn} />
                              </button>
                              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                                <button onClick={() => { openUser(hn); setShowFollowersModal(false); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%", color: THEME.grayLight, fontWeight: 600, fontSize: 14, font: "inherit" }} aria-label={`${u.name}'s profile`}>
                                  {u.name}
                                </button>
                                <div style={{ color: THEME.gray, fontSize: 12.5 }}>@{hn}</div>
                              </div>
                              <button className="follow-btn" style={{ background: "transparent", border: `1px solid ${THEME.hairline}`, color: isFollowing ? THEME.textDim : THEME.mintLight }}
                                onClick={() => setState((s) => ({
                                  ...s, following: isFollowing ? s.following.filter((x) => x !== hn) : [...s.following, hn],
                                }))}>
                                <UserCheck size={13} /> {isFollowing ? "Following" : "Follow"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                )}
                {followersTab === "Following" && (
                  state.following.length === 0
                    ? <Empty icon={Users} title="Not following anyone" subtitle="Find hikers on the Friends tab or on any trail page." />
                    : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {state.following.map((hn) => {
                          const u = USER_BY_HANDLE[hn];
                          if (!u) return null;
                          return (
                            <div key={hn} className="row-card" style={{ cursor: "default" }}>
                              <button onClick={() => { openUser(hn); setShowFollowersModal(false); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label={`${u.name}'s profile`}>
                                <Avatar hue={u.hue} size={42} handle={hn} />
                              </button>
                              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                                <button onClick={() => { openUser(hn); setShowFollowersModal(false); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%", color: THEME.grayLight, fontWeight: 600, fontSize: 14, font: "inherit" }} aria-label={`${u.name}'s profile`}>
                                  {u.name}
                                </button>
                                <div style={{ color: THEME.gray, fontSize: 12.5 }}>@{hn}</div>
                              </div>
                              <button className="follow-btn" style={{ background: "transparent", border: `1px solid ${THEME.hairline}`, color: THEME.textDim }}
                                onClick={() => setState((s) => ({ ...s, following: s.following.filter((x) => x !== hn) }))}>
                                <UserCheck size={13} /> Following
                              </button>
                            </div>
                          );
                        })}
                      </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default ProfileScreen;



