import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { CategoryScroller } from "../components/VisualBlocks.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { cartLineId, catalogPriceBounds, defaultPack, formatInr, listingPrice } from "../lib/packs.js";

export function Shop() {
  const { catalog, categories, catalogStatus, addToCart, ping } = useStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(params.get("cat") || "all");
  const [sort, setSort] = useState("popular");
  const [wish, setWish] = useState({});
  const { max: sliderMax } = useMemo(() => catalogPriceBounds(catalog), [catalog]);
  const [maxP, setMaxP] = useState(sliderMax);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const fromUrl = params.get("cat");
    if (fromUrl) setCat(fromUrl);
  }, [params]);

  useEffect(() => {
    setMaxP(sliderMax);
  }, [sliderMax]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = catalog.filter((p) => {
      const catOk = cat === "all" || p.cats.includes(cat);
      const qOk =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.short.toLowerCase().includes(query) ||
        p.cats.includes(query);
      return catOk && qOk && listingPrice(p) <= maxP;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => listingPrice(a) - listingPrice(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => listingPrice(b) - listingPrice(a));
    if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [q, cat, maxP, sort, catalog]);

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

  function toggleWish(p) {
    setWish((w) => {
      const next = !w[p.id];
      ping(next ? "Added to wishlist" : "Removed from wishlist");
      return { ...w, [p.id]: next };
    });
  }

  const loading = catalogStatus === "loading";

  const shopSearch = (
    <div className="shop-search-wrap">
      <label className="search-field-vivid search-field-header">
        <span className="search-field-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search rice varieties…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search products"
        />
      </label>
      <button
        type="button"
        className={"shop-filter-btn" + (filtersOpen ? " on" : "")}
        onClick={() => setFiltersOpen((v) => !v)}
        aria-label={filtersOpen ? "Hide filters" : "Show filters"}
        aria-expanded={filtersOpen}
      >
        {filtersOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16M4 12h10M4 18h6" />
            <circle cx="18" cy="6" r="2" fill="currentColor" stroke="none" />
            <circle cx="14" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <MobileLayout variant="shop" headerSlot={shopSearch}>
      <div className="shop-sticky-top">
        <CategoryScroller categories={categories} active={cat} onSelect={setCat} />
      </div>

      {filtersOpen && (
        <div className="filters-panel-vivid">
          <div className="filter-group">
            <label>Max price: {formatInr(maxP)}</label>
            <input type="range" min={20} max={sliderMax} step={10} value={maxP} onChange={(e) => setMaxP(Number(e.target.value))} />
          </div>
          <div className="filter-group">
            <label>Sort by</label>
            <div className="chip-row">
              {[
                ["popular", "Popular"],
                ["price-asc", "Price ↑"],
                ["price-desc", "Price ↓"],
                ["name", "A–Z"]
              ].map(([val, label]) => (
                <button key={val} type="button" className={"chip-vivid" + (sort === val ? " on" : "")} onClick={() => setSort(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="shop-count-bar">
        <span>
          {loading
            ? "Loading live catalog…"
            : shown.length
              ? "Showing 1–" + shown.length + " of " + shown.length
              : "No results"}
        </span>
        <div className="shop-toolbar-mini">
          <label className="shop-sort">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Popular</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="name">A–Z</option>
            </select>
          </label>
          {!loading && <span className="live-dot">Live</span>}
        </div>
      </div>

      {loading ? (
        <div className="shop-vivid-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div className="shop-vivid-skel" key={"sk-" + i} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state-vivid">
          <span className="empty-emoji">🔍</span>
          <p>No products match</p>
          <button type="button" className="btn btn-accent" onClick={() => { setQ(""); setCat("all"); setMaxP(sliderMax); }}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className="shop-vivid-grid">
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={quickAdd}
              layout="shop"
              wishlisted={!!wish[p.id]}
              onWishlist={toggleWish}
            />
          ))}
        </div>
      )}
    </MobileLayout>
  );
}
