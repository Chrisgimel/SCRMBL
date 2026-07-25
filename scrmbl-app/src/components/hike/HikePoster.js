
import { ASSETS, THEME } from "../../constants";
import { POSTER_PALETTES, seededRand } from "../../utils/helpers";

function HikePoster({ hike, style }) {
  if (!hike) return <div style={{ width: "100%", height: "100%", background: THEME.surfaceHi, ...style }} />;
  const url = ASSETS.hikeImages[hike.id];
  if (url) return <img src={url} alt="" style={{ objectFit: "cover", width: "100%", height: "100%", display: "block", ...style }} />;
  const pal = POSTER_PALETTES[hike.hue % POSTER_PALETTES.length];
  const r = seededRand(hike.id);
  const ridge = (y, amp, col, op) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 100; x += 12.5) d += ` L${x} ${y - amp / 2 - r(amp)}`;
    d += ` L100 ${y} L100 100 L0 100 Z`;
    return <path d={d} fill={col} opacity={op} />;
  };
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block", ...style }}>
      <rect width="100" height="100" fill={pal[2]} />
      <circle cx={25 + r(50)} cy={20 + r(12)} r="9" fill="#fff" opacity="0.55" />
      {ridge(58, 26, pal[1], 0.9)}
      {ridge(76, 20, pal[0], 0.95)}
      {ridge(96, 14, THEME.nearBlack, 0.85)}
    </svg>
  );
}

export default HikePoster;


