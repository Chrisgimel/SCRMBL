import React, { useState } from "react";
import { ChevronLeft, Bookmark, MapPin, Sparkles, Camera, Award, ChevronRight, Crosshair, ListFilter } from "lucide-react";
import Empty from "../components/ui/Empty";
import HikePoster from "../components/hike/HikePoster";
import TrailMap from "../components/hike/TrailMap";
import ElevationSketch from "../components/hike/ElevationSketch";
import ReviewCard from "../components/hike/ReviewCard";
import UnderlineTabs from "../components/ui/UnderlineTabs";
import Avatar from "../components/ui/Avatar";
import AchievementBadge from "../components/ui/AchievementBadge";
import AddPoiSheet from "../components/modals/AddPoiSheet";
import PoiDetailSheet from "../components/modals/PoiDetailSheet";
import PoiSectionsSheet from "../components/modals/PoiSectionsSheet";
import { usePois } from "../hooks/usePois";

import { ASSETS, EFFORT_LABEL, EFFORTS, THEME, USER_BY_HANDLE } from "../constants";
import { aggregate, entriesFor, hasAltitudeBadge, hasDistanceBadge, hasStats, hikeById, photoGeo, photoSrc, rankedBy, rarityOf, ratingOut } from "../utils/helpers";

function HikeScreen({ state, setState, hikeId, onBack, onLog, openUser, toast, toggleBucklist, toggleLike, isLiked, getLikeCount, openPhotoViewer }) {
  const h = hikeById(state, hikeId);
  const [tab, setTab] = useState("Reviews");
  const [poiDraft, setPoiDraft] = useState(null); // { lat, lng } | null
  const [poiDetail, setPoiDetail] = useState(null); // poi | null
  const [poiSections, setPoiSections] = useState(false);
  const [locating, setLocating] = useState(false);
  const { pois, addPoi, removePoi } = usePois(hikeId, state.signedIn);
  if (!h) return <Empty title="Trail not found" subtitle="It may have been removed from your custom routes." />;

  const agg = aggregate(state, hikeId);
  const entries = entriesFor(state, hikeId);
  const rarity = rarityOf(state, hikeId);
  const shelves = rankedBy(hikeId);
  const inBucket = state.bucket.includes(hikeId);
  const myEntries = state.logs.filter((l) => l.hikeId === hikeId);
  const myTop = state.top.indexOf(hikeId);

  const photos = [
    ...myEntries.flatMap((l) => l.photos.map((p) => ({ src: photoSrc(p), handle: "you" }))),
    ...(ASSETS.hikeImages[hikeId] ? [{ src: ASSETS.hikeImages[hikeId], handle: null }] : []),
  ];

  /* Geotagged photo pins for the Map tab — only photos with EXIF GPS
     (see PhotoPicker/photoGeo) qualify; most photos won't. */
  const photoPins = myEntries.flatMap((l) => l.photos
    .map((p) => ({ src: photoSrc(p), geo: photoGeo(p) }))
    .filter((p) => p.geo)
    .map(({ src, geo }) => ({ src, lat: geo.lat, lng: geo.lng })));

  const dist = [0, 0, 0, 0, 0];
  entries.filter((e) => e.rating > 0).forEach((e) => { dist[Math.ceil(e.rating / 2) - 1]++; });
  const maxD = Math.max(1, ...dist);

  const effortTally = EFFORTS.map((e) => ({ e, n: entries.filter((x) => x.effort === e.id).length })).filter((x) => x.n);
  const topEffort = effortTally.sort((a, b) => b.n - a.n)[0];

  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ position: "relative", height: 210 }}>
        <HikePoster hike={h} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%, ${THEME.canvas} 100%)` }} />
        <button className="round-btn" onClick={onBack} aria-label="Back"
          style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.5)" }}>
          <ChevronLeft size={20} color={THEME.grayLight} />
        </button>
        <button className="round-btn" aria-label={inBucket ? "Remove from bucket list" : "Add to bucket list"}
          onClick={async () => {
            if (toggleBucklist) {
              const success = await toggleBucklist(hikeId);
              if (!success) toast("Failed to update bucket list", true);
            } else {
              setState((s) => ({
                ...s, bucket: s.bucket.includes(hikeId) ? s.bucket.filter((b) => b !== hikeId) : [...s.bucket, hikeId],
              }));
            }
          }}
          style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.5)" }}>
          <Bookmark size={18} color={inBucket ? THEME.sky : THEME.grayLight} fill={inBucket ? THEME.sky : "none"} />
        </button>
      </div>

      <div style={{ padding: "0 18px 18px", marginTop: -34, position: "relative" }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, color: THEME.grayLight, lineHeight: 1.08 }}>{h.name}</div>
        <div style={{ color: THEME.textDim, fontSize: 14, marginTop: 2 }}>
          <MapPin size={12} style={{ verticalAlign: -1 }} /> {h.area}
        </div>

        {/* trail stats */}
        <div className="stat-strip">
          <div><div className="stat-n">{h.mi != null ? h.mi : "—"}</div><div className="stat-l">miles</div></div>
          <div><div className="stat-n">{h.gain != null ? h.gain.toLocaleString() : "—"}</div><div className="stat-l">feet up</div></div>
          <div><div className="stat-n">{h.summit ? h.summit.toLocaleString() : "—"}</div><div className="stat-l">summit</div></div>
          <div><div className="stat-n">{h.klass ? `C${h.klass}` : "—"}</div><div className="stat-l">grade</div></div>
        </div>

        {/* elevation profile — drawn from gain and length, honest about being a sketch */}
        {hasStats(h) && <ElevationSketch hike={h} />}

        {/* rarity — the skill signal */}
        <div className={`rarity ${rarity.level}`}>
          <Sparkles size={14} />
          <span>{rarity.label}{h.summit >= 14000 ? " · 14er" : ""}{h.klass >= 3 ? " · hands on rock" : ""}</span>
        </div>

        {/* trail badges — distance (>10mi) + altitude (>13k ft), static properties of this trail */}
        {(hasDistanceBadge?.(h) || hasAltitudeBadge?.(h)) && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
            {hasDistanceBadge?.(h) && <AchievementBadge icon="/badges/distance.png" label="Longer than 10 miles" size={11} />}
            {hasAltitudeBadge?.(h) && <AchievementBadge icon="/badges/altitude.png" label="Above 13,000 feet" size={11} />}
          </div>
        )}

        {/* aggregate */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 4px" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, color: THEME.grayLight, lineHeight: 1 }}>
              {agg.count ? ratingOut(Math.round(agg.avg)) : "—"}
            </div>
            <div style={{ color: THEME.textDim, fontSize: 11.5 }}>
              {agg.count ? `${agg.count} entr${agg.count === 1 ? "y" : "ies"} · ${agg.hikers} hiker${agg.hikers === 1 ? "" : "s"}` : "No ratings yet"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ color: THEME.textDim, fontSize: 9, width: 8 }}>{n}</span>
                <div style={{ flex: 1, height: 5, background: THEME.surfaceHi, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(dist[n - 1] / maxD) * 100}%`, height: "100%", background: THEME.sageMid }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {topEffort && (
          <div style={{ color: THEME.gray, fontSize: 12.5, marginBottom: 12 }}>
            Most hikers called it <span style={{ color: THEME.mintLight, fontWeight: 600 }}>{EFFORT_LABEL[topEffort.e.id]}</span>.
          </div>
        )}

        <button className="primary-btn" onClick={() => onLog(hikeId)}>
          {myEntries.length ? `Log it again · ${myEntries.length} entr${myEntries.length === 1 ? "y" : "ies"} so far` : "Log this hike"}
        </button>
        {myTop >= 0 && (
          <div style={{ color: THEME.mintLight, fontSize: 12.5, textAlign: "center", marginTop: 8 }}>
            ✦ #{myTop + 1} on your Top Hikes
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <UnderlineTabs tabs={["Reviews", "Photos", "Shelves", "Map"]} active={tab} onChange={setTab} />
        </div>
      </div>

      <div style={{ padding: "0 18px 18px" }}>
        {tab === "Reviews" && (
          entries.length === 0
            ? <Empty title="No reviews yet" subtitle="Be the first to log it and this page becomes yours to set the tone on."
                action={<button className="outline-btn" onClick={() => onLog(hikeId)}>Log this hike</button>} />
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {entries.map((e) => (
                  <ReviewCard key={e.id} state={state} setState={setState} entry={e} openUser={openUser}
                    toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} hike={h} openPhotoViewer={openPhotoViewer} />
                ))}
              </div>
        )}

        {tab === "Photos" && (
          photos.length === 0
            ? <Empty icon={Camera} title="No photos yet" subtitle="Add one to your entry and it shows up here." />
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                    <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {p.handle === "you" && <div className="photo-tag">Yours</div>}
                  </div>
                ))}
              </div>
        )}

        {tab === "Shelves" && (
          shelves.length === 0 && myTop < 0
            ? <Empty icon={Award} title="Not on anyone's shelf" subtitle="Top Hikes is a ranked list — pin this one and you'd be the first to stake a claim." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myTop >= 0 && (
                  <div className="rank-card">
                    <div className="rank-num">{myTop + 1}</div>
                    <Avatar hue={state.user.hue} size={40} handle="me" ring={false} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14 }}>You</div>
                      <div style={{ color: THEME.gray, fontSize: 12 }}>on your Top Hikes</div>
                    </div>
                  </div>
                )}
                {shelves.map(({ handle, rank }) => {
                  const u = USER_BY_HANDLE[handle];
                  return (
                    <button key={handle} className="rank-card" onClick={() => openUser(handle)} style={{ border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <div className="rank-num">{rank}</div>
                      <Avatar hue={u.hue} size={40} handle={handle} ring={false} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                        <div style={{ color: THEME.gray, fontSize: 12 }}>{u.city}</div>
                      </div>
                      <ChevronRight size={16} color={THEME.textDim} />
                    </button>
                  );
                })}
              </div>
        )}

        {tab === "Map" && (
          /* Leaflet's tile layer is GPU-composited (transform-positioned
             tiles), which the scrim's backdrop-filter doesn't reliably see
             through in every browser — blurring the map directly (instead
             of relying on the backdrop-filter to blur what's behind it)
             sidesteps that entirely. */
          <div style={{ filter: poiDraft ? "blur(4px)" : "none", transition: "filter 0.2s ease" }}>
            <button className="outline-btn" style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              disabled={locating}
              onClick={() => {
                if (!navigator.geolocation) { toast("Location isn't available in this browser", true); return; }
                setLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => { setLocating(false); setPoiDraft({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
                  () => { setLocating(false); toast("Couldn't get your location — check permissions.", true); },
                  { enableHighAccuracy: true, timeout: 8000 }
                );
              }}>
              <Crosshair size={15} /> {locating ? "Finding you…" : "Add beta at my location"}
            </button>
            {pois.length > 0 && (
              <button className="outline-btn" style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => setPoiSections(true)}>
                <ListFilter size={15} /> View beta by section · {pois.length}
              </button>
            )}
            <TrailMap hike={h} userTrack={[...myEntries].reverse().find((l) => l.track)?.track}
              photoPins={photoPins} onOpenPhoto={openPhotoViewer}
              pois={pois} onMapTap={(lat, lng) => setPoiDraft({ lat, lng })} onSelectPoi={setPoiDetail} />
          </div>
        )}
      </div>

      {poiDraft && (
        <AddPoiSheet lat={poiDraft.lat} lng={poiDraft.lng} onClose={() => setPoiDraft(null)}
          onSubmit={async (data) => {
            const ok = await addPoi(data);
            if (ok) toast("Beta added"); else toast("Failed to add beta", true);
            return ok;
          }} />
      )}
      {poiDetail && (
        <PoiDetailSheet poi={poiDetail} onClose={() => setPoiDetail(null)}
          onDelete={poiDetail.is_mine ? async () => {
            const ok = await removePoi(poiDetail.id);
            if (ok) { setPoiDetail(null); toast("Beta removed"); } else toast("Failed to remove beta", true);
            return ok;
          } : undefined} />
      )}
      {poiSections && (
        <PoiSectionsSheet pois={pois} onSelectPoi={setPoiDetail} onClose={() => setPoiSections(false)} />
      )}
    </div>
  );
}

export default HikeScreen;



