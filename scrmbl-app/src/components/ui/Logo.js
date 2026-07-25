
import { ASSETS, THEME } from "../../constants";

function Logo({ size = 96 }) {
  if (ASSETS.logoUrl) return <img src={ASSETS.logoUrl} alt="SCRMBL." style={{ width: size, height: size, borderRadius: 22 }} />;
  if (ASSETS.wordmark) return (
    <div style={{
      width: size * 1.6, height: size, borderRadius: size * 0.2, background: THEME.sage,
      display: "flex", alignItems: "center", justifyContent: "center", padding: size * 0.12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    }}>
      <img src={ASSETS.wordmark} alt="SCRMBL." style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.23, background: THEME.sage,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <svg viewBox="0 0 60 34" width={size * 0.66} aria-hidden="true">
        <path d="M2 32 L14 8 L20 20 L28 2 L38 24 L44 12 L58 32 Z"
          fill="none" stroke={THEME.ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 12 L28 2 L33 13" fill={THEME.grayLight} stroke={THEME.ink} strokeWidth="1.5" />
      </svg>
      <div style={{ fontFamily: "var(--display)", fontWeight: 700, letterSpacing: 2, color: THEME.ink, fontSize: size * 0.17 }}>
        SCRMBL.
      </div>
    </div>
  );
}

export default Logo;


