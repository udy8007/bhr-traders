import { GUIDE } from "../data/site.js";
import { GrainIcon, SectionHead } from "../components/Icons.jsx";

function GuideIcon({ name }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "bowl") {
    return (
      <svg {...common}>
        <path d="M4 11h16a8 8 0 0 1-16 0Z" />
        <path d="M8 7c1-2 2.5-3 4-3s3 1 4 3" />
      </svg>
    );
  }
  if (name === "steam") {
    return (
      <svg {...common}>
        <path d="M8 20h8" />
        <path d="M7 16h10" />
        <path d="M9 8c0-2 1.5-3 3-3s3 1 3 3-1.5 2-3 2" />
        <path d="M6 11c0-1.5 1-2.5 2.2-2.5" />
        <path d="M18 11c0-1.5-1-2.5-2.2-2.5" />
      </svg>
    );
  }
  if (name === "idly") {
    return (
      <svg {...common}>
        <circle cx="8" cy="10" r="2.2" />
        <circle cx="16" cy="10" r="2.2" />
        <circle cx="12" cy="16" r="2.2" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg {...common}>
        <path d="M12 3l2.2 6.4H21l-5.3 3.8 2 6.3L12 16.6 6.3 19.5l2-6.3L3 9.4h6.8L12 3z" />
      </svg>
    );
  }
  if (name === "leaf") {
    return (
      <svg {...common}>
        <path d="M5 19c8-2 13-8 14-15-7 1-13 6-14 15z" />
        <path d="M5 19c3-6 8-10 14-12" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 20c2-6 6-10 10-12-5 1-8 4-10 10C10 12 7 9 2 8c4 2 8 6 10 12z" />
    </svg>
  );
}

export function Guide() {
  return (
    <section className="guide" id="guide">
      <span className="guide-deco guide-deco-l" aria-hidden="true"><GrainIcon /></span>
      <span className="guide-deco guide-deco-r" aria-hidden="true"><GrainIcon /></span>
      <div className="wrap">
        <SectionHead
          kicker="Rice buying guide"
          title="Choose the right grain for every kitchen"
          text="Practical tips used by Chennai wholesalers, hotels, and home buyers to pick rice by cooking style, texture, and use."
        />
        <div className="guide-grid">
          {GUIDE.map((g) => (
            <article className="guide-card" data-tone={g.tone} key={g.title}>
              <div className="guide-card-top">
                <span className="guide-ico">
                  <GuideIcon name={g.icon} />
                </span>
                <div className="tag">{g.tag}</div>
              </div>
              <h3>{g.title}</h3>
              <p>{g.text}</p>
              <div className="guide-rule" />
              <ul>
                {g.tips.map((t) => (
                  <li key={t}>
                    <span className="guide-check" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="12" height="12">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path d="M5 8.2l2 2 4-4.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <a className="guide-more" href={g.href}>
                Know More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

