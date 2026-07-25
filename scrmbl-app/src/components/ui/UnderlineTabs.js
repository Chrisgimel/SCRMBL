
import { THEME } from "../../constants";

function UnderlineTabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", justifyContent: "space-between", gap: 8, borderBottom: `1px solid ${THEME.hairline}` }}>
      {tabs.map((t) => {
        const on = active === t;
        return (
          <button key={t} role="tab" aria-selected={on} onClick={() => onChange(t)}
            style={{
              background: "transparent", border: "none", cursor: "pointer", padding: "2px 0 10px",
              fontSize: 15, fontWeight: on ? 700 : 500, whiteSpace: "nowrap",
              color: on ? THEME.grayLight : THEME.textDim,
              borderBottom: on ? `2.5px solid ${THEME.grayLight}` : "2.5px solid transparent",
              marginBottom: -1, transition: "color 0.15s",
            }}>{t}</button>
        );
      })}
    </div>
  );
}

export default UnderlineTabs;


