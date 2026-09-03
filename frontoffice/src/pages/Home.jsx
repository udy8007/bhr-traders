import { Link } from "react-router-dom";
import { useState } from "react";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { CategoryScroller, PromoCarousel, StatsStrip } from "../components/VisualBlocks.jsx";
import { PROMOS, STATS, WHY_BUY, PHONE, HOURS_WEEKDAY } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { api } from "../lib/api.js";
import { cartLineId, defaultPack } from "../lib/packs.js";

export function Home() {
  const { catalog, categories, catalogStatus, addToCart, ping } = useStore();
  const [priceBusy, setPriceBusy] = useState(false);
  const featured = catalog.slice(0, 8);
  const topPicks = catalog.slice(0, 12);

  function quickAdd(p) {
    const pack = defaultPack(p);
    addToCart({
      id: cartLineId(p.id, pack.id),
      productId: p.id,
      packId: pack.id,
      packLabel: pack.label,
      title: p.title,
      price: pack.price,
      img: p.img,
      qty: 1
    });
  }

  async function downloadPriceList() {
    if (priceBusy) return;
    setPriceBusy(true);
    try {
      await api.downloadPriceList();
      ping("Price list downloaded.");
    } catch (err) {
      ping(err.message || "Price list download failed.");
    } finally {
      setPriceBusy(false);
    }
  }

  return (
    <MobileLayout variant="home">
      <Link to="/shop" className="home-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
        <span>Search rice, millets, dhall…</span>
      </Link>

      <section className="home-section">
        <PromoCarousel promos={PROMOS} />
      </section>

      <StatsStrip stats={STATS} />

      <section className="home-section home-price-list">
        <button
          type="button"
          className={"price-list-card" + (priceBusy ? " busy" : "")}
          onClick={downloadPriceList}
          disabled={priceBusy}
        >
          <span className="price-list-bg" aria-hidden="true" />
          <span className="price-list-deco price-list-deco-a" aria-hidden="true" />
          <span className="price-list-deco price-list-deco-b" aria-hidden="true" />
          <span className="price-list-icon" aria-hidden="true">📄</span>
          <span className="price-list-text">
            <strong>{priceBusy ? "Preparing PDF…" : "Download price list"}</strong>
            <span>All rice varieties · Live wholesale rates · GST ready</span>
          </span>
          <span className="price-list-action" aria-hidden="true">
            {priceBusy ? (
              <span className="price-list-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 3v12" />
                <path d="M7 11l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            )}
          </span>
        </button>
      </section>

      <section className="home-section">
        <CategoryScroller categories={categories.filter((c) => c.id !== "all").slice(0, 8)} />
      </section>

      <section className="home-section">
        <div className="section-head-row">
          <h2 className="section-title">Top picks for you</h2>
          <Link to="/shop" className="link-accent">
            See all
          </Link>
        </div>
        {catalogStatus === "loading" ? (
          <div className="scroll-skel-row">
            {Array.from({ length: 4 }, (_, i) => (
              <div className="skel-scroll" key={"sk-" + i} />
            ))}
          </div>
        ) : (
          <div className="product-h-scroll">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={quickAdd} layout="scroll" />
            ))}
          </div>
        )}
      </section>

      <section className="offer-banner">
        <div className="offer-banner-inner">
          <span>🎉</span>
          <div>
            <strong>First bulk order?</strong>
            <p>Call for today's mandi rates on 25–50 kg bags</p>
          </div>
          <a href={"tel:" + PHONE.replace(/\s/g, "")} className="offer-cta">
            Call
          </a>
        </div>
      </section>

      <section className="home-section best-sellers-section">
        <div className="section-head-row">
          <div className="best-sellers-head">
            <h2 className="section-title">Best sellers</h2>
            <p className="best-sellers-sub">Most ordered this week</p>
          </div>
          <span className="live-dot">Live prices</span>
        </div>
        {catalogStatus === "loading" ? (
          <div className="best-seller-list">
            {Array.from({ length: 5 }, (_, i) => (
              <div className="skel-row bs-skel" key={"skr-" + i} />
            ))}
          </div>
        ) : (
          <div className="best-seller-list">
            {topPicks.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} onAdd={quickAdd} layout="featured" rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <h2 className="section-title">Why BHR Traders?</h2>
        <div className="why-grid-vivid">
          {WHY_BUY.map((w) => (
            <div className="why-vivid" key={w.title} style={{ borderLeftColor: w.color }}>
              <span className="why-emoji">{w.emoji}</span>
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-vivid">
        <div className="cta-vivid-bg" />
        <h3>Need help choosing?</h3>
        <p>Our team picks the right variety for hotels, messes & homes.</p>
        <a href={"tel:" + PHONE.replace(/\s/g, "")} className="btn btn-white">
          📞 {PHONE}
        </a>
        <small>{HOURS_WEEKDAY}</small>
      </section>
    </MobileLayout>
  );
}
