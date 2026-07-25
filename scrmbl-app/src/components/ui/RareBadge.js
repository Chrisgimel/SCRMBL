
import { Sparkles } from "lucide-react";

function RareBadge({ size = 18 }) {
  return (
    <div className="rare-dot" style={{ width: size, height: size }} title="Rare trail" aria-label="Rare trail">
      <Sparkles size={Math.round(size * 0.55)} />
    </div>
  );
}

export default RareBadge;

