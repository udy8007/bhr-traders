import { useEffect, useRef, useState } from "react";
import { WHY_BUY, WHY_KPIS } from "../data/site.js";

const FX_KEY = "bhr-why-advanced";

function WhyIcon({ name }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };
  if (name === "scale") {
    return (
      <svg {...p}>
        <path d="M12 3v3" />
        <path d="M5 8h14" />
        <path d="M7 8l-3 7h6l-3-7z" />
        <path d="M17 8l-3 7h6l-3-7z" />
        <path d="M12 11v10" />
        <path d="M8 21h8" />
      </svg>
    );
  }
  if (name === "truck") {
    return (
      <svg {...p}>
        <path d="M3 7h11v10H3z" />
        <path d="M14 11h4l3 3v3h-7" />
        <circle cx="7.5" cy="18.5" r="1.6" />
        <circle cx="17.5" cy="18.5" r="1.6" />
      </svg>
    );
  }
  if (name === "seal") {
    return (
      <svg {...p}>
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }
  if (name === "invoice") {
    return (
      <svg {...p}>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4" />
        <path d="M10 12h6M10 16h4" />
      </svg>
    );
  }
  if (name === "handshake") {
    return (
      <svg {...p}>
        <path d="M8 13l3 3 8-8" />
        <path d="M3 12l5 5 2-2" />
        <path d="M14 8l2-2 4 4-3 3" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M12 21c2-6 6-10 10-12-5 1-8 4-10 10C10 13 7 10 2 9c4 2 8 6 10 12z" />
      <path d="M12 15c1.2-3 3-5 6-6.5" />
    </svg>
  );
}

function Stars() {
  return (
    <span className="why-stars" aria-label="5 star quality">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.2l2.6 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17.8 6.1 21.3l1.6-6.7-5.2-4.5 6.9-.6L12 3.2z" />
        </svg>
      ))}
    </span>
  );
}

function WhyCard({ item, fx, index }) {
  const ref = useRef(null);

  function tilt(e) {
    if (!fx) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <article
      ref={ref}
      className="why-card"
      style={{ "--i": index }}
      onMouseMove={tilt}
      onMouseLeave={reset}
    >
      <span className="why-card-shine" aria-hidden="true" />
      <div className="why-card-top">
        <Stars />
        <span className="why-ico">
          <WhyIcon name={item.icon} />
        </span>
      </div>
      <q>{item.text}</q>
      <div className="why-card-meta">
        <strong>{item.title}</strong>
        <span>{item.tag}</span>
      </div>
    </article>
  );
}

export function WhyBhr() {
  const rootRef = useRef(null);
  const [fx, setFx] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saved = localStorage.getItem(FX_KEY);
    if (saved === "off" || reduced) setFx(false);
    else setFx(true);
  }, []);

  function toggleFx() {
    setFx((on) => {
      const next = !on;
      localStorage.setItem(FX_KEY, next ? "on" : "off");
      return next;
    });
  }

  function onSpot(e) {
    if (!fx) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  }

  return (
    <section
      ref={rootRef}
      className={"why-bhr" + (fx ? " why-bhr--fx" : "")}
      id="why"
      onMouseMove={onSpot}
    >
      <div className="why-aurora" aria-hidden="true">
        <span className="why-blob why-blob-a" />
        <span className="why-blob why-blob-b" />
      </div>
      <div className="why-spot" aria-hidden="true" />

      <div className="wrap">
        <div className="why-head">
          <h2>Why Buy From BHR Traders</h2>
          <p className="why-lead">
            Trusted by families, hotels and retailers across Chennai — quality grain, fair wholesale rates, and supply you can plan around.
          </p>
          <button
            type="button"
            className={"why-fx-toggle" + (fx ? " on" : "")}
            onClick={toggleFx}
            aria-pressed={fx}
          >
            <span className="why-fx-dot" />
            Advanced mode
          </button>
        </div>

        <div className="why-kpis">
          {WHY_KPIS.map((k) => (
            <div className="why-kpi" key={k.label}>
              <strong>{k.value}</strong>
              <span>{k.label}</span>
            </div>
          ))}
        </div>

        <div className="why-grid">
          {WHY_BUY.map((item, i) => (
            <WhyCard item={item} fx={fx} index={i} key={item.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
