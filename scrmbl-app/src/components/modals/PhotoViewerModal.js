import React, { useState, useEffect, useRef, useCallback } from "react";
import { THEME } from "../../constants";
import Polaroid from "../ui/Polaroid";

// Photos open as a stack of polaroids you swipe through. The cards behind the
// current one are the photos you haven't reached yet, so the pile visibly
// shrinks as you advance and grows back when you swipe return.
//
// `photos` is always an array here — App.js normalizes the single-photo call
// sites (map pins, older callers) into a one-item list before this renders.
const SWIPE_PX = 55;      // drag distance that counts as a swipe
const BEHIND_MAX = 3;     // how many cards of the remaining pile to draw

function PhotoViewerModal({ photos, index = 0, onClose }) {
  const list = Array.isArray(photos) ? photos : [photos];
  const [i, setI] = useState(Math.min(Math.max(index, 0), list.length - 1));
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(null);
  const dragRef = useRef(0);
  // A swipe can start anywhere on the overlay, so the release would otherwise
  // land as a backdrop click and close the viewer mid-gesture.
  const moved = useRef(false);

  const count = list.length;
  const next = useCallback(() => setI((n) => Math.min(n + 1, count - 1)), [count]);
  const prev = useCallback(() => setI((n) => Math.max(n - 1, 0)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  const down = (x) => {
    startX.current = x; moved.current = false; dragRef.current = 0;
    setDrag(0); setDragging(true);
  };
  const move = (x) => {
    if (startX.current === null) return;
    const d = x - startX.current;
    if (Math.abs(d) > 4) moved.current = true;
    dragRef.current = d;
    setDrag(d);
  };
  const up = () => {
    if (startX.current === null) return;
    // Read the distance off the ref, not the `drag` state: the state value in
    // this closure is whatever the last render saw, which is not guaranteed to
    // be the final move of the gesture.
    const d = dragRef.current;
    if (d <= -SWIPE_PX) next();
    else if (d >= SWIPE_PX) prev();
    startX.current = null;
    dragRef.current = 0;
    setDrag(0);
    setDragging(false);
  };
  const backdropClick = () => { if (!moved.current) onClose(); };

  // Cards still to come, drawn behind the current one and fanned slightly.
  const behind = list.slice(i + 1, i + 1 + BEHIND_MAX);
  const size = 300;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(12,21,26,0.7)", backdropFilter: "blur(4px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 50, padding: 16, touchAction: "pan-y",
      }}
      onClick={backdropClick}
      onMouseDown={(e) => down(e.clientX)}
      onMouseMove={(e) => move(e.clientX)}
      onMouseUp={up}
      onMouseLeave={up}
      onTouchStart={(e) => down(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onTouchEnd={up}
    >
      <button onClick={onClose} aria-label="Close"
        style={{
          position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.5)", border: "none",
          color: THEME.grayLight, cursor: "pointer", fontSize: 28, lineHeight: 1, width: 40, height: 40,
          borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
        }}>×</button>

      {/* Stopping propagation keeps a click on the pile itself from closing */}
      <div style={{ position: "relative", width: size, height: size * 1.22 }} onClick={(e) => e.stopPropagation()}>
        {/* depth 1 is the very next photo, so it sits closest behind the front
            card. Reversed before rendering so the furthest card paints first
            and the nearest ends up on top of the rest of the pile. */}
        {behind
          .map((p, n) => ({ p, depth: n + 1 }))
          .reverse()
          .map(({ p, depth }) => (
            <div key={`behind-${i + depth}`} style={{
              position: "absolute", inset: 0, display: "flex", justifyContent: "center",
              transform: `translate(${depth * 10}px, ${depth * 7}px) rotate(${depth * 2.4}deg)`,
              zIndex: 1,
              pointerEvents: "none",
              filter: `brightness(${1 - depth * 0.12})`,
            }}>
              <Polaroid src={p} width={size} fit="cover" />
            </div>
          ))}

        <div style={{
          position: "absolute", inset: 0, display: "flex", justifyContent: "center",
          transform: `translateX(${drag}px) rotate(${drag * 0.02}deg)`,
          transition: dragging ? "none" : "transform 0.22s ease",
          zIndex: 2, cursor: list.length > 1 ? "grab" : "default",
        }}>
          <Polaroid src={list[i]} width={size} fit="cover" alt={`Photo ${i + 1} of ${list.length}`} />
        </div>
      </div>

      {list.length > 1 && (
        <div onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, zIndex: 3 }}>
          <button className="tiny-btn" onClick={prev} disabled={i === 0} aria-label="Previous photo"
            style={{ opacity: i === 0 ? 0.35 : 1 }}>‹ Prev</button>
          <div style={{ color: THEME.grayLight, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.5 }}>
            {i + 1} / {list.length}
          </div>
          <button className="tiny-btn" onClick={next} disabled={i === list.length - 1} aria-label="Next photo"
            style={{ opacity: i === list.length - 1 ? 0.35 : 1 }}>Next ›</button>
        </div>
      )}
    </div>
  );
}

export default PhotoViewerModal;
