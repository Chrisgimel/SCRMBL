import React, { useState } from "react";
import SparkMark from "./SparkMark";



const ratingOut = (r) => (r / 2).toFixed(r % 2 === 0 ? 0 : 1);

function Rating({ value = 0, onChange, size = 18, label = "Rating" }) {
  const readOnly = !onChange;
  const [hover, setHover] = useState(null);
  const shown = hover ?? value;
  const set = (v) => onChange(v === value ? 0 : v);
  return (
    <div
      role={readOnly ? "img" : "slider"}
      aria-label={readOnly ? `${label}: ${ratingOut(value)} of 5` : label}
      aria-valuenow={readOnly ? undefined : value / 2}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : 5}
      aria-valuetext={readOnly ? undefined : value === 0 ? "Not rated" : `${ratingOut(value)} of 5`}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={readOnly ? undefined : (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(10, value + 1)); }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(0, value - 1)); }
        if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); onChange(0); }
      }}
      onMouseLeave={() => setHover(null)}
      style={{
        display: "inline-flex", gap: 3, borderRadius: 6, outlineOffset: 3,
        cursor: readOnly ? "default" : "pointer",
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, (shown - (n - 1) * 2) / 2));
        if (readOnly) return <SparkMark key={n} fill={fill} size={size} />;
        return (
          <span key={n} style={{ position: "relative", display: "block", width: size, height: size }}>
            <SparkMark fill={fill} size={size} />
            <button type="button" aria-label={`${n - 0.5} sparks`} onClick={() => set(n * 2 - 1)}
              onMouseEnter={() => setHover(n * 2 - 1)} className="hit" style={{ left: 0 }} />
            <button type="button" aria-label={`${n} sparks`} onClick={() => set(n * 2)}
              onMouseEnter={() => setHover(n * 2)} className="hit" style={{ right: 0 }} />
          </span>
        );
      })}
    </div>
  );
}

export default Rating;



