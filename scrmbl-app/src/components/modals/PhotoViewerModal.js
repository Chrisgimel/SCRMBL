import React from "react";
import { THEME } from "../../constants";

function PhotoViewerModal({ photo, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(12,21,26,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16, backdropFilter: "blur(4px)" }}>
      <div style={{ position: "relative", maxWidth: 500, maxHeight: 600, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "none", color: THEME.grayLight, cursor: "pointer", fontSize: 28, lineHeight: 1, width: 40, height: 40, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>×</button>
        <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
}

export default PhotoViewerModal;
