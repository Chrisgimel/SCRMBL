
import { THEME } from "../../constants";
import { seededRand } from "../../utils/helpers";

function ElevationSketch({ hike }) {
  const r = seededRand(hike.id);
  const pts = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const shape = Math.sin(t * Math.PI) ** 0.8;
    return [t * 100, 40 - shape * 34 + r(4)];
  });
  const d = `M0 40 ` + pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + ` L100 40 Z`;
  return (
    <div style={{ marginTop: 14, background: THEME.surface, borderRadius: 14, padding: "10px 12px 6px" }}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: 54, display: "block" }} aria-label={`Rough profile: ${hike.gain} feet over ${hike.mi} miles`}>
        <path d={d} fill={THEME.sageDeep} />
        <path d={d.replace(/^M0 40 /, "M0 40 ").replace(/ L100 40 Z$/, "")} fill="none" stroke={THEME.mintLight} strokeWidth="0.8" />
      </svg>
      <div style={{ color: THEME.textDim, fontSize: 10.5, marginTop: 2 }}>
        Rough profile from distance and gain — real GPS tracks come with licensed trail data.
      </div>
    </div>
  );
}

export default ElevationSketch;


