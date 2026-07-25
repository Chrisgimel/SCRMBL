import React, { useState } from "react";
import Sheet from "./Sheet";
import Chip from "../ui/Chip";
import { THEME, SCRAMBLE } from "../../constants";
import { uid } from "../../utils/helpers";

function CreateHikeSheet({ name, onCreate, onClose }) {
  const [area, setArea] = useState("");
  const [mi, setMi] = useState("");
  const [gain, setGain] = useState("");
  const [summit, setSummit] = useState("");
  const [klass, setKlass] = useState(1);
  return (
    <Sheet title="New route" onClose={onClose} closeLabel="Back" dirty={!!(mi || gain || area)}
      footer={
        <button className="primary-btn" onClick={() => onCreate({
          id: uid("c"), name, area: area.trim() || "Custom route",
          mi: mi === "" ? null : Number(mi),
          gain: gain === "" ? null : Number(gain),
          summit: summit === "" ? null : Number(summit),
          klass, hue: Math.floor(Math.random() * 5), custom: true,
        })}>Create route</button>
      }>
      <div style={{ color: THEME.grayLight, fontFamily: "var(--display)", fontSize: 22, marginBottom: 4 }}>{name}</div>
      <div style={{ color: THEME.textDim, fontSize: 12.5, lineHeight: 1.5, marginBottom: 16 }}>
        Numbers are optional, but a route without them can't be sorted by effort or counted toward your vertical.
      </div>
      <label className="field-label" htmlFor="c-area">Area</label>
      <input id="c-area" className="field" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Sawatch Range, CO" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className="field-label" htmlFor="c-mi">Distance (mi)</label>
          <input id="c-mi" className="field" type="number" step="0.1" value={mi} onChange={(e) => setMi(e.target.value)} placeholder="—" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-label" htmlFor="c-gain">Gain (ft)</label>
          <input id="c-gain" className="field" type="number" value={gain} onChange={(e) => setGain(e.target.value)} placeholder="—" />
        </div>
      </div>
      <label className="field-label" htmlFor="c-summit">Summit elevation (ft, optional)</label>
      <input id="c-summit" className="field" type="number" value={summit} onChange={(e) => setSummit(e.target.value)} placeholder="—" />
      <label className="field-label">Scramble grade</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[1, 2, 3].map((k) => <Chip key={k} on={klass === k} onClick={() => setKlass(k)}>{SCRAMBLE[k]}</Chip>)}
      </div>
    </Sheet>
  );
}

export default CreateHikeSheet;
