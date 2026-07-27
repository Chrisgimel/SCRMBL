import React, { useState } from "react";
import { Search, Sparkles, User as UserIcon } from "lucide-react";
import HikePoster from "../../components/hike/HikePoster";
import SpotlightCard from "../../components/hike/SpotlightCard";
import Avatar from "../../components/ui/Avatar";
import Empty from "../../components/ui/Empty";
import { THEME, SEED_USERS, COMMUNITY_LOGS } from "../../constants";
import { allHikes, isRareHike, fmtStats, weekAnchor, DAY } from "../../utils/helpers";
import { spotlightHike, karmaForEntry } from "../../utils/karma";

/* "This week" is anchored to the newest community log date rather than the
   real clock — seed data is a fixed historical window, so anchoring to
   wall-clock "now" would always show an empty week. */
function weeklyCounts() {
  const anchor = weekAnchor();
  const weekStart = anchor - 6 * DAY;
  const prevWeekStart = weekStart - 7 * DAY;
  const prevWeekEnd = weekStart - DAY;

  const thisWeek = {};
  const lastWeek = {};
  COMMUNITY_LOGS.forEach((l) => {
    const t = new Date(`${l.date}T00:00:00`).getTime();
    if (t >= weekStart && t <= anchor) thisWeek[l.hikeId] = (thisWeek[l.hikeId] || 0) + 1;
    if (t >= prevWeekStart && t <= prevWeekEnd) lastWeek[l.hikeId] = (lastWeek[l.hikeId] || 0) + 1;
  });
  return { thisWeek, lastWeek };
}

function DiscoverTab({ state, openHike, openUser }) {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();

  const hikes = allHikes(state);
  const spotlight = spotlightHike(state);

  const hikeMatches = ql ? hikes.filter((h) => h.name.toLowerCase().includes(ql) || h.area.toLowerCase().includes(ql)) : [];
  const peopleMatches = ql ? SEED_USERS.filter((u) => u.handle.toLowerCase().includes(ql) || u.name.toLowerCase().includes(ql)) : [];

  /* Each section is a full 3x3 grid. With the threshold-based near/far cutoffs
     Near You and Far Out would sometimes come up short of 9, so both rank the
     full set of hikes with a tripMiles value and take the top 9 — no hard
     cutoff. Same idea for Popular/On the Climb: rank ALL hikes (zero-activity
     ones sort last, broken by all-time log count) instead of filtering first,
     so the grid still fills even when few hikes have real weekly activity. */
  const withTripMiles = hikes.filter((h) => h.tripMiles != null);
  const nearYou = [...withTripMiles].sort((a, b) => a.tripMiles - b.tripMiles).slice(0, 9);
  const farOut = [...withTripMiles].sort((a, b) => b.tripMiles - a.tripMiles).slice(0, 9);

  const { thisWeek, lastWeek } = weeklyCounts();
  const totalLogCount = {};
  COMMUNITY_LOGS.forEach((l) => { totalLogCount[l.hikeId] = (totalLogCount[l.hikeId] || 0) + 1; });

  const popularThisWeek = [...hikes]
    .sort((a, b) => ((thisWeek[b.id] || 0) - (thisWeek[a.id] || 0)) || ((totalLogCount[b.id] || 0) - (totalLogCount[a.id] || 0)))
    .slice(0, 9);

  const onTheClimb = [...hikes]
    .sort((a, b) => {
      const deltaA = (thisWeek[a.id] || 0) - (lastWeek[a.id] || 0);
      const deltaB = (thisWeek[b.id] || 0) - (lastWeek[b.id] || 0);
      return (deltaB - deltaA) || ((totalLogCount[b.id] || 0) - (totalLogCount[a.id] || 0));
    })
    .slice(0, 9);

  const Grid = ({ list }) => (
    <div className="grid3">
      {list.map((h) => {
        const rare = isRareHike(state, h.id);
        return (
          <button key={h.id} className="cell" onClick={() => openHike(h.id)}>
            <div className="thumb" style={{ position: "relative" }}>
              <HikePoster hike={h} />
              {rare && <div className="rare-flag"><Sparkles size={9} /> Rare</div>}
            </div>
            <div className="cell-name">{h.name}</div>
          </button>
        );
      })}
    </div>
  );

  const Section = ({ title, subtitle, list }) => (list.length === 0 ? null : (
    <div style={{ marginBottom: 20 }}>
      <div className="section-title" style={{ marginTop: 0 }}>{title}</div>
      {subtitle && <div style={{ color: THEME.textDim, fontSize: 12, marginTop: -6, marginBottom: 10 }}>{subtitle}</div>}
      <Grid list={list} />
    </div>
  ));

  return (
    <div style={{ padding: "16px 18px 16px" }}>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={THEME.gray} style={{ position: "absolute", left: 12, top: 13 }} />
        <input className="field" style={{ paddingLeft: 36, marginBottom: 0 }} value={q}
          onChange={(e) => setQ(e.target.value)} placeholder="Search hikes or people" aria-label="Search hikes or people" />
      </div>

      {ql ? (
        <>
          {hikeMatches.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="section-title" style={{ marginTop: 0 }}>Hikes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hikeMatches.map((h) => (
                  <button key={h.id} className="row-card" onClick={() => openHike(h.id)}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><HikePoster hike={h} /></div>
                    <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                        {isRareHike(state, h.id) && <Sparkles size={12} color={THEME.mintLight} />}
                      </div>
                      <div style={{ color: THEME.gray, fontSize: 12 }}>{h.area} · {fmtStats(h)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {peopleMatches.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="section-title" style={{ marginTop: 0 }}>People</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {peopleMatches.map((u) => (
                  <button key={u.handle} className="row-card" onClick={() => openUser(u.handle)}>
                    <Avatar hue={u.hue} size={42} handle={u.handle} />
                    <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                      <div style={{ color: THEME.grayLight, fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                      <div style={{ color: THEME.gray, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{u.handle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hikeMatches.length === 0 && peopleMatches.length === 0 && (
            <Empty icon={UserIcon} title="No results" subtitle={`Nothing matches “${q.trim()}” in hikes or people.`} />
          )}
        </>
      ) : (
        <>
          <Section title="Near you" subtitle="Curated trails within easy reach." list={nearYou} />
          {spotlight && (
            <SpotlightCard hike={spotlight} karma={karmaForEntry(spotlight, spotlight.id)}
              onClick={() => openHike(spotlight.id)} />
          )}
          <Section title="Popular this week" subtitle="What the community's been logging lately." list={popularThisWeek} />
          <Section title="On the climb" subtitle="Gaining logs fastest right now." list={onTheClimb} />
          <Section title="Far out" subtitle="Worth the drive — plan a trip." list={farOut} />
        </>
      )}
    </div>
  );
}

export default DiscoverTab;
