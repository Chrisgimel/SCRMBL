
import { THEME } from "../../constants";

function StatCol({ n, label, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 20 }}>{n}</div>
      <div style={{ color: THEME.textDim, fontSize: 13 }}>{label}</div>
    </Tag>
  );
}

export default StatCol;


