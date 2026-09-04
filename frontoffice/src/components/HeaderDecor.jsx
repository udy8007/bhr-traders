export function HeaderDecorations() {
  return (
    <>
      <div className="header-gradient" />
      <span className="home-header-glow home-header-glow-a" aria-hidden="true" />
      <span className="home-header-glow home-header-glow-b" aria-hidden="true" />
      <span className="home-header-deco home-header-deco-a" aria-hidden="true">🌾</span>
      <span className="home-header-deco home-header-deco-b" aria-hidden="true">🍚</span>
      <span className="home-header-deco home-header-deco-c" aria-hidden="true">✨</span>
    </>
  );
}

export function HeaderCurve() {
  return <div className="home-header-curve" aria-hidden="true" />;
}

export function HeaderGrainPattern() {
  return (
    <svg className="home-welcome-grain" viewBox="0 0 120 80" aria-hidden="true">
      <ellipse cx="98" cy="18" rx="5" ry="10" fill="#fff" opacity="0.12" transform="rotate(25 98 18)" />
      <ellipse cx="108" cy="38" rx="4" ry="9" fill="#fff" opacity="0.1" transform="rotate(-15 108 38)" />
      <ellipse cx="88" cy="52" rx="5" ry="11" fill="#fff" opacity="0.14" transform="rotate(40 88 52)" />
      <ellipse cx="104" cy="62" rx="4" ry="8" fill="#fff" opacity="0.08" transform="rotate(-30 104 62)" />
      <circle cx="72" cy="14" r="3" fill="#FFB703" opacity="0.35" />
      <circle cx="82" cy="68" r="2.5" fill="#FFB703" opacity="0.25" />
    </svg>
  );
}

export function HeaderGlassCard({ className = "", children }) {
  return (
    <div className={"home-welcome-card" + (className ? " " + className : "")}>
      <span className="home-welcome-bg" aria-hidden="true" />
      <span className="home-welcome-shimmer" aria-hidden="true" />
      <HeaderGrainPattern />
      <span className="home-welcome-spark home-welcome-spark-a" aria-hidden="true">✨</span>
      <span className="home-welcome-spark home-welcome-spark-b" aria-hidden="true">🌾</span>
      <span className="home-welcome-spark home-welcome-spark-c" aria-hidden="true">🍚</span>
      {children}
    </div>
  );
}
