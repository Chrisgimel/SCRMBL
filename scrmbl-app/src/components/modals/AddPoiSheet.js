import React, { useEffect, useState } from "react";
import { Send, X } from "lucide-react";

/* A compact "menu" prompt, not the full Sheet modal — same lightweight
   scrim-plus-floating-panel pattern MarketScreen's filter menu already
   uses (.menu-scrim/.menu), just anchored to the bottom instead of a
   trigger button. One text field: "tip," "POI," and "note" are all the
   same kind of pin now (type is still sent to the backend for future
   flexibility, just no longer user-chosen). */
function AddPoiSheet({ lat, lng, onSubmit, onClose }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit({ type: "tip", title: text.trim(), note: "" });
    setSubmitting(false);
    if (ok) onClose();
  }

  return (
    <div className="poi-prompt-scrim" onClick={onClose}>
      <div className="poi-prompt" onClick={(e) => e.stopPropagation()}>
        <input autoFocus className="poi-prompt-input" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add a tip, POI, beta, or note for future hikers"
          aria-label="Tip text" />
        <button onClick={onClose} aria-label="Cancel" className="poi-prompt-close">
          <X size={17} />
        </button>
        <button onClick={handleSubmit} disabled={!text.trim() || submitting} aria-label="Add tip" className="poi-prompt-send">
          <Send size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}

export default AddPoiSheet;
