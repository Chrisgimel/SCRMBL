import React from "react";

// Shared polaroid frame: warm off-white border, thin on three sides and thick
// along the bottom, with a soft drop shadow. Used for gear on the Loadout
// scatter, photo thumbs on posts, and the stacked photo viewer.
//
// `fit` is the one thing callers usually have to think about: gear cutouts are
// transparent PNGs that should sit inside the frame ("contain"), while real
// hike photos should fill it ("cover").
export const POLAROID_FRAME = "#F2EFE8";
// Deliberately darker than the frame: gear cutouts are transparent PNGs, and
// on a near-white backing they bleed into the border instead of reading as a
// photo sitting inside it.
const POLAROID_INNER = "#D8D3C8";

// Small alternating tilt for a row of photos, so a set of thumbs reads as a
// scattered handful rather than a filmstrip. Index-based and stable.
const TILTS = [-3.5, 2.5, -1.5, 4, -2.5, 1.5];
export const tiltFor = (i) => TILTS[i % TILTS.length];

function Polaroid({
  src, alt = "", width = 140, rotate = 0, fit = "cover",
  caption, sub, children, style, shadow = true,
}) {
  const pad = Math.max(5, Math.round(width * 0.055));
  const photo = width - pad * 2;
  const captionH = Math.round(width * 0.17);

  return (
    <div style={{
      width,
      background: POLAROID_FRAME,
      padding: pad,
      paddingBottom: 0,
      borderRadius: 2,
      boxShadow: shadow ? "0 8px 20px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.35)" : "none",
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      flexShrink: 0,
      ...style,
    }}>
      <div style={{
        width: photo, height: photo, background: POLAROID_INNER,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        {src ? (
          /* draggable=false matters: without it a mousedown on the image
             starts a native image drag, which eats the mouseup and breaks
             swipe gestures built on top of these (see PhotoViewerModal). */
          <img src={src} alt={alt} draggable={false} style={{
            maxWidth: "100%", maxHeight: "100%",
            width: fit === "cover" ? "100%" : "auto",
            height: fit === "cover" ? "100%" : "auto",
            objectFit: fit, display: "block",
            userSelect: "none", WebkitUserDrag: "none",
          }} />
        ) : children}
      </div>
      <div style={{
        height: captionH, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 1, overflow: "hidden",
      }}>
        {caption && (
          <div style={{
            fontFamily: "var(--hand)", color: "#23262B",
            fontSize: Math.max(9, Math.round(width * 0.082)),
            maxWidth: photo, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            lineHeight: 1.2, textAlign: "center",
          }}>{caption}</div>
        )}
        {sub && (
          <div style={{
            fontFamily: "var(--hand-light)", color: "#6B6155", fontWeight: 600,
            fontSize: Math.max(9, Math.round(width * 0.085)),
            maxWidth: photo, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            lineHeight: 1.1, textAlign: "center",
          }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export default Polaroid;
