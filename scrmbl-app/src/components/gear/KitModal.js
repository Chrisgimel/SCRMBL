import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import Sheet from "../modals/Sheet";
import Chip from "../ui/Chip";
import { THEME, GEAR_SLOTS } from "../../constants";
import { uid } from "../../utils/helpers";

/* A kit is a named subset of the locker — "Winter 14er," "Summer
   dayhike" — so logging a hike is one tap instead of re-picking
   the same six items every time. */
function KitModal({ item, gear, onClose, onSave, onRemove }) {
  const [name, setName] = useState(item.name || "");
  const [gearIds, setGearIds] = useState(item.gearIds || []);
  const dirty = name !== (item.name || "") || gearIds.length !== (item.gearIds || []).length;
  const toggle = (id) => setGearIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  return (
    <Sheet title={item.id ? "Edit kit" : "New kit"} onClose={onClose} dirty={dirty}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {onRemove && <button className="outline-btn" style={{ flex: 1 }} onClick={onRemove}><Trash2 size={15} style={{ verticalAlign: -2 }} /> Remove</button>}
          <button className="primary-btn" style={{ flex: 2 }} disabled={!name.trim() || gearIds.length === 0}
            onClick={() => onSave({ id: item.id || uid("k"), name: name.trim(), gearIds })}>
            Save kit
          </button>
        </div>
      }>
      <label className="field-label" htmlFor="k-name">Kit name</label>
      <input id="k-name" className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Winter 14er" />

      <label className="field-label">Gear in this kit</label>
      {gear.length === 0 ? (
        <div style={{ color: THEME.textDim, fontSize: 12, marginBottom: 12, lineHeight: 1.45 }}>
          Your locker is empty — add gear first, then group it into a kit.
        </div>
      ) : (
        GEAR_SLOTS.map((s) => {
          const items = gear.filter((g) => g.slot === s.id);
          if (!items.length) return null;
          return (
            <div key={s.id} style={{ marginBottom: 12 }}>
              <div style={{ color: THEME.mintLight, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {items.map((g) => (
                  <Chip key={g.id} on={gearIds.includes(g.id)} onClick={() => toggle(g.id)}>{g.name}</Chip>
                ))}
              </div>
            </div>
          );
        })
      )}
    </Sheet>
  );
}

export default KitModal;
