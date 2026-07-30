import React, { useState, useEffect, useRef, useCallback } from "react";
import { Layers, Plus, Shirt, ShoppingCart } from "lucide-react";
import { useBucklist } from "./hooks/useBucklist";
import { useLikes } from "./hooks/useLikes";
import { useGear } from "./hooks/useGear";
import { useLogs } from "./hooks/useLogs";
import { useTop } from "./hooks/useTop";
import * as api from "./utils/api";
import Logo from "./components/ui/Logo";

import Toast from "./components/ui/Toast";
import LevelUpBanner from "./components/ui/LevelUpBanner";

import FeedScreen from "./screens/feed/FeedScreen";

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
import { THEME, ASSETS, DEMO_LOGS, DEMO_TOP, DEMO_BUCKET, DEMO_GEAR, DEFAULT_STATE } from "./constants";

import { loadPersisted, persist } from "./utils/storage";
import GlobalStyles from "./styles/GlobalStyles";

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
  const [levelUp, setLevelUp] = useState(null);
  const saveTimer = useRef(null);
  const toastTimer = useRef(null);
  const levelUpTimer = useRef(null);
  const scroller = useRef(null);

  // Backend-synced bucklist
  const { bucklist, toggleBucklist } = useBucklist(state.signedIn);

  // Backend-synced likes
  const { toggleLike, isLiked, getLikeCount } = useLikes(state.signedIn, state.likedReviewIds, state.likeCounts, setState);

  // Backend-synced gear + kits
  const { saveGear, removeGear, toggleFeature, saveKit, removeKit } = useGear(state.signedIn, state.gear, state.kits, setState);

  // Backend-synced logs + custom hikes
  const { saveLog, removeLog, saveCustomHike } = useLogs(state.signedIn, state.logs, state.customHikes, state.isDemo, setState);

  // Backend-synced Top Hikes shelf
  const { setTop } = useTop(state.signedIn, state.top, state.isDemo, setState);

  // Sync bucklist from hook to state for existing components
  useEffect(() => {
    if (state.signedIn) {
      setState(s => ({ ...s, bucket: bucklist }));
    }
  }, [bucklist, state.signedIn]);

  /* Other hikers' entries and ranked shelves, which the feed, Discover's
     trending math, trail pages and profiles all read. Public and
     unauthenticated, so they load at startup rather than on sign-in — and
     again on sign-in, since both endpoints leave out your own rows (the
     client already has those in state.logs / state.top) and which rows those
     are depends on who you are.

     The two are fetched independently on purpose: one failing shouldn't blank
     the other. */
  useEffect(() => {
    let cancelled = false;

    api.getCommunityLogs()
      .then(({ logs, customHikes }) => {
        if (cancelled) return;
        setState(s => ({ ...s, communityLogs: logs, communityHikes: customHikes }));
      })
      .catch(err => console.error('Failed to load community logs:', err));

    api.getCommunityTop()
      .then(({ top }) => {
        if (cancelled) return;
        setState(s => ({ ...s, communityTop: top }));
      })
      .catch(err => console.error('Failed to load community top hikes:', err));

    return () => { cancelled = true; };
  }, [state.signedIn]);

  const toast = useCallback((text, bad = false) => {
    clearTimeout(toastTimer.current);
    setToastState({ text, bad });
    toastTimer.current = setTimeout(() => setToastState(null), 2600);
  }, []);

  /* One trigger, one piece of state — whatever action awards karma just
     calls this with the LEVELS entry from karma.js. Redesigning the
     notification later (confetti, sound, a full-screen moment) only means
     changing LevelUpBanner; this call stays the same. */
  const announceLevelUp = useCallback((levelInfo) => {
    clearTimeout(levelUpTimer.current);
    setLevelUp(levelInfo);
    levelUpTimer.current = setTimeout(() => setLevelUp(null), 3400);
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
      const res = await api.signIn(email, userName);
      // The server owns the handle (it has to be unique across accounts), so
      // take whatever it assigns rather than keeping the "you" placeholder.
      setState((s) => ({
        ...s, signedIn: true, account: { email, sso: sso || null },
        user: { ...s.user, name: userName, handle: res?.user?.handle || s.user.handle },
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
                  toggleLike={toggleLike} isLiked={isLiked} getLikeCount={getLikeCount} openPhotoViewer={setPhotoViewer} />
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
                  {tab === "gear" && <GearScreen state={state} toast={toast}
                    saveGear={saveGear} removeGear={removeGear} toggleFeature={toggleFeature}
                    saveKit={saveKit} removeKit={removeKit}
                    onSell={(g) => { setSellDraft(g); setTab("market"); }} />}
                  {tab === "market" && <MarketScreen state={state} setState={setState} premium={state.premium}
                    openThread={openThread} openInbox={openInbox} openUser={openUser} sellDraft={sellDraft}
                    clearSellDraft={() => setSellDraft(null)} toast={toast} />}
                  {tab === "profile" && <ProfileScreen state={state} setState={setState} openHike={openHike}
                    removeLog={removeLog} setTop={setTop}
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
            saveLog={saveLog} saveCustomHike={saveCustomHike} setTop={setTop}
            toast={toast} onLogged={(r) => { setLogged(r); if (r.leveledUpTo) announceLevelUp(r.leveledUpTo); }} onClose={() => setAdding(null)} />
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
        <LevelUpBanner levelUp={levelUp} onDismiss={() => setLevelUp(null)} />
      </div>
    </div>
  );
}
