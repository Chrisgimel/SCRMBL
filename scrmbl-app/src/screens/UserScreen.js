import React, { useState, useEffect } from "react";
import { ChevronLeft, Award, Package } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import Empty from "../components/ui/Empty";
import StatCol from "../components/ui/StatCol";
import UnderlineTabs from "../components/ui/UnderlineTabs";
import HikePoster from "../components/hike/HikePoster";
import ReviewCard from "../components/hike/ReviewCard";
import RareBadge from "../components/ui/RareBadge";
import KarmaBadge from "../components/ui/KarmaBadge";

import { SLOT, THEME, USER_BY_HANDLE } from "../constants";
import { fmtStats, hikeById, isRareHike, userForHandle } from "../utils/helpers";
import { spotlightHike, totalKarmaForLogs } from "../utils/karma";
import * as api from "../utils/api";

function UserScreen({ state, setState, handle, onBack, openHike, toggleLike, isLiked, getLikeCount }) {
  const seed = USER_BY_HANDLE[handle];
  const [tab, setTab] = useState("Top Hikes");
  const [gear, setGear] = useState([]);
  const [account, setAccount] = useState(null);   // { handle, name } | null
  const [lookedUp, setLookedUp] = useState(false);

  // Real gear from the backend, replacing the old COMMUNITY_GEAR seed lookup
  useEffect(() => {
    let cancelled = false;
    api.getUserGear(handle)
      .then((g) => { if (!cancelled) setGear(g || []); })
      .catch((err) => {
        console.error('Failed to load gear for', handle, err);
        if (!cancelled) setGear([]);
      });
    return () => { cancelled = true; };
  }, [handle]);

  /* A handle can belong to a seed persona, a real account, or nothing at all.
     Only the personas are known client-side, so anyone else — a test account,
     another real user surfaced by the feed or a shelf — has to be looked up,
     or their profile reads "Hiker not found". A 404 is the genuine no-such-
     hiker case and leaves account null. */
  useEffect(() => {
    let cancelled = false;
    setAccount(null);
    setLookedUp(false);

    api.getUser(handle)
      .then((a) => { if (!cancelled) { setAccount(a); setLookedUp(true); } })
      .catch(() => { if (!cancelled) setLookedUp(true); });

    return () => { cancelled = true; };
  }, [handle]);

  // The persona record wins when there is one — it carries the city, bio and
  // avatar hue the users table doesn't store.
  const u = seed || (account && { ...userForHandle(handle), name: account.name || handle });

  if (!u) return lookedUp ? <Empty title="Hiker not found" /> : null;
  const following = state.following.includes(handle);
  const logs = (state.communityLogs || []).filter((l) => l.handle === handle).sort((a, b) => b.date.localeCompare(a.date));
  const top = (state.communityTop || {})[handle] || [];
  const vert = logs.reduce((a, l) => a + (hikeById(state, l.hikeId)?.gain || 0), 0);
  const karma = totalKarmaForLogs(logs, state, spotlightHike(state)?.id);

  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "18px 18px 0", display: "flex", justifyContent: "space-between" }}>
        <button className="round-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={20} color={THEME.grayLight} /></button>
      </div>
      <div style={{ padding: "10px 18px 0" }}>
        <Avatar hue={u.hue} size={78} handle={handle} />
        <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, color: THEME.grayLight, marginTop: 12 }}>{u.name}</div>
        {/* A real account has no city or bio stored, so neither the separator
            nor an empty bio block should render for one. */}
        <div style={{ color: THEME.textDim, fontSize: 14 }}>@{u.handle}{u.city ? ` · ${u.city}` : ""}</div>
        {u.bio && <div style={{ color: THEME.creamGreen, fontSize: 13.5, marginTop: 8, lineHeight: 1.45 }}>{u.bio}</div>}

        <KarmaBadge karma={karma} />

        <div style={{ display: "flex", gap: 22, margin: "16px 0 4px" }}>
          <StatCol n={logs.length} label="Entries" />
          <StatCol n={top.length} label="On the shelf" />
          <StatCol n={`${(vert / 1000).toFixed(1)}k′`} label="Climbed" />
        </div>

        <button className={following ? "outline-btn" : "primary-btn"} style={{ marginTop: 14 }}
          onClick={() => setState((s) => ({
            ...s, following: following ? s.following.filter((x) => x !== handle) : [...s.following, handle],
          }))}>
          {following ? "Following" : "Follow"}
        </button>

        <div style={{ marginTop: 18 }}>
          <UnderlineTabs tabs={["Top Hikes", "Reviews", "Gear"]} active={tab} onChange={setTab} />
        </div>
      </div>

      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "Top Hikes" && (top.length === 0
          ? <Empty icon={Award} title="No shelf yet" subtitle={`${u.name} hasn't ranked anything.`} />
          : top.map((id, i) => {
            const h = hikeById(state, id);
            return (
              <button key={id} className="rank-card" onClick={() => openHike(id)} style={{ border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                <div className="rank-num">{i + 1}</div>
                <div style={{ width: 58, height: 58, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                  <HikePoster hike={h} />
                  {isRareHike(state, id) && <RareBadge />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14.5 }}>{h?.name}</div>
                  <div style={{ color: THEME.gray, fontSize: 12 }}>{fmtStats(h)}</div>
                </div>
              </button>
            );
          }))}
        {tab === "Reviews" && logs.map((l) => (
          <ReviewCard key={l.id} state={state} setState={setState} entry={{ ...l, mine: false }}
            openUser={() => {}} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} hikeName={hikeById(state, l.hikeId)?.name} hike={hikeById(state, l.hikeId)} />
        ))}
        {tab === "Gear" && (
          gear.length === 0
            ? <Empty icon={Package} title="No gear yet" subtitle={`${u.name} hasn't added any gear.`} />
            : <div>
                {Object.entries(
                  gear.reduce((acc, g) => {
                    const slotLabel = SLOT[g.slot]?.label || g.slot;
                    if (!acc[slotLabel]) acc[slotLabel] = [];
                    acc[slotLabel].push(g);
                    return acc;
                  }, {})
                ).map(([slotLabel, items]) => (
                  <div key={slotLabel} style={{ marginBottom: 16 }}>
                    <div style={{ color: THEME.mintLight, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>{slotLabel}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {items.map((g) => (
                        <div key={g.id} className="rank-card" style={{ alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                            <div style={{ color: THEME.gray, fontSize: 12 }}>
                              {g.brand}{g.price ? ` · $${g.price}` : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

export default UserScreen;



