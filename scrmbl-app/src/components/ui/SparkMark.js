
import { UI } from "../../assets/images";
import { THEME } from "../../constants";

function SparkMark({ fill, size }) {
  const base = (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }} aria-hidden="true">
      <path d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z"
        fill={THEME.mintLight} />
    </svg>
  );
  const empty = UI.starEmpty
    ? <img src={UI.starEmpty} alt="" width={size} height={size} style={{ display: "block" }} />
    : (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }} aria-hidden="true">
        <path d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z"
          fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      </svg>
    );
  const full = UI.starFilled
    ? <img src={UI.starFilled} alt="" width={size} height={size} style={{ display: "block" }} />
    : base;
  return (
    <span style={{ position: "relative", width: size, height: size, display: "block", flexShrink: 0 }}>
      {empty}
      {fill > 0 && (
        <span style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, overflow: "hidden" }}>
          <span style={{ display: "block", width: size }}>{full}</span>
        </span>
      )}
    </span>
  );
}

export default SparkMark;


