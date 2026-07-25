
import { X, Check } from "lucide-react";
import { THEME } from "../../constants";

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast" role="status" style={{ background: toast.bad ? "#8A3B3B" : THEME.slateDeep }}>
      {toast.bad ? <X size={14} /> : <Check size={14} />}
      <span>{toast.text}</span>
    </div>
  );
}

export default Toast;


