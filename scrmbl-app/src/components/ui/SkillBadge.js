

/* Ski-run convention: green circle, blue square, black diamond x1-3.
   Minimal inline style, just like the rare badge. `tier` is the resolved
   object from skillTierFor() — { label, shape, color, diamonds? }. */
function SkillBadge({ tier, size = 10 }) {
  if (!tier) return null;
  if (tier.shape === "diamond") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 1, verticalAlign: "middle" }} title={tier.label} aria-label={tier.label}>
        {Array.from({ length: tier.diamonds }).map((_, i) => (
          <span key={i} style={{ width: size * 0.65, height: size * 0.65, background: tier.color, transform: "rotate(45deg)" }} />
        ))}
      </span>
    );
  }
  return (
    <span
      title={tier.label}
      aria-label={tier.label}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        background: tier.color,
        borderRadius: tier.shape === "circle" ? "50%" : 2,
        verticalAlign: "middle",
      }}
    />
  );
}

export default SkillBadge;

