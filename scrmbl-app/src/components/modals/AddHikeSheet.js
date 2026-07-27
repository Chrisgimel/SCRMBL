import React, { useState } from "react";
import { Bookmark, Mountain, Repeat, Search, Shirt } from "lucide-react";
import Sheet from "./Sheet";
import CreateHikeSheet from "./CreateHikeSheet";
import HikePoster from "../hike/HikePoster";
import Rating from "../ui/Rating";
import Chip from "../ui/Chip";
import RareChip from "../ui/RareChip";
import PhotoPicker from "../PhotoPicker";
import { THEME, EFFORTS, TOP_CAP } from "../../constants";
import { uid, allHikes, hikeById, fmtStats, ratingOut, isRareHike } from "../../utils/helpers";
import { spotlightHike, totalKarmaForLogs, karmaLevel } from "../../utils/karma";

/* Many entries per hike, photos, the gear you wore, and real stats
   on custom routes. (plan 1.2 / 1.4 / 3.2 / 3.3) */
function AddHikeSheet({ state, setState, onClose, presetHikeId, editLogId, toast, onLogged }) {
  const editing = editLogId ? state.logs.find((l) => l.id === editLogId) : null;
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(() => {
    const id = editing?.hikeId || presetHikeId;
    return id ? hikeById(state, id) : null;
  });
  const [creating, setCreating] = useState(null);   // { name }
  const [rating, setRating] = useState(editing?.rating || 0);
  const [effort, setEffort] = useState(editing?.effort || "worked");
  const [review, setReview] = useState(editing?.review || "");
  const [liked, setLiked] = useState(editing?.liked || false);
  const [date, setDate] = useState(editing?.date || new Date().toISOString().slice(0, 10));
  const [photos, setPhotos] = useState(editing?.photos || []);
  const [gear, setGear] = useState(editing?.gear || []);
  const [hours, setHours] = useState(editing?.time != null ? String(Math.floor(editing.time / 60)) : "");
  const [minutes, setMinutes] = useState(editing?.time != null ? String(editing.time % 60) : "");
  const [pinTop, setPinTop] = useState(() => (editing ? state.top.includes(editing.hikeId) : false));

  const prior = picked ? state.logs.filter((l) => l.hikeId === picked.id && l.id !== editLogId) : [];
  const topFull = state.top.length >= TOP_CAP && !(picked && state.top.includes(picked.id));
  const dirty = !!(review.trim() || rating || photos.length);

  const all = allHikes(state);
  const matches = all.filter((h) => h.name.toLowerCase().includes(q.trim().toLowerCase()));
  const results = matches.slice(0, 6);
  /* Dedupe against the whole list, not just the six shown. (plan 5) */
  const canCreate = q.trim().length > 2 && !matches.some((r) => r.name.toLowerCase() === q.trim().toLowerCase());

  const toggleBucket = (id) => setState((s) => ({
    ...s, bucket: s.bucket.includes(id) ? s.bucket.filter((b) => b !== id) : [...s.bucket, id],
  }));

  const save = () => {
    const wasOnBucket = state.bucket.includes(picked.id);
    const firstEver = !editing && !state.logs.some((l) => l.hikeId === picked.id);
    const time = hours.trim() || minutes.trim() ? (Number(hours) || 0) * 60 + (Number(minutes) || 0) : null;
    const entry = {
      id: editing?.id || uid("l"), hikeId: picked.id, date, rating, effort,
      review: review.trim(), liked, photos, gear, time,
    };
    /* Detect a level-up by comparing before/after against the logs this
       save is about to produce — cheap since it's the exact same derived
       math used everywhere else, just run twice. Only matters for a new
       entry; editing can't retroactively "level you up" in a way worth
       announcing. */
    let leveledUpTo = null;
    if (!editing) {
      const spotlightId = spotlightHike(state)?.id;
      const before = karmaLevel(totalKarmaForLogs(state.logs, state, spotlightId));
      const after = karmaLevel(totalKarmaForLogs([...state.logs, entry], state, spotlightId));
      if (after.level > before.level) leveledUpTo = after;
    }
    setState((s) => {
      const logs = editing ? s.logs.map((l) => (l.id === entry.id ? entry : l)) : [...s.logs, entry];
      let top = s.top.filter((id) => id !== picked.id);
      if (pinTop) top = [...s.top.filter((id) => id !== picked.id), picked.id].slice(0, TOP_CAP);
      return { ...s, logs, top, bucket: s.bucket.filter((b) => b !== picked.id) };
    });
    onClose();
    if (editing) toast("Entry updated");
    else onLogged({ hike: picked, wasOnBucket, firstEver, rating, entry, leveledUpTo });
  };

  if (creating) {
    return <CreateHikeSheet name={creating.name} onClose={() => setCreating(null)}
      onCreate={(h) => { setState((s) => ({ ...s, customHikes: [...s.customHikes, h] })); setPicked(h); setCreating(null); }} />;
  }

  return (
    <Sheet title={editing ? "Edit entry" : "Add a Hike"} onClose={onClose} dirty={dirty && !!picked}
      footer={picked && (
        <button className="primary-btn" disabled={rating === 0} onClick={save}>
          {editing ? "Save changes" : "Add to diary"}
        </button>
      )}>
      {!picked ? (
        <>
          <div style={{ position: "relative" }}>
            <Search size={16} color={THEME.gray} style={{ position: "absolute", left: 12, top: 13 }} />
            <input className="field" style={{ paddingLeft: 36 }} autoFocus value={q}
              onChange={(e) => setQ(e.target.value)} placeholder="Name of hike, trail, or route" aria-label="Search trails" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {results.map((h) => {
              const on = state.bucket.includes(h.id);
              return (
                <div key={h.id} className="row-card" style={{ background: THEME.surfaceHi, cursor: "default" }}>
                  <button onClick={() => setPicked(h)} style={{ flex: 1, display: "flex", gap: 10, alignItems: "center", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}><HikePoster hike={h} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>{h.name}</div>
                        {isRareHike(state, h.id) && <div style={{ flexShrink: 0 }}><RareChip label="RARE" /></div>}
                      </div>
                      <div style={{ color: THEME.gray, fontSize: 12 }}>{h.area} · {fmtStats(h)}</div>
                    </div>
                  </button>
                  {/* A real toggle now. (plan 1.4) */}
                  <button className="mini-btn" aria-pressed={on}
                    aria-label={on ? `Remove ${h.name} from bucket list` : `Add ${h.name} to bucket list`}
                    onClick={() => toggleBucket(h.id)}>
                    <Bookmark size={15} fill={on ? THEME.sky : "none"} color={on ? THEME.sky : THEME.gray} />
                  </button>
                </div>
              );
            })}
            {matches.length > 6 && (
              <div style={{ color: THEME.textDim, fontSize: 12, textAlign: "center" }}>
                {matches.length - 6} more match — keep typing to narrow it down.
              </div>
            )}
            {canCreate && (
              <button className="outline-btn" onClick={() => setCreating({ name: q.trim() })}>
                <Mountain size={15} style={{ verticalAlign: -2 }} /> Create “{q.trim()}”
              </button>
            )}
            {!q.trim() && (
              <div style={{ color: THEME.textDim, fontSize: 12.5, textAlign: "center", padding: "10px 20px", lineHeight: 1.5 }}>
                Ten Colorado trails are loaded today. Anything else, create it — you'll be asked for the numbers.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 58, height: 58, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><HikePoster hike={picked} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 16 }}>{picked.name}</div>
              <div style={{ color: THEME.gray, fontSize: 12.5 }}>{picked.area} · {fmtStats(picked)}</div>
            </div>
            {!presetHikeId && !editing && <button className="ghost-btn" onClick={() => setPicked(null)} style={{ fontSize: 12 }}>Change</button>}
          </div>

          {prior.length > 0 && (
            <div className="prior-note">
              <Repeat size={13} />
              <span>You've logged this {prior.length} time{prior.length > 1 ? "s" : ""} before. This is a new entry — the old ones stay put.</span>
            </div>
          )}

          <label className="field-label" htmlFor="l-date">Date hiked</label>
          <input id="l-date" className="field" type="date" value={date} max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)} />

          <label className="field-label">Your rating</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Rating value={rating} onChange={setRating} size={30} label="Your rating" />
            <span style={{ color: THEME.gray, fontSize: 12.5 }}>
              {rating ? `${ratingOut(rating)} / 5` : "Tap a half or a whole"}
            </span>
          </div>

          <label className="field-label">How it felt</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {EFFORTS.map((e) => <Chip key={e.id} on={effort === e.id} onClick={() => setEffort(e.id)}>{e.label}</Chip>)}
          </div>

          <label className="field-label">Time (optional)</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
            <input className="field" type="number" min="0" inputMode="numeric" value={hours}
              onChange={(e) => setHours(e.target.value)} placeholder="Hours" aria-label="Hours" />
            <input className="field" type="number" min="0" max="59" inputMode="numeric" value={minutes}
              onChange={(e) => setMinutes(e.target.value)} placeholder="Minutes" aria-label="Minutes" />
          </div>
          <div style={{ color: THEME.textDim, fontSize: 11.5, marginBottom: 14, lineHeight: 1.45 }}>
            Powers the Fastest and PR badges on this trail.
          </div>

          <label className="field-label" htmlFor="l-review">Review</label>
          <textarea id="l-review" className="field" rows={3} value={review} onChange={(e) => setReview(e.target.value)}
            placeholder="Trail beta, conditions, the moment that made it…" />

          <label className="field-label">Photos</label>
          <PhotoPicker photos={photos} onChange={setPhotos} onError={(m) => toast(m, true)} />

          <label className="field-label">What you wore</label>
          {state.gear.length === 0 ? (
            <div style={{ color: THEME.textDim, fontSize: 12, marginBottom: 12, lineHeight: 1.45 }}>
              Nothing in your locker yet. Add gear on the Gear tab and you can attach it to entries here.
            </div>
          ) : (
            <>
              {(state.kits || []).length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {state.kits.map((k) => {
                    const on = k.gearIds.length > 0 && k.gearIds.every((id) => gear.includes(id));
                    return (
                      <Chip key={k.id} on={on}
                        onClick={() => setGear(on
                          ? gear.filter((id) => !k.gearIds.includes(id))
                          : [...gear, ...k.gearIds.filter((id) => !gear.includes(id))])}>
                        <Shirt size={11} style={{ verticalAlign: -2, marginRight: 3 }} /> {k.name}
                      </Chip>
                    );
                  })}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {state.gear.map((g) => (
                  <Chip key={g.id} on={gear.includes(g.id)}
                    onClick={() => setGear(gear.includes(g.id) ? gear.filter((x) => x !== g.id) : [...gear, g.id])}>
                    {g.name}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="chip" aria-pressed={liked} style={{ flex: 1, background: liked ? THEME.sageMid : "rgba(255,255,255,0.08)" }}
              onClick={() => setLiked(!liked)}>♥ Like</button>
            <button className="chip" aria-pressed={pinTop} disabled={topFull && !pinTop}
              style={{ flex: 1, background: pinTop ? THEME.slateMid : "rgba(255,255,255,0.08)", opacity: topFull && !pinTop ? 0.45 : 1 }}
              onClick={() => setPinTop(!pinTop)}>✦ Top Hikes</button>
          </div>
          <div style={{ color: THEME.textDim, fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
            {topFull && !pinTop
              ? `Your shelf is full at ${TOP_CAP}. Drop one from your profile to make room.`
              : "♥ is a quick signal. Top Hikes is the ranked shelf — a spot there is a statement."}
          </div>
        </>
      )}
    </Sheet>
  );
}

export default AddHikeSheet;
