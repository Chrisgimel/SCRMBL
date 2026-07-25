import React, { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import Sheet from "./Sheet";
import { THEME, ASSETS } from "../../constants";

function SettingsModal({ state, setState, onClose, onLoadDemo, onClear, onSignOut }) {
  const [confirm, setConfirm] = useState(null);
  return (
    <Sheet title="Settings" onClose={onClose} closeLabel="Done">
      <label className="field-label" htmlFor="st-name">Display name</label>
      <input id="st-name" className="field" value={state.user.name}
        onChange={(e) => setState((s) => ({ ...s, user: { ...s.user, name: e.target.value } }))} />
      <label className="field-label" htmlFor="st-city">City, State</label>
      <input id="st-city" className="field" value={state.user.city}
        onChange={(e) => setState((s) => ({ ...s, user: { ...s.user, city: e.target.value } }))} />
      <label className="field-label" htmlFor="st-bio">Bio</label>
      <textarea id="st-bio" className="field" rows={2} value={state.user.bio} placeholder="What kind of hiker are you?"
        onChange={(e) => setState((s) => ({ ...s, user: { ...s.user, bio: e.target.value } }))} />

      <div className="row-card" style={{ marginTop: 6, justifyContent: "space-between", cursor: "default" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {ASSETS.period && <img src={ASSETS.period} alt="" style={{ width: 22, filter: "invert(0.9)" }} />}
          <div>
            <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 14 }}>SCRMBL Premium</div>
            <div style={{ color: THEME.gray, fontSize: 12 }}>Removes ads across the app</div>
          </div>
        </div>
        <button className="chip" aria-pressed={state.premium}
          style={{ background: state.premium ? THEME.mintLight : "rgba(255,255,255,0.1)", color: state.premium ? THEME.ink : THEME.grayLight }}
          onClick={() => setState((s) => ({ ...s, premium: !s.premium }))}>
          {state.premium ? "On" : "Off"}
        </button>
      </div>

      {state.account && (
        <div style={{ color: THEME.textDim, fontSize: 12, marginTop: 12 }}>
          Signed in as {state.account.email}{state.isDemo ? " · demo data loaded" : ""}
        </div>
      )}

      {/* Demo fixtures are opt-in, never the starting point. (plan 3.8) */}
      {state.isDemo ? (
        <button className="outline-btn" style={{ marginTop: 16 }} onClick={() => setConfirm("clear")}>
          <RotateCcw size={14} style={{ verticalAlign: -2 }} /> Clear demo data
        </button>
      ) : (
        <button className="outline-btn" style={{ marginTop: 16 }} onClick={() => setConfirm("demo")}>
          <Sparkles size={14} style={{ verticalAlign: -2 }} /> Load demo data
        </button>
      )}
      <div style={{ color: THEME.textDim, fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
        Demo data is a sample diary, shelf, and locker for showing the app off. It replaces whatever's there.
      </div>
      <button className="ghost-btn" style={{ marginTop: 14, width: "100%" }} onClick={onSignOut}>Sign out</button>

      {confirm && (
        <div className="confirm">
          <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {confirm === "demo" ? "Replace your data with the demo?" : "Clear the demo data?"}
          </div>
          <div style={{ color: THEME.gray, fontSize: 13, marginBottom: 14 }}>
            {confirm === "demo"
              ? "Your entries, shelf, and locker will be overwritten by the sample set."
              : "Everything in the sample diary, shelf, and locker goes away."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="outline-btn" style={{ flex: 1 }} onClick={() => setConfirm(null)}>Keep what I have</button>
            <button className="primary-btn" style={{ flex: 1 }}
              onClick={() => { confirm === "demo" ? onLoadDemo() : onClear(); setConfirm(null); }}>
              {confirm === "demo" ? "Load demo" : "Clear it"}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export default SettingsModal;
