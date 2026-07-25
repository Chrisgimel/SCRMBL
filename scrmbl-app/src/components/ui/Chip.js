
import { THEME } from "../../constants";

function Chip({ on, children, ...rest }) {
  return (
    <button className="chip" aria-pressed={!!on}
      style={{ background: on ? THEME.slateMid : "rgba(255,255,255,0.08)" }} {...rest}>{children}</button>
  );
}

export default Chip;


