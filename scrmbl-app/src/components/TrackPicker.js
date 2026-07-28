// TrackPicker - GPS track (.gpx) upload, mirrors PhotoPicker's shape.
import React, { useRef } from "react";
import { Route, X } from "lucide-react";
import { THEME } from "../constants";
import { parseGpxTrack } from "../utils/gpx";

function TrackPicker({ track, onChange, onError }) {
  const input = useRef(null);
  const add = async (files) => {
    const file = files?.[0];
    if (!file) return;
    try {
      onChange(await parseGpxTrack(file));
    } catch {
      onError?.("Couldn't read that GPS file. Make sure it's a valid .gpx export.");
    }
  };
  if (track && track.length > 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div className="chip" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Route size={13} /> GPS track attached · {track.length} points
        </div>
        <button className="mini-btn" aria-label="Remove GPS track" onClick={() => onChange(null)}>
          <X size={11} />
        </button>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <button className="outline-btn" onClick={() => input.current?.click()}>
        <Route size={15} style={{ verticalAlign: -2 }} color={THEME.gray} /> Upload GPS track (.gpx)
      </button>
      <input ref={input} type="file" accept=".gpx" hidden
        onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

export default TrackPicker;
