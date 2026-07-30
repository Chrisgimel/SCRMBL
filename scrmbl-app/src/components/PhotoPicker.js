// PhotoPicker - Photo upload component with image downscaling
import React, { useRef } from "react";
import { Camera, X } from "lucide-react";
import exifr from "exifr";
import { THEME } from "../constants";
import { photoSrc } from "../utils/helpers";

export function fileToThumb(file, max = 900) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* GPS EXIF lives on the original file, not the canvas-redrawn thumbnail
   (canvas strips all metadata) — read it from `file` in parallel with the
   downscale. Most photos have none (screenshots, downloaded images, EXIF
   stripped by the OS) so a missing/unreadable tag is expected, not an error. */
function fileToGeo(file) {
  return exifr.gps(file).then((gps) => (gps ? { lat: gps.latitude, lng: gps.longitude } : null)).catch(() => null);
}

function PhotoPicker({ photos, onChange, max = 4, onError }) {
  const input = useRef(null);
  const add = async (files) => {
    const room = max - photos.length;
    if (room <= 0) return;
    try {
      const next = [];
      for (const f of [...files].slice(0, room)) {
        const [src, geo] = await Promise.all([fileToThumb(f), fileToGeo(f)]);
        next.push({ src, lat: geo?.lat ?? null, lng: geo?.lng ?? null });
      }
      onChange([...photos, ...next]);
    } catch { onError?.("Couldn't read that image. Try a JPG or PNG."); }
  };
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {photos.map((p, i) => (
        <div key={i} style={{ position: "relative", width: 66, height: 66, borderRadius: 10, overflow: "hidden" }}>
          <img src={photoSrc(p)} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button className="mini-btn" aria-label={`Remove photo ${i + 1}`}
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            style={{ position: "absolute", top: 3, right: 3, padding: 3, background: "rgba(0,0,0,0.6)" }}>
            <X size={11} />
          </button>
        </div>
      ))}
      {photos.length < max && (
        <>
          <button onClick={() => input.current?.click()} className="photo-add" aria-label="Add a photo">
            <Camera size={18} color={THEME.gray} />
            <span style={{ fontSize: 10, color: THEME.gray }}>Add</span>
          </button>
          <input ref={input} type="file" accept="image/*" multiple hidden
            onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </>
      )}
    </div>
  );
}

export default PhotoPicker;


