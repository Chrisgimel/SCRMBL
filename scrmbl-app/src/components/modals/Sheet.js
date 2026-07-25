import React, { useState, useEffect } from "react";
import { THEME } from "../../constants";

function Sheet({ title, onClose, children, footer, dirty, closeLabel = "Cancel" }) {
  const [confirming, setConfirming] = useState(false);
  const attempt = () => (dirty ? setConfirming(true) : onClose());
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") attempt(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className="sheet-backdrop" onClick={attempt}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="ghost-btn" onClick={attempt}>{closeLabel}</button>
          <div style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 600, color: THEME.grayLight }}>{title}</div>
          <div style={{ width: 52 }} />
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
        {confirming && (
          <div className="confirm">
            <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Discard this draft?</div>
            <div style={{ color: THEME.gray, fontSize: 13, marginBottom: 14 }}>What you've written here won't be saved.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="outline-btn" style={{ flex: 1 }} onClick={() => setConfirming(false)}>Keep editing</button>
              <button className="primary-btn" style={{ flex: 1, background: "#8A3B3B" }} onClick={onClose}>Discard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sheet;


