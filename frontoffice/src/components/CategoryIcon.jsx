const ICONS = {
  all: (
    <>
      <path d="M12 3c-1.2 2.8-3.4 4.8-6 5.8 2.2.8 4 2.4 5.2 4.5 1.2-2 3-3.6 5.2-4.5C13.4 7.8 11.2 5.8 12 3z" fill="#FFB300" />
      <path d="M8 14c0 3.3 1.8 6 4 6s4-2.7 4-6" stroke="#558B2F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="19.5" rx="5" ry="1.2" fill="#8BC34A" opacity="0.5" />
      <circle cx="9" cy="11" r="1.2" fill="#FFF8E1" />
      <circle cx="12" cy="10" r="1.2" fill="#FFF8E1" />
      <circle cx="15" cy="11" r="1.2" fill="#FFF8E1" />
    </>
  ),
  boiled: (
    <>
      <path d="M5 10h14l-1.2 9.5a2 2 0 0 1-2 1.7H8.2a2 2 0 0 1-2-1.7L5 10z" fill="#E53935" />
      <path d="M4 10h16" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="12" cy="10" rx="8" ry="2" fill="#EF5350" />
      <path d="M8 13.5c1.5 1.2 3.2 1.8 4 1.8s2.5-.6 4-1.8" fill="#FFFDE7" />
      <circle cx="10" cy="14" r="0.8" fill="#FFF9C4" />
      <circle cx="13" cy="13.5" r="0.7" fill="#FFF9C4" />
      <circle cx="15" cy="14.5" r="0.6" fill="#FFF9C4" />
    </>
  ),
  raw: (
    <>
      <path d="M6 18c0-4 2.7-7.5 6-7.5s6 3.5 6 7.5" fill="#FFF8E1" stroke="#FFB300" strokeWidth="1.2" />
      <ellipse cx="12" cy="18" rx="7" ry="2" fill="#FFE082" opacity="0.6" />
      <circle cx="9" cy="14" r="1.1" fill="#FFFDE7" stroke="#FFB300" strokeWidth="0.6" />
      <circle cx="12" cy="13" r="1.2" fill="#FFFDE7" stroke="#FFB300" strokeWidth="0.6" />
      <circle cx="15" cy="14.2" r="1" fill="#FFFDE7" stroke="#FFB300" strokeWidth="0.6" />
      <circle cx="10.5" cy="16" r="0.9" fill="#FFFDE7" stroke="#FFB300" strokeWidth="0.6" />
      <circle cx="13.5" cy="16.2" r="0.85" fill="#FFFDE7" stroke="#FFB300" strokeWidth="0.6" />
    </>
  ),
  steam: (
    <>
      <rect x="7" y="12" width="10" height="8" rx="1.5" fill="#00ACC1" />
      <path d="M8 12V10a4 4 0 0 1 8 0v2" stroke="#00838F" strokeWidth="1.5" fill="none" />
      <path d="M10 8c0-1.5.8-2.5 2-2.5s2 1 2 2.5" stroke="#B2EBF2" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M12 5.5V3" stroke="#B2EBF2" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="12" cy="16" rx="3.5" ry="1.5" fill="#E0F7FA" />
      <circle cx="11" cy="15.5" r="0.7" fill="#fff" />
      <circle cx="13" cy="15.8" r="0.6" fill="#fff" />
    </>
  ),
  idly: (
    <>
      <ellipse cx="12" cy="17" rx="7" ry="1.5" fill="#AB47BC" opacity="0.25" />
      <ellipse cx="12" cy="15.5" rx="5.5" ry="2.2" fill="#FAFAFA" stroke="#CE93D8" strokeWidth="0.8" />
      <ellipse cx="12" cy="13" rx="5.5" ry="2.2" fill="#F5F5F5" stroke="#CE93D8" strokeWidth="0.8" />
      <ellipse cx="12" cy="10.5" rx="5.5" ry="2.2" fill="#FFF" stroke="#BA68C8" strokeWidth="0.8" />
      <path d="M9.5 10.2c1 .3 2 .3 3 0" stroke="#E1BEE7" strokeWidth="0.7" fill="none" />
      <path d="M9.5 12.7c1 .3 2 .3 3 0" stroke="#E1BEE7" strokeWidth="0.7" fill="none" />
    </>
  ),
  biriyani: (
    <>
      <path d="M6 11h12l-1 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L6 11z" fill="#BF360C" />
      <ellipse cx="12" cy="11" rx="6.5" ry="1.8" fill="#D84315" />
      <path d="M8 14h8" stroke="#FFAB91" strokeWidth="1.2" />
      <path d="M8.5 16h7" stroke="#FFE0B2" strokeWidth="1.2" />
      <path d="M9 18h6" stroke="#FFAB91" strokeWidth="1.2" />
      <circle cx="14" cy="13.5" r="0.8" fill="#FFD54F" />
      <circle cx="10" cy="17" r="0.6" fill="#FFD54F" />
      <path d="M12 7.5V5" stroke="#EC407A" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 8.5l2-2 2 2" fill="#EC407A" />
    </>
  ),
  broken: (
    <>
      <path d="M7 17c0-3.5 2.2-6.5 5-6.5s5 3 5 6.5" fill="#E8F5E9" stroke="#66BB6A" strokeWidth="1.2" />
      <ellipse cx="12" cy="17" rx="6" ry="1.5" fill="#A5D6A7" opacity="0.5" />
      <rect x="9" y="12" width="2" height="1.2" rx="0.4" fill="#FFF" stroke="#81C784" strokeWidth="0.5" transform="rotate(-15 10 12.6)" />
      <rect x="11.5" y="11.5" width="1.8" height="1" rx="0.3" fill="#FFF" stroke="#81C784" strokeWidth="0.5" transform="rotate(20 12.4 12)" />
      <rect x="13" y="13" width="1.6" height="0.9" rx="0.3" fill="#FFF" stroke="#81C784" strokeWidth="0.5" transform="rotate(-8 13.8 13.5)" />
      <rect x="10" y="14.5" width="1.5" height="0.85" rx="0.3" fill="#FFF" stroke="#81C784" strokeWidth="0.5" />
      <rect x="12.5" y="14" width="1.7" height="0.95" rx="0.3" fill="#FFF" stroke="#81C784" strokeWidth="0.5" transform="rotate(12 13.35 14.5)" />
    </>
  ),
  millets: (
    <>
      <ellipse cx="12" cy="18" rx="6.5" ry="1.5" fill="#7CB342" opacity="0.3" />
      <circle cx="9" cy="14" r="1.8" fill="#AED581" stroke="#689F38" strokeWidth="0.6" />
      <circle cx="12" cy="12.5" r="2" fill="#C5E1A5" stroke="#689F38" strokeWidth="0.6" />
      <circle cx="15.5" cy="14.5" r="1.6" fill="#8BC34A" stroke="#689F38" strokeWidth="0.6" />
      <circle cx="10.5" cy="16.5" r="1.4" fill="#DCEDC8" stroke="#689F38" strokeWidth="0.6" />
      <circle cx="14" cy="16" r="1.5" fill="#AED581" stroke="#689F38" strokeWidth="0.6" />
      <path d="M12 8v2.5" stroke="#558B2F" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 8c-1 .8-1 1.8 0 2.5 1-.7 1-1.7 0-2.5z" fill="#7CB342" />
    </>
  ),
  dhall: (
    <>
      <path d="M5 11h14l-1.2 8a2 2 0 0 1-2 1.6H8.2a2 2 0 0 1-2-1.6L5 11z" fill="#FB8C00" />
      <ellipse cx="12" cy="11" rx="7.5" ry="2" fill="#FF9800" />
      <ellipse cx="12" cy="15" rx="5" ry="2.5" fill="#FFE0B2" />
      <circle cx="10" cy="14.5" r="0.9" fill="#FFCC80" />
      <circle cx="13" cy="15" r="0.8" fill="#FFB74D" />
      <circle cx="11.5" cy="16.5" r="0.7" fill="#FFCC80" />
      <circle cx="14" cy="14" r="0.7" fill="#FFB74D" />
    </>
  )
};

export function CategoryIcon({ id, size = 36, className = "" }) {
  const content = ICONS[id] || ICONS.all;
  return (
    <svg
      className={"cat-icon" + (className ? " " + className : "")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
