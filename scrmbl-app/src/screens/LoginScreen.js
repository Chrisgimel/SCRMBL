import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../components/ui/Logo";
import { ASSETS, COPY, THEME } from "../constants";

function LoginScreen({ onSignIn, onDemo }) {
  const [mode, setMode] = useState("in");     // "in" | "up"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const submit = () => {
    if (!emailOk) return setErr("Enter an email address in the form you@example.com.");
    if (pw.length < 8) return setErr("Passwords need at least 8 characters.");
    if (mode === "up" && !name.trim()) return setErr("Pick a name other hikers will see.");
    setErr("");
    onSignIn({ email: email.trim(), name: name.trim(), isNew: mode === "up" });
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      padding: "44px 28px 32px", position: "relative", overflow: "hidden",
      background: `radial-gradient(120% 90% at 50% 0%, ${THEME.sage} 0%, ${THEME.ink} 55%, ${THEME.nearBlack} 100%)`,
    }}>
      <svg style={{ position: "absolute", inset: 0, opacity: 0.14 }} width="100%" height="100%" aria-hidden="true">
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill={THEME.grayLight} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      {ASSETS.ridge ? (
        <img src={ASSETS.ridge} alt="" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", opacity: 0.55, pointerEvents: "none" }} />
      ) : (
        <svg viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true"
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 180, opacity: 0.5 }}>
          <path d="M0 160 L0 90 L70 40 L140 100 L210 30 L290 110 L340 70 L400 120 L400 160 Z" fill={THEME.sageDeep} />
          <path d="M0 160 L0 120 L90 80 L180 130 L260 90 L400 140 L400 160 Z" fill={THEME.nearBlack} />
        </svg>
      )}

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 340 }}>
        <Logo size={104} />
        <div style={{ fontFamily: "var(--display)", fontSize: 24, color: THEME.grayLight, margin: "26px 0 4px" }}>
          {mode === "in" ? "Log In" : "Create your account"}
        </div>
        <div style={{ color: THEME.gray, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22 }}>{COPY.tagline}</div>

        <button className="oauth-btn" onClick={() => onSignIn({ email: "you@google.com", name: "", isNew: false, sso: "Google" })}>
          <span style={{ fontWeight: 700, color: "#4285F4" }}>G</span>&nbsp; Continue with Google
        </button>
        <button className="oauth-btn" onClick={() => onSignIn({ email: "you@icloud.com", name: "", isNew: false, sso: "Apple" })}>
           Continue with Apple
        </button>

        <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "18px 0", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.25)" }} />
          <span style={{ color: THEME.gray, fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.25)" }} />
        </div>

        {mode === "up" && (
          <>
            <label className="field-label" htmlFor="f-name">Display name</label>
            <input id="f-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="What friends call you" />
          </>
        )}
        <label className="field-label" htmlFor="f-email">Email address</label>
        <input id="f-email" className="field" type="email" autoComplete="email" value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@trailhead.com" />
        <label className="field-label" htmlFor="f-pw">Password</label>
        <div style={{ position: "relative", width: "100%" }}>
          <input id="f-pw" className="field" type={showPw ? "text" : "password"} value={pw}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            onChange={(e) => { setPw(e.target.value); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="At least 8 characters" />
          <button onClick={() => setShowPw(!showPw)} className="icon-inline" aria-label={showPw ? "Hide password" : "Show password"}>
            {showPw ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
        </div>

        {err && <div role="alert" style={{ color: "#E8A0A0", fontSize: 12.5, alignSelf: "flex-start", marginTop: -4 }}>{err}</div>}

        <button className="primary-btn" style={{ marginTop: 18 }} onClick={submit}>
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
        {mode === "in" && <button className="ghost-btn" style={{ marginTop: 12, fontSize: 13 }}
          onClick={() => setErr("Password reset isn't built yet — it lands with real accounts.")}>Forgot your password?</button>}

        <div style={{ color: THEME.gray, fontSize: 13, marginTop: 22 }}>
          {mode === "in" ? "Don't have an account?" : "Already have one?"}
        </div>
        <button className="outline-btn" style={{ marginTop: 8 }} onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}>
          {mode === "in" ? "Create new account" : "Sign in instead"}
        </button>
        <button className="ghost-btn" style={{ marginTop: 14, fontSize: 12.5 }} onClick={onDemo}>
          Look around with demo data
        </button>
      </div>
    </div>
  );
}

export default LoginScreen;



