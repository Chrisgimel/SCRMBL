import React, { useState } from "react";
import Sheet from "./Sheet";
import Chip from "../ui/Chip";
import { THEME } from "../../constants";
import { POI_TYPES } from "../../constants/poiTypes";

function AddPoiSheet({ lat, lng, onSubmit, onClose }) {
  const [type, setType] = useState("tip");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit({ type, title: title.trim(), note: note.trim() });
    setSubmitting(false);
    if (ok) onClose();
  }

  return (
    <Sheet title="Add a tip" onClose={onClose} dirty={!!(title || note)}
      footer={
        <button className="primary-btn" disabled={!title.trim() || submitting} onClick={handleSubmit}>
          {submitting ? "Adding…" : "Add tip"}
        </button>
      }>
      <div style={{ color: THEME.textDim, fontSize: 12.5, marginBottom: 16 }}>
        Pinned at {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
      <label className="field-label">Type</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {POI_TYPES.map((t) => <Chip key={t.id} on={type === t.id} onClick={() => setType(t.id)}>{t.label}</Chip>)}
      </div>
      <label className="field-label" htmlFor="poi-title">Title</label>
      <input id="poi-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Loose scree, stay left" maxLength={80} />
      <label className="field-label" htmlFor="poi-note">Note (optional)</label>
      <textarea id="poi-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Any more detail other hikers should know" />
    </Sheet>
  );
}

export default AddPoiSheet;
