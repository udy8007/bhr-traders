import { useId } from "react";

export function LeafIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 20c5.2-9.6 9.4-13.8 14-16-3.4 6.2-5.6 10.4-7.2 16H7z" />
      <path d="M5 18c3.8-6 7.2-9.4 11.5-12.2C13.2 11 10.4 14.4 8.6 18H5z" />
    </svg>
  );
}

export function GrainIcon() {
  return (
    <svg className="head-grain" viewBox="0 0 24 24">
      <path d="M12 22c2.2-6.5 5.8-10.2 10-13-4.8 1.2-8 3.8-10 8.2C10 12.8 6.8 10.2 2 9c4.2 2.8 7.8 6.5 10 13z" />
      <path d="M12 14c1.2-3.2 3.2-5.2 6-7-2.6.8-4.4 2.2-6 4.8C10.4 9.2 8.6 7.8 6 7c2.8 1.8 4.8 3.8 6 7z" />
    </svg>
  );
}

export function SackIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 80" fill="currentColor" aria-hidden="true">
      <path d="M18 22c0-6 6.3-10 14-10s14 4 14 10v4H18v-4z" />
      <path d="M16 26h32l-3.2 46.5c-.3 3.8-3.4 6.5-7.2 6.5H26.4c-3.8 0-6.9-2.7-7.2-6.5L16 26z" />
    </svg>
  );
}

export function SackArt({ className, label = "BHR" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 140 180" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id + "g"} x1="18" y1="20" x2="122" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3dd9a" />
          <stop offset="0.38" stopColor="#d4ae5c" />
          <stop offset="0.72" stopColor="#c49a45" />
          <stop offset="1" stopColor="#9d7530" />
        </linearGradient>
        <linearGradient id={id + "t"} x1="40" y1="8" x2="100" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ead08a" />
          <stop offset="1" stopColor="#b8893a" />
        </linearGradient>
        <pattern id={id + "p"} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 6 L6 0" stroke="#8d6828" strokeWidth="0.45" opacity="0.28" />
        </pattern>
        <filter id={id + "sh"} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#143524" floodOpacity="0.22" />
        </filter>
      </defs>
      <ellipse cx="70" cy="168" rx="42" ry="8" fill="#1a3e2e" opacity="0.16" />
      <g filter={"url(#" + id + "sh)"}>
        <path d="M46 34c0-14 10.5-24 24-24s24 10 24 24v8H46v-8z" fill={"url(#" + id + "t)"} />
        <path d="M42 40h56l4 8H38l4-8z" fill="#c9a85e" />
        <path
          d="M34 48h72l-6.4 104c-.7 8-7.4 14-15.5 14H55.9c-8.1 0-14.8-6-15.5-14L34 48z"
          fill={"url(#" + id + "g)"}
        />
        <path
          d="M34 48h72l-6.4 104c-.7 8-7.4 14-15.5 14H55.9c-8.1 0-14.8-6-15.5-14L34 48z"
          fill={"url(#" + id + "p)"}
        />
        <path d="M50 48c2 22 4 58 4 98" stroke="#8d6828" strokeWidth="1.2" opacity="0.35" />
        <path d="M90 48c-2 22-4 58-4 98" stroke="#f6e7b8" strokeWidth="1.4" opacity="0.35" />
        <ellipse cx="70" cy="108" rx="22" ry="16" fill="#0a3d24" />
        <ellipse cx="70" cy="108" rx="18" ry="12" fill="#123f28" stroke="#c9a85e" strokeWidth="1.4" />
        <text x="70" y="113" textAnchor="middle" fill="#c9a85e" fontSize="11" fontFamily="Georgia, serif" fontWeight="700">
          {String(label).slice(0, 6)}
        </text>
      </g>
    </svg>
  );
}

export function SackCardIcon() {
  return <SackArt label="BHR" />;
}

export function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 4H2" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </svg>
  );
}

export function TrackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="13" height="13" rx="1.5" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h0A2.5 2.5 0 0 1 13 5.5V7" />
      <circle cx="18.5" cy="15.5" r="3.2" />
      <path d="M18.5 14v1.5l1 .7" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SectionHead({ kicker, title, text, chevrons, ornamentAfter }) {
  const ornament = chevrons ? (
    <div className="head-ornament" aria-hidden="true">
      <span className="head-line" />
      <span className="head-chev left" />
      <GrainIcon />
      <span className="head-chev right" />
      <span className="head-line" />
    </div>
  ) : (
    <div className="head-ornament" aria-hidden="true">
      <span className="head-line" />
      <GrainIcon />
      <span className="head-line" />
    </div>
  );
  return (
    <div className="section-head">
      {kicker ? <div className="kicker">{kicker}</div> : null}
      {ornamentAfter ? null : ornament}
      {title ? <h2>{title}</h2> : null}
      {ornamentAfter ? ornament : null}
      {text ? <p>{text}</p> : null}
    </div>
  );
}
