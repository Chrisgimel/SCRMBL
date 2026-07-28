import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2, Minimize2, Send, X } from "lucide-react";
import { THEME } from "../../constants";

/* Same click-capture trick as TrailMap's MapTapCapture — kept local here
   rather than shared, since this map's job (drag a single pin around to
   correct it) is a different concern from TrailMap's (render a route).
   That's also why this file breaks the old "TrailMap is the only leaflet
   importer" rule on purpose: a location-picker widget isn't route
   rendering, and duplicating this one small hook is cheaper than coupling
   the two together. */
function MapTapCapture({ onTap }) {
  useMapEvents({ click(e) { onTap(e.latlng.lat, e.latlng.lng); } });
  return null;
}

/* Leaflet caches the pixel size of its container at load time and never
   re-measures it on its own — the corner map's CSS transition (76px ->
   full width) leaves tiles misaligned/clipped after expanding unless
   told to re-measure once the transition finishes. */
function InvalidateOnResize({ watch }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 240);
    return () => clearTimeout(t);
  }, [watch, map]);
  return null;
}

/* A square, centered menu that blurs the background — same treatment as
   PhotoViewerModal's expanded image — rather than the old thin bottom bar,
   which was too cramped to read the full prompt. The corner map starts as
   a small read-only preview of where the pin landed and expands in place
   so a mis-tap can be corrected without leaving this screen. */
function AddPoiSheet({ lat, lng, onSubmit, onClose }) {
  const [text, setText] = useState("");
  const [pos, setPos] = useState({ lat, lng });
  const [mapOpen, setMapOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit({ type: "tip", title: text.trim(), note: "", lat: pos.lat, lng: pos.lng });
    setSubmitting(false);
    if (ok) onClose();
  }

  return (
    <div className="poi-prompt-scrim" onClick={onClose}>
      <div className="poi-prompt" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cancel" className="poi-prompt-close"><X size={17} /></button>
        <div className="poi-prompt-title">Add a tip</div>
        <textarea autoFocus className="poi-prompt-input" rows={4} value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a tip, POI, beta, or note for future hikers"
          aria-label="Tip text" />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div className={mapOpen ? "poi-map-corner open" : "poi-map-corner"}>
            <MapContainer center={[pos.lat, pos.lng]} zoom={15} zoomControl={false}
              dragging={mapOpen} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={mapOpen} attributionControl={false}
              style={{ width: "100%", height: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <InvalidateOnResize watch={mapOpen} />
              {mapOpen && <MapTapCapture onTap={(la, ln) => setPos({ lat: la, lng: ln })} />}
              <CircleMarker center={[pos.lat, pos.lng]} radius={7}
                pathOptions={{ color: "#fff", weight: 2, fillColor: THEME.slateMid, fillOpacity: 1 }} />
            </MapContainer>
            <button className="poi-map-toggle" onClick={() => setMapOpen((v) => !v)}
              aria-label={mapOpen ? "Shrink map" : "Adjust pin location"}>
              {mapOpen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>
        {mapOpen && (
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "right", marginTop: 4 }}>
            Tap the map to move the pin
          </div>
        )}

        <button onClick={handleSubmit} disabled={!text.trim() || submitting} className="poi-prompt-send" aria-label="Add tip">
          <Send size={15} color="#fff" /> {submitting ? "Adding…" : "Add tip"}
        </button>
      </div>
    </div>
  );
}

export default AddPoiSheet;
