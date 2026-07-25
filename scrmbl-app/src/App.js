import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Layers, Plus, Shirt, ShoppingCart, Sparkles, UserPlus, Users } from "lucide-react";
import { useBucklist } from "./hooks/useBucklist";
import { useLikes } from "./hooks/useLikes";
import * as api from "./utils/api";
import Avatar from "./components/ui/Avatar";
import Logo from "./components/ui/Logo";

import Empty from "./components/ui/Empty";
import Toast from "./components/ui/Toast";
import UnderlineTabs from "./components/ui/UnderlineTabs";

import HikePoster from "./components/hike/HikePoster";

import ReviewCard from "./components/hike/ReviewCard";

import LoggedSheet from "./components/modals/LoggedSheet";
import SettingsModal from "./components/modals/SettingsModal";
import PhotoViewerModal from "./components/modals/PhotoViewerModal";
import ReviewDetailModal from "./components/modals/ReviewDetailModal";
import BucketlistBrowserSheet from "./components/modals/BucketlistBrowserSheet";
import AddHikeSheet from "./components/modals/AddHikeSheet";
import LoginScreen from "./screens/LoginScreen";
import HikeScreen from "./screens/HikeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import GearScreen from "./screens/GearScreen";
import MarketScreen from "./screens/MarketScreen";
import InboxScreen from "./screens/InboxScreen";
import ThreadScreen from "./screens/ThreadScreen";
import UserScreen from "./screens/UserScreen";
import { UI } from "./assets/images";
import { THEME, ASSETS, COPY, EFFORTS, GAIN_BANDS, SCRAMBLE, SEED_USERS, COMMUNITY_LOGS, DEMO_LOGS, DEMO_TOP, DEMO_BUCKET, DEMO_GEAR, DEFAULT_STATE } from "./constants";

import { loadPersisted, persist } from "./utils/storage";
import { allHikes, hikeById, hasStats, isRareHike } from "./utils/helpers";

/* ================================================================
   SCREENS
   ================================================================ */

/* ---------------- FEED ---------------- */

function FeedScreen({ state, setState, openHike, openUser, toggleLike, isLiked, getLikeCount, openReviewDetail, openPhotoViewer }) {
  const [tab, setTab] = useState("Friends");
  return (
    <div className="screen" style={{ background: THEME.canvas }}>
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: THEME.grayLight, letterSpacing: 0.5, marginBottom: 14 }}>{COPY.appName}</div>
        <UnderlineTabs tabs={["Friends", "Discover"]} active={tab} onChange={setTab} />
      </div>
      {tab === "Friends" && <FriendsTab state={state} setState={setState} openHike={openHike} openUser={openUser} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openReviewDetail={openReviewDetail} openPhotoViewer={openPhotoViewer} />}
      {tab === "Discover" && <DiscoverTab state={state} openHike={openHike} />}
    </div>
  );
}

/* Built from the follow graph and real entries — no literal activity strings. */
function FriendsTab({ state, setState, openHike, openUser, toggleLike, isLiked, getLikeCount, openReviewDetail, openPhotoViewer }) {
  const follow = (handle) => setState((s) => ({
    ...s,
    following: s.following.includes(handle) ? s.following.filter((h) => h !== handle) : [...s.following, handle],
  }));

  const feed = useMemo(() => COMMUNITY_LOGS
    .filter((l) => state.following.includes(l.handle))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20), [state.following]);

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

/* Buckets are elevation bands, scramble grade, and how it actually felt
   to the people who went — three different questions. (plan 1.2 / 3.5) */
function DiscoverTab({ state, openHike }) {
  const hikes = allHikes(state);
  const withStats = hikes.filter(hasStats);
  const noStats = hikes.filter((h) => !hasStats(h));
  const rareHikes = hikes.filter((h) => isRareHike(state, h.id));

  const Row = ({ list }) => (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
      {list.map((h) => {
        const rare = isRareHike(state, h.id);
        return (
          <button key={h.id} className="cell" style={{ width: 96, flexShrink: 0 }} onClick={() => openHike(h.id)}>
            <div className="thumb" style={{ width: 96, height: 96, position: "relative" }}>
              <HikePoster hike={h} />
              {rare && <div className="rare-flag"><Sparkles size={9} /> Rare</div>}
            </div>
            <div className="cell-name">{h.name}</div>
          </button>
        );
      })}
    </div>
  );
  const Head = ({ children }) => (
    <div style={{ color: THEME.mintLight, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>
  );

  const effortBuckets = EFFORTS.map((e) => {
    const ids = [...new Set(COMMUNITY_LOGS.filter((l) => l.effort === e.id).map((l) => l.hikeId))];
    return { e, list: ids.map((id) => hikeById(state, id)).filter(Boolean) };
  }).filter((b) => b.list.length);

  return (
    <div style={{ padding: "16px 18px 16px" }}>
      {rareHikes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Rarely logged</div>
          <div style={{ color: THEME.textDim, fontSize: 12, marginTop: -6, marginBottom: 10 }}>
            One scrmblr or fewer have logged these. Go be the reason that changes.
          </div>
          <Row list={rareHikes} />
        </div>
      )}

      <div className="section-title" style={{ marginTop: rareHikes.length > 0 ? undefined : 0 }}>By elevation gain</div>
      {GAIN_BANDS.map((b) => {
        const list = withStats.filter((h) => b.test(h.gain));
        if (!list.length) return null;
        return <div key={b.id} style={{ marginBottom: 14 }}><Head>{b.label}</Head><Row list={list} /></div>;
      })}

      <div className="section-title">By scramble grade</div>
      {[1, 2, 3].map((k) => {
        const list = hikes.filter((h) => h.klass === k);
        if (!list.length) return null;
        return <div key={k} style={{ marginBottom: 14 }}><Head>{SCRAMBLE[k]}</Head><Row list={list} /></div>;
      })}

      <div className="section-title">By how it felt</div>
      <div style={{ color: THEME.textDim, fontSize: 12, marginTop: -6, marginBottom: 10 }}>
        Grouped by what hikers said on their entries, not by the numbers.
      </div>
      {effortBuckets.map(({ e, list }) => (
        <div key={e.id} style={{ marginBottom: 14 }}><Head>{e.label}</Head><Row list={list} /></div>
      ))}

      {noStats.length > 0 && (
        <>
          <div className="section-title">Missing trail stats</div>
          <div style={{ color: THEME.textDim, fontSize: 12, marginTop: -6, marginBottom: 10 }}>
            Routes you added without distance or gain. They can't be sorted until they have numbers.
          </div>
          <Row list={noStats} />
        </>
      )}
    </div>
  );
}

/* ---------------- HIKE DETAIL — the shared object the diary points at.
   Everything social hangs off this page. (plan 3.1) ---------------- */


/* A sketch, drawn from length and gain — labelled as such rather than
   pretending to be surveyed data. */


/* ---------------- ANOTHER HIKER'S PROFILE ---------------- */




/* ================================================================
   APP SHELL
   ================================================================ */

const NAV = [
  { id: "feed", icon: Layers, label: "Feed" },
  { id: "gear", icon: Shirt, label: "Gear" },
  { id: "add", icon: Plus, label: "Log" },
  { id: "market", icon: ShoppingCart, label: "Market" },
  { id: "profile", icon: null, label: "Profile" },
];

export default function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("feed");
  const [stack, setStack] = useState([]);              // pushed pages: { type, id }
  const [adding, setAdding] = useState(null);          // { hikeId, logId } | null
  const [logged, setLogged] = useState(null);
  const [settings, setSettings] = useState(false);
  const [browsingBucketlist, setBrowsingBucketlist] = useState(false);
  const [sellDraft, setSellDraft] = useState(null);
  const [reviewDetail, setReviewDetail] = useState(null);
  const [photoViewer, setPhotoViewer] = useState(null);
  const [toastMsg, setToastState] = useState(null);
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);
  const scroller = useRef(null);

  // Backend-synced bucklist
  const { bucklist, toggleBucklist } = useBucklist(state.signedIn);

  // Backend-synced likes
  const { toggleLike, isLiked, getLikeCount } = useLikes(state.signedIn, state.likedReviewIds, state.likeCounts, setState);

  // Sync bucklist from hook to state for existing components
  useEffect(() => {
    if (state.signedIn) {
      setState(s => ({ ...s, bucket: bucklist }));
    }
  }, [bucklist, state.signedIn]);

  const toast = useCallback((text, bad = false) => {
    clearTimeout(toastTimer.current);
    setToastState({ text, bad });
    toastTimer.current = setTimeout(() => setToastState(null), 2600);
  }, []);

  useEffect(() => { loadPersisted().then((s) => { setState(s); setLoaded(true); }); }, []);

  /* A failed save is now something you find out about. (plan 5) */
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist(state).catch(() => toast("Couldn't save — your last change may not survive a reload.", true));
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [state, loaded, toast]);

  const top = stack[stack.length - 1] || null;
  const push = (page) => { setStack((s) => [...s, page]); scroller.current?.scrollTo(0, 0); };
  const back = () => setStack((s) => s.slice(0, -1));

  const openHike = (id) => push({ type: "hike", id });
  const openUser = (handle) => push({ type: "user", id: handle });
  const openThread = (id) => push({ type: "thread", id });
  const openInbox = () => push({ type: "inbox" });
  const openLog = (hikeId = null, logId = null) => setAdding({ hikeId, logId });
  const openReviewDetail = (review) => setReviewDetail(review);

  const signIn = async ({ email, name, isNew, sso }) => {
    // Call backend API for authentication
    try {
      const userName = name || email.split('@')[0] || 'Scrmblr';
      await api.signIn(email, userName);
      setState((s) => ({
        ...s, signedIn: true, account: { email, sso: sso || null },
        user: { ...s.user, name: userName },
      }));
    } catch (error) {
      console.error('Sign in failed:', error);
      toast('Sign in failed. Please try again.', true);
    }
  };
  const loadDemo = () => {
    setState((s) => ({
      ...s, isDemo: true, logs: DEMO_LOGS, top: DEMO_TOP, bucket: DEMO_BUCKET,
      gear: DEMO_GEAR, following: ["cairn_queen", "ridgelinerachel"],
      followers: ["talus.tom", "scree.sam", "basin.bri"],
      user: { ...s.user, name: s.user.name === "New Scrmblr" ? "Demo Scrmblr" : s.user.name, city: "Denver, CO", bio: "Weekends above treeline. Slow on the ups, fast on the downs." },
    }));
    setSettings(false);
    toast("Demo data loaded");
  };
  const clearData = () => {
    setState((s) => ({
      ...DEFAULT_STATE, signedIn: true, account: s.account, premium: s.premium,
      user: { ...DEFAULT_STATE.user, name: s.user.name, city: s.user.city },
    }));
    setSettings(false);
    setStack([]);
    toast("Demo data cleared");
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.canvas }}>
        <GlobalStyles />
        {ASSETS.treeLogo ? (
          <img src={ASSETS.treeLogo} alt="SCRMBL." style={{ width: 180, filter: "invert(0.92)" }} />
        ) : <Logo size={90} />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#E9E7E4", display: "flex", justifyContent: "center", padding: "18px 0", fontFamily: "var(--body)" }}>
      <GlobalStyles />
      <div style={{
        width: "min(400px, 100vw)", minHeight: 760, borderRadius: 34, overflow: "hidden",
        display: "flex", flexDirection: "column", position: "relative",
        boxShadow: "0 24px 60px rgba(12,21,26,0.45)", background: THEME.canvas,
      }}>
        {!state.signedIn ? (
          <LoginScreen onSignIn={signIn}
            onDemo={() => { signIn({ email: "demo@scrmbl.app", name: "Demo Scrmblr", isNew: false }); loadDemo(); }} />
        ) : (
          <>
            <div ref={scroller} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {top?.type === "hike" ? (
                <HikeScreen state={state} setState={setState} hikeId={top.id} onBack={back}
                  onLog={(id) => openLog(id)} openUser={openUser} toast={toast} toggleBucklist={toggleBucklist}
                  toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} />
              ) : top?.type === "user" ? (
                <UserScreen state={state} setState={setState} handle={top.id} onBack={back} openHike={openHike}
                  toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} />
              ) : top?.type === "inbox" ? (
                <InboxScreen state={state} onBack={back} openThread={openThread} />
              ) : top?.type === "thread" ? (
                <ThreadScreen state={state} setState={setState} threadId={top.id} onBack={back} openUser={openUser} />
              ) : (
                <>
                  {tab === "feed" && <FeedScreen state={state} setState={setState} openHike={openHike} openUser={openUser} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openReviewDetail={openReviewDetail} openPhotoViewer={setPhotoViewer} />}
                  {tab === "gear" && <GearScreen state={state} setState={setState} toast={toast}
                    onSell={(g) => { setSellDraft(g); setTab("market"); }} />}
                  {tab === "market" && <MarketScreen state={state} setState={setState} premium={state.premium}
                    openThread={openThread} openInbox={openInbox} openUser={openUser} sellDraft={sellDraft}
                    clearSellDraft={() => setSellDraft(null)} toast={toast} />}
                  {tab === "profile" && <ProfileScreen state={state} setState={setState} openHike={openHike}
                    openUser={openUser} openSettings={() => setSettings(true)} onLog={openLog}
                    toggleBucklist={toggleBucklist} toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} toast={toast}
                    openBucketlistBrowser={() => setBrowsingBucketlist(true)} />}
                </>
              )}
            </div>

            <div style={{ padding: "8px 12px 16px", background: THEME.canvas }}>
              <div style={{
                display: "flex", background: THEME.surfaceHi, borderRadius: 30,
                padding: "8px 6px", justifyContent: "space-around", alignItems: "center",
                boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
              }}>
                {NAV.map((n) => {
                  const active = !top && tab === n.id;
                  const onClick = n.id === "add" ? () => openLog(null) : () => { setStack([]); setTab(n.id); };
                  const iconFilter = active ? "invert(1) brightness(1.6)" : "invert(0.62)";
                  return (
                    <button key={n.id} onClick={onClick} aria-label={n.label} aria-current={active ? "page" : undefined} style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      padding: "4px 8px", flex: 1, minWidth: 0,
                    }}>
                      <div style={{ height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {n.id === "profile" ? (
                          UI.profileIcon ? <img src={UI.profileIcon} alt="" style={{ height: 24, filter: iconFilter }} /> : (
                            <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" fill="none" stroke={active ? THEME.grayLight : THEME.textDim} strokeWidth="2" />
                              <circle cx="12" cy="9" r="3" fill={active ? THEME.grayLight : THEME.textDim} />
                              <path d="M6 17 L10 12.5 L13 16 L15 13.5 L18 17 Z" fill={active ? THEME.grayLight : THEME.textDim} />
                            </svg>
                          )
                        ) : n.id === "market" && UI.cartIcon ? (
                          <img src={UI.cartIcon} alt="" style={{ height: 24, filter: iconFilter }} />
                        ) : n.id === "add" && UI.plusIcon ? (
                          <img src={UI.plusIcon} alt="" style={{ width: 25, filter: iconFilter }} />
                        ) : n.id === "feed" && UI.layersIcon ? (
                          <img src={UI.layersIcon} alt="" style={{ width: 24, filter: iconFilter }} />
                        ) : n.id === "gear" && UI.jacketIcon ? (
                          <img src={UI.jacketIcon} alt="" style={{ width: 25, filter: iconFilter }} />
                        ) : (
                          <n.icon size={23} color={active ? THEME.grayLight : THEME.textDim} strokeWidth={2} />
                        )}
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? THEME.grayLight : THEME.textDim }}>{n.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {browsingBucketlist && (
          <BucketlistBrowserSheet state={state} setState={setState} onClose={() => setBrowsingBucketlist(false)}
            toggleBucklist={toggleBucklist} toast={toast} />
        )}
        {adding && (
          <AddHikeSheet state={state} setState={setState} presetHikeId={adding.hikeId} editLogId={adding.logId}
            toast={toast} onLogged={(r) => setLogged(r)} onClose={() => setAdding(null)} />
        )}
        {logged && (
          <LoggedSheet state={state} result={logged} openHike={openHike} onClose={() => setLogged(null)} />
        )}
        {settings && (
          <SettingsModal state={state} setState={setState} onClose={() => setSettings(false)}
            onLoadDemo={loadDemo} onClear={clearData}
            onSignOut={() => { setState((s) => ({ ...s, signedIn: false })); setSettings(false); setStack([]); }} />
        )}
        {reviewDetail && (
          <ReviewDetailModal state={state} review={reviewDetail} onClose={() => setReviewDetail(null)} openHike={openHike}
            toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openPhotoViewer={setPhotoViewer} />
        )}
        {photoViewer && (
          <PhotoViewerModal photo={photoViewer} onClose={() => setPhotoViewer(null)} />
        )}
        <Toast toast={toastMsg} />
      </div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Public+Sans:wght@400;600;700;800&display=swap');
      :root {
        --display: 'Oswald', 'Arial Narrow', sans-serif;
        --body: 'Public Sans', -apple-system, 'Segoe UI', sans-serif;
      }
      * { box-sizing: border-box; }
      button { font-family: var(--body); }
      button:focus-visible, [tabindex]:focus-visible, input:focus-visible, textarea:focus-visible {
        outline: 2px solid ${THEME.sky}; outline-offset: 2px;
      }
      .screen { flex: 1; }
      .section-title { font-family: var(--display); font-weight: 600; font-size: 17px; color: ${THEME.grayLight}; margin: 22px 0 10px; }
      .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 12px; }
      .cell { background: transparent; border: none; padding: 0; cursor: pointer; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
      .thumb { width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; }
      .cell-name { color: ${THEME.grayLight}; font-size: 11px; font-weight: 600; text-align: left; line-height: 1.25; }
      .row-card { display: flex; gap: 12px; align-items: center; background: ${THEME.surface}; border: none; border-radius: 16px; padding: 12px 14px; cursor: pointer; width: 100%; }
      .rank-card { display: flex; gap: 12px; align-items: center; background: ${THEME.surface}; border-radius: 16px; padding: 12px 14px; }
      .rank-num { font-family: var(--display); font-weight: 700; font-size: 26px; color: ${THEME.slateMid}; width: 26px; text-align: center; flex-shrink: 0; }
      .review-card { background: ${THEME.surface}; border-radius: 16px; padding: 14px 16px; }
      .round-btn { width: 38px; height: 38px; border-radius: 50%; background: ${THEME.surfaceHi}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .list-row { display: flex; gap: 14px; align-items: center; width: 100%; background: transparent; border: none; border-bottom: 1px solid ${THEME.hairline}; padding: 15px 2px; cursor: pointer; }
      .mini-btn { background: ${THEME.surfaceHi}; border: none; border-radius: 8px; padding: 5px; cursor: pointer; color: ${THEME.grayLight}; display: flex; }
      .mini-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
      .mini-btn:disabled { opacity: 0.3; cursor: default; }
      .tiny-btn { background: ${THEME.surfaceHi}; border: none; border-radius: 14px; padding: 4px 9px; font-size: 11px; font-weight: 600; color: ${THEME.grayLight}; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
      .tiny-btn:hover { background: rgba(255,255,255,0.18); }
      .tiny-note { color: ${THEME.textDim}; font-size: 11px; align-self: center; }
      .chip { border: none; border-radius: 18px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; color: ${THEME.grayLight}; cursor: pointer; }
      .chip:disabled { cursor: default; }
      .follow-btn { display: inline-flex; align-items: center; gap: 5px; background: ${THEME.slateMid}; color: #fff; border: none; border-radius: 16px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0; }
      .field { width: 100%; border: none; border-radius: 12px; padding: 11px 13px; font-size: 14px; margin-bottom: 12px; background: ${THEME.grayLight}; color: ${THEME.ink}; font-family: var(--body); outline: none; }
      .field::placeholder { color: ${THEME.gray}; }
      .field:focus { box-shadow: 0 0 0 2px ${THEME.slateMid}; }
      .field-label { display: block; color: ${THEME.gray}; font-size: 12px; font-weight: 600; letter-spacing: 0.4px; margin-bottom: 5px; width: 100%; }
      .primary-btn { width: 100%; border: none; border-radius: 24px; padding: 13px; background: ${THEME.slateMid}; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
      .primary-btn:disabled { opacity: 0.45; cursor: default; }
      .primary-btn:not(:disabled):hover { background: ${THEME.slate}; }
      .outline-btn { width: 100%; border: 1.5px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 11px; background: transparent; color: ${THEME.grayLight}; font-weight: 600; font-size: 14px; cursor: pointer; }
      .ghost-btn { background: transparent; border: none; color: ${THEME.sky}; font-size: 14px; font-weight: 600; cursor: pointer; padding: 4px; }
      .oauth-btn { width: 100%; border: none; border-radius: 24px; padding: 12px; background: #fff; color: #1a1a1a; font-weight: 600; font-size: 14.5px; cursor: pointer; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; }
      .icon-inline { position: absolute; right: 12px; top: 10px; background: transparent; border: none; color: ${THEME.gray}; cursor: pointer; }
      .gear-slot { border: none; border-radius: 16px; aspect-ratio: 1.15; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 6px; transition: transform 0.1s; }
      .gear-slot:active { transform: scale(0.96); }
      .gear-tag { display: inline-flex; align-items: center; gap: 4px; background: ${THEME.slateDeep}; color: ${THEME.mintLight}; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 8px; padding: 3px 8px; }
      .hit { position: absolute; top: 0; width: 50%; height: 100%; background: transparent; border: none; padding: 0; cursor: pointer; }
      .stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: ${THEME.surface}; border-radius: 14px; padding: 12px 10px; margin-top: 14px; text-align: center; }
      .stat-n { font-family: var(--display); font-weight: 700; font-size: 17px; color: ${THEME.grayLight}; }
      .stat-l { color: ${THEME.textDim}; font-size: 10.5px; letter-spacing: 0.4px; }
      .record { background: ${THEME.surface}; border-radius: 18px; padding: 14px 16px; margin-top: 16px; }
      .record-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; }
      .badge { display: inline-flex; align-items: center; gap: 5px; background: ${THEME.slateDeep}; color: ${THEME.mintLight}; font-size: 11px; font-weight: 700; border-radius: 12px; padding: 5px 9px; }
      .rarity { display: flex; align-items: center; gap: 7px; border-radius: 12px; padding: 9px 12px; margin-top: 12px; font-size: 12.5px; font-weight: 600; }
      .rarity.rare, .rarity.unlogged { background: rgba(202,224,206,0.14); color: ${THEME.mintLight}; }
      .rarity.uncommon { background: rgba(90,124,146,0.22); color: ${THEME.skyLight}; }
      .rarity.common { background: ${THEME.surface}; color: ${THEME.textDim}; }
      .first-flag { position: absolute; top: 5px; left: 5px; display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 9px; font-weight: 700; border-radius: 6px; padding: 2px 5px; }
      .rare-flag { position: absolute; top: 5px; left: 5px; display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 9px; font-weight: 700; letter-spacing: 0.4px; border-radius: 6px; padding: 2px 5px; text-transform: uppercase; }
      .rare-dot { position: absolute; top: 3px; right: 3px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; }
      .photo-tag { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 9.5px; font-weight: 700; border-radius: 6px; padding: 2px 6px; }
      .photo-add { width: 66px; height: 66px; border-radius: 10px; border: 1.5px dashed rgba(255,255,255,0.25); background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
      .prior-note { display: flex; gap: 8px; align-items: flex-start; background: ${THEME.surfaceHi}; border-radius: 12px; padding: 10px 12px; color: ${THEME.gray}; font-size: 12px; line-height: 1.45; margin-bottom: 14px; }
      .prior-note svg { flex-shrink: 0; margin-top: 2px; color: ${THEME.mintLight}; }
      .link-note { border: 1px solid ${THEME.hairline}; border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; }
      .looking-for { display: flex; gap: 8px; align-items: flex-start; background: ${THEME.surfaceHi}; border-radius: 12px; padding: 10px 12px; color: ${THEME.grayLight}; font-size: 13px; line-height: 1.45; margin-top: 4px; }
      .looking-for svg { flex-shrink: 0; margin-top: 2px; color: ${THEME.mintLight}; }
      .sold-veil { position: absolute; inset: 0; background: rgba(12,21,26,0.6); display: flex; align-items: center; justify-content: center; }
      .sold-veil span { font-family: var(--display); font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: ${THEME.grayLight}; border: 2px solid ${THEME.grayLight}; border-radius: 6px; padding: 2px 10px; transform: rotate(-8deg); }
      .kind-flag { position: absolute; bottom: 8px; left: 8px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 10px; font-weight: 700; border-radius: 6px; padding: 3px 6px; }
      .dot { position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px; border-radius: 8px; background: ${THEME.slateMid}; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
      .menu-scrim { position: fixed; inset: 0; z-index: 9; }
      .menu { position: absolute; top: 44px; z-index: 10; background: ${THEME.surfaceHi}; border: 1px solid ${THEME.hairline}; border-radius: 14px; padding: 6px; min-width: 170px; box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
      .menu-item { display: flex; justify-content: space-between; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; border-radius: 9px; padding: 9px 10px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; }
      .menu-item:hover { background: rgba(255,255,255,0.08); }
      .ledger { background: ${THEME.surface}; border-radius: 14px; padding: 12px 14px; margin-top: 14px; }
      .ledger-row { display: flex; gap: 10px; align-items: center; color: ${THEME.grayLight}; font-size: 12.5px; padding: 4px 0; }
      .thread-head { background: ${THEME.surface}; border-radius: 12px; padding: 10px 12px; font-size: 12.5px; }
      .bubble { max-width: 78%; border-radius: 16px; padding: 9px 13px; font-size: 13.5px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
      .bubble.mine { align-self: flex-end; background: ${THEME.slateMid}; color: #fff; border-bottom-right-radius: 5px; }
      .bubble.theirs { align-self: flex-start; background: ${THEME.surfaceHi}; color: ${THEME.grayLight}; border-bottom-left-radius: 5px; }
      .confirm { position: absolute; inset: 0; background: rgba(12,21,26,0.88); border-radius: 22px 22px 0 0; display: flex; flex-direction: column; justify-content: center; padding: 24px; }
      .toast { position: absolute; left: 16px; right: 16px; bottom: 92px; z-index: 40; display: flex; align-items: center; gap: 8px; border-radius: 12px; padding: 11px 14px; color: ${THEME.grayLight}; font-size: 13px; font-weight: 600; box-shadow: 0 10px 26px rgba(0,0,0,0.45); animation: toastIn 0.2s ease; }
      .sheet-backdrop { position: absolute; inset: 0; background: rgba(12,21,26,0.55); display: flex; align-items: flex-end; z-index: 20; }
      .sheet { width: 100%; max-height: 88%; background: ${THEME.surface}; border-radius: 22px 22px 0 0; border-top: 1px solid ${THEME.hairline}; display: flex; flex-direction: column; animation: slideUp 0.22s ease; position: relative; }
      .sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 10px; }
      .sheet-body { padding: 6px 18px 16px; overflow-y: auto; }
      .sheet-foot { padding: 10px 18px 20px; }
      @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes toastIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .sheet, .toast { animation: none; } }
    `}</style>
  );
}



