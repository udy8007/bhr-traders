import { useEffect, useMemo, useState } from "react";
import { catalogPriceBounds, cartLineId, defaultPack, formatInr, listingPrice } from "../lib/packs.js";
import { categoryStyle } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";

export function Products() {
  const { addToCart, openPdp, ping, catalog, categories, catalogStatus } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const { min: sliderMin, max: sliderMax, step: sliderStep } = useMemo(
    () => catalogPriceBounds(catalog),
    [catalog]
  );
  const [maxP, setMaxP] = useState(sliderMax);
  const [sort, setSort] = useState("popular");
  const [listView, setListView] = useState(false);
  const [wish, setWish] = useState({});

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

  function reset() {
    setCat("all");
    setMaxP(sliderMax);
    setQ("");
    setSort("popular");
  }

  const loading = catalogStatus === "loading";

  return (
    <section className="section products" id="products">
      <div className="wrap">
        <div className="shop-head">
          <h2>Our Products</h2>
          <div className="crumbs">
            <a href="#home">Home</a> &gt; Products
          </div>
        </div>
        <div className="shop-layout">
          <aside className="shop-side">
            <div className="side-block">
              <h4>Search Products</h4>
              <label className="shop-search">
                <input
                  type="search"
                  placeholder="Search rice varieties..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              </label>
            </div>
            <div className="side-block">
              <h4>Categories</h4>
              <div className="cat-list">
                {loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <span className="skel skel-cat" key={"cat-skel-" + i} />
                    ))
                  : categories.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        className={cat === c.id ? "on" : ""}
                        onClick={() => setCat(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
              </div>
            </div>
            <div className="side-block">
              <h4>Price Range</h4>
              <div className="price-row">
                <span>{formatInr(sliderMin)}</span>
                <span>{formatInr(maxP)}</span>
              </div>
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={Math.min(sliderMax, Math.max(sliderMin, maxP))}
                onChange={(e) => setMaxP(Number(e.target.value))}
              />
              <button className="btn btn-green" type="button">
                Apply Filter
              </button>
              <a className="reset-link" href="#products" onClick={(e) => { e.preventDefault(); reset(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
                Reset
              </a>
            </div>
          </aside>
          <div>
            <div className="shop-toolbar">
              <span>
                {shown.length
                  ? "Showing 1–" + shown.length + " of " + shown.length + " results"
                  : catalogStatus === "loading"
                    ? "Loading products from database…"
                    : catalogStatus === "error"
                      ? "Could not load products from the database"
                      : catalog.length
                        ? "No products match your filters"
                        : "No products in the database yet"}
              </span>
              <div className="shop-tools">
                <label>
                  Sort by:
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="popular">Popularity</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name">Name</option>
                  </select>
                </label>
                <div className="view-btns">
                  <button type="button" className={!listView ? "on" : ""} title="Grid view" aria-label="Grid view" onClick={() => setListView(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="8" height="8" />
                      <rect x="13" y="3" width="8" height="8" />
                      <rect x="3" y="13" width="8" height="8" />
                      <rect x="13" y="13" width="8" height="8" />
                    </svg>
                  </button>
                  <button type="button" className={listView ? "on" : ""} title="List view" aria-label="List view" onClick={() => setListView(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="4" width="18" height="3" />
                      <rect x="3" y="10.5" width="18" height="3" />
                      <rect x="3" y="17" width="18" height="3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className={"prod-grid" + (listView ? " list" : "")} aria-busy={loading}>
              {loading
                ? Array.from({ length: 8 }, (_, i) => (
                    <article className="shop-card shop-card-skel" key={"prod-skel-" + i} aria-hidden="true">
                      <div className="shop-photo">
                        <div className="skel skel-photo" />
                        <span className="skel skel-wish" />
                      </div>
                      <div className="shop-body">
                        <div className="skel skel-title" />
                        <div className="skel skel-desc" />
                        <div className="skel skel-price" />
                        <div className="skel skel-btn" />
                      </div>
                    </article>
                  ))
                : shown.map((p) => {
                const catStr = typeof p.cats === "string" ? p.cats : "";
                const cat = catStr.split(",")[0]?.trim() || p.cat || "all";
                const style = categoryStyle(cat);

                return (
                <article
                  className="shop-card shop-card-graphic"
                  key={p.id}
                  style={{ "--cat-color": style.ring, "--cat-bg": style.bg }}
                  onClick={() => openPdp(p.id)}
                >
                  <div className="shop-photo">
                    <span className="shop-photo-bg" aria-hidden="true" />
                    <span className="shop-photo-ring" aria-hidden="true" />
                    <span className="offer-tag">80% OFF</span>
                    <span className="shop-cat-tag" style={{ background: style.ring }}>
                      {style.emoji}
                    </span>
                    <img src={p.img} alt={p.title} loading="lazy" />
                    <div className="shop-photo-glow" style={{ background: style.ring }} aria-hidden="true" />
                    <button
                      className={"wish" + (wish[p.id] ? " on" : "")}
                      type="button"
                      aria-label="Wishlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWish((w) => ({ ...w, [p.id]: !w[p.id] }));
                        ping(!wish[p.id] ? "Added to wishlist" : "Removed from wishlist");
                      }}
                    >
                      {wish[p.id] ? "♥" : "♡"}
                    </button>
                    <button
                      className="shop-photo-add"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                      }}
                    >
                      ADD
                    </button>
                  </div>
                  <div className="shop-body">
                    <h3>{p.title}</h3>
                    <p className="desc">{p.short}</p>
                    <div className="price">{p.priceLabel || formatInr(defaultPack(p).price)}</div>
                    <button
                      className="btn btn-quote add-cart"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="20" r="1.3" />
                        <circle cx="18" cy="20" r="1.3" />
                        <path d="M3 4h2l2.2 11h11.4L21 8H7" />
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </article>
              );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
