
import { ASSETS, THEME } from "../../constants";
import { POSTER_PALETTES } from "../../utils/helpers";

function Avatar({ hue = 0, size = 40, ring = true, handle }) {
  const url = handle ? ASSETS.avatarImages[handle] : null;
  const pal = POSTER_PALETTES[hue % POSTER_PALETTES.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      border: ring && !url ? `3px solid ${THEME.sageDeep}` : "none", flexShrink: 0,
    }}>
      {url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
        <svg viewBox="0 0 40 40" aria-hidden="true" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect width="40" height="40" fill={pal[0]} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="20" cy="12" rx="6" ry="10" fill={pal[2]} opacity="0.85"
              transform={`rotate(${a} 20 20)`} />
          ))}
          <circle cx="20" cy="20" r="5" fill={pal[1]} />
        </svg>
      )}
    </div>
  );
}

export default Avatar;


