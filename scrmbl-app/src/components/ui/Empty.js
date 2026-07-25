
import { Mountain } from "lucide-react";
import { THEME } from "../../constants";

function Empty({ title, subtitle, icon: Icon = Mountain, action }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 28px" }}>
      <div style={{ display: "inline-flex", width: 60, height: 60, borderRadius: "50%", background: THEME.surface, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon size={26} color={THEME.textDim} strokeWidth={1.75} />
      </div>
      <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 19, fontFamily: "var(--display)", marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ color: THEME.textDim, fontSize: 14, lineHeight: 1.5, maxWidth: 300, margin: "0 auto" }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export default Empty;


