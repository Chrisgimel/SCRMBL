import React from "react";
import { THEME } from "../../constants";

/* Deliberately minimal — a slide-in banner is the whole "level up" moment
   for now. Swapping this for something bigger (confetti, a full-screen
   celebration sheet, sound) later only means rewriting this one component;
   the trigger (App.js's announceLevelUp) and the shape it's called with
   ({ level, name, icon }, straight from karma.js's LEVELS) don't need to
   change. */
function LevelUpBanner({ levelUp, onDismiss }) {
  if (!levelUp) return null;
  return (
    <div className="level-up-banner" role="status" onClick={onDismiss}>
      <img src={levelUp.icon} alt="" style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0, objectFit: "cover" }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: THEME.mintLight, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Level up!</div>
        <div style={{ color: THEME.grayLight, fontWeight: 700, fontSize: 15 }}>Lv.{levelUp.level} {levelUp.name}</div>
      </div>
    </div>
  );
}

export default LevelUpBanner;
