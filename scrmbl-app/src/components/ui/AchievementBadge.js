

/* Fastest / PR / Distance-tier badges — icon-only, styled with the same
   rounded blue background as the rare badge. Reuses .badge class styling. */
function AchievementBadge({ icon, label, size = 11 }) {
  return (
    <span className="badge" style={{ padding: "3px 5px", borderRadius: 6, gap: 0 }} title={label} aria-label={label}>
      <img src={icon} alt="" style={{ width: size, height: size, display: "block" }} />
    </span>
  );
}

export default AchievementBadge;

