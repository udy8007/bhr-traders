import { Link } from "react-router-dom";
import { categoryStyle } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { formatInr } from "../lib/packs.js";

export function CategoryScroller({ categories, active, onSelect, linkBase = "/shop" }) {
  return (
    <div className="cat-scroll-wrap">
      <h2 className="section-title">What's on your mind?</h2>
      <div className="cat-scroll">
        {categories.map((c) => {
          const style = categoryStyle(c.id);
          const isOn = active === c.id;
          const inner = (
            <div
              className={"cat-circle" + (isOn ? " on" : "")}
              style={{ background: style.bg, boxShadow: isOn ? "0 0 0 3px " + style.ring : undefined }}
            >
              <span className="cat-emoji">{style.emoji}</span>
            </div>
          );
          return (
            <div className="cat-item" key={c.id}>
              {onSelect ? (
                <button type="button" className="cat-btn" onClick={() => onSelect(c.id)}>
                  {inner}
                </button>
              ) : (
                <Link to={linkBase + "?cat=" + c.id} className="cat-btn">
                  {inner}
                </Link>
              )}
              <span className="cat-label">{c.label || style.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PromoCarousel({ promos }) {
  return (
    <div className="promo-scroll">
      {promos.map((p) => (
        <Link key={p.id} to="/shop" className="promo-card" style={{ background: p.gradient }}>
          <span className="promo-emoji">{p.emoji}</span>
          <div className="promo-text">
            <strong>{p.title}</strong>
            <span>{p.sub}</span>
            <em>{p.cta} →</em>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function FloatingCartBar() {
  const { cartCount, cartSum } = useStore();
  if (!cartCount) return null;
  return (
    <Link to="/cart" className="float-cart">
      <span className="float-cart-left">
        <span className="float-cart-badge">{cartCount}</span>
        <span>View cart</span>
      </span>
      <strong>{formatInr(cartSum)}</strong>
    </Link>
  );
}

export function StatsStrip({ stats }) {
  return (
    <div className="stats-strip">
      {stats.map((s) => (
        <div className="stat-pill" key={s.label} style={{ borderColor: s.color }}>
          <strong style={{ color: s.color }}>{s.value}</strong>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
