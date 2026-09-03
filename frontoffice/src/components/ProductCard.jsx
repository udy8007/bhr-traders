import { Link } from "react-router-dom";
import { defaultPack, formatInr, listingPrice } from "../lib/packs.js";
import { categoryStyle } from "../data/site.js";

function AddButton({ onClick, className = "", label = "ADD" }) {
  return (
    <button
      type="button"
      className={"psc-add " + className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {label}
    </button>
  );
}

export function ProductCard({ product, onAdd, layout = "grid", rank, wishlisted, onWishlist }) {
  const price = listingPrice(product);
  const pack = defaultPack(product);
  const priceLabel = product.priceLabel || formatInr(pack.price) + " / " + pack.label;
  const catStr = typeof product.cats === "string" ? product.cats : "";
  const cat = catStr.split(",")[0]?.trim() || product.cat || "all";
  const style = categoryStyle(cat);

  if (layout === "shop") {
    return (
      <article
        className="shop-vivid-card product-card-interactive"
        style={{ "--cat-color": style.ring, "--cat-bg": style.bg }}
      >
        <Link to={"/product/" + product.id} className="shop-vivid-link">
          <div className="shop-vivid-photo">
            <span className="shop-vivid-bg" aria-hidden="true" />
            <span className="shop-vivid-ring" aria-hidden="true" />
            <span className="shop-vivid-tag" style={{ background: style.ring }}>
              {style.emoji} {style.label}
            </span>
            {onWishlist ? (
              <button
                type="button"
                className={"shop-vivid-wish" + (wishlisted ? " on" : "")}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onWishlist(product);
                }}
              >
                {wishlisted ? "♥" : "♡"}
              </button>
            ) : null}
            <img src={product.img} alt={product.title} loading="lazy" />
            <div className="img-hover-glow" style={{ background: style.ring }} />
          </div>
          <div className="shop-vivid-body">
            <h3>{product.title}</h3>
            <p className="shop-vivid-desc">{product.short}</p>
            <div className="shop-vivid-price">{priceLabel}</div>
          </div>
        </Link>
        <button
          type="button"
          className="shop-vivid-cart"
          onClick={() => onAdd(product)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="20" r="1.3" />
            <circle cx="18" cy="20" r="1.3" />
            <path d="M3 4h2l2.2 11h11.4L21 8H7" />
          </svg>
          Add to Cart
        </button>
      </article>
    );
  }

  if (layout === "featured") {
    const rankClass = rank && rank <= 3 ? " bs-rank-top-" + rank : "";
    return (
      <article
        className={"bs-card product-card-interactive" + rankClass}
        style={{ "--cat-color": style.ring, "--cat-bg": style.bg }}
      >
        {rank ? (
          <span className="bs-rank-badge" aria-label={"Rank " + rank}>
            {rank <= 3 ? "🏆" : "#"}
            {rank}
          </span>
        ) : null}
        <Link to={"/product/" + product.id} className="bs-main">
          <div className="bs-text">
            <span className="bs-cat-pill" style={{ background: style.bg, color: style.ring }}>
              {style.emoji} {style.label}
            </span>
            <h3>{product.title}</h3>
            <p>{product.short}</p>
            <div className="bs-meta">
              <span className="bs-price">{formatInr(price)}</span>
              <span className="bs-rating">★ 4.8</span>
            </div>
          </div>
          <div className="bs-visual">
            <span className="bs-visual-bg" aria-hidden="true" />
            <span className="bs-visual-ring" aria-hidden="true" />
            <img src={product.img} alt={product.title} loading="lazy" />
            <div className="img-hover-glow" style={{ background: style.ring }} />
            <AddButton onClick={() => onAdd(product)} />
          </div>
        </Link>
      </article>
    );
  }

  if (layout === "list") {
    return (
      <article className="product-row product-card-interactive">
        <Link to={"/product/" + product.id} className="product-row-main">
          <div className="product-row-text">
            <span className="product-tag" style={{ background: style.bg, color: style.ring }}>
              {style.label}
            </span>
            <h3>{product.title}</h3>
            <p>{product.short}</p>
            <div className="product-row-meta">
              <span className="product-price">{formatInr(price)}</span>
              <span className="product-rating">★ 4.8</span>
            </div>
          </div>
          <div className="product-row-img">
            <img src={product.img} alt={product.title} loading="lazy" />
            <div className="img-hover-glow" style={{ background: style.ring }} />
            <AddButton onClick={() => onAdd(product)} />
          </div>
        </Link>
      </article>
    );
  }

  if (layout === "scroll") {
    return (
      <article className="product-scroll-card product-card-interactive">
        <Link to={"/product/" + product.id} className="psc-link">
          <div className="psc-img">
            <img src={product.img} alt={product.title} loading="lazy" />
            <span className="psc-badge" style={{ background: style.ring }}>
              {style.emoji}
            </span>
            <div className="img-hover-glow" style={{ background: style.ring }} />
          </div>
          <h3>{product.title}</h3>
        </Link>
        <div className="psc-actions">
          <span className="psc-price">{formatInr(price)}</span>
          <AddButton onClick={() => onAdd(product)} />
        </div>
      </article>
    );
  }

  return (
    <article className="product-card product-card-interactive">
      <Link to={"/product/" + product.id} className="product-card-link">
        <div className="product-img-wrap">
          <img src={product.img} alt={product.title} loading="lazy" />
          <span className="card-badge" style={{ background: style.ring }}>
            {style.emoji}
          </span>
          <div className="img-hover-glow" style={{ background: style.ring }} />
        </div>
        <div className="product-info">
          <h3>{product.title}</h3>
          <div className="product-price">{formatInr(price)}</div>
          <span className="product-rating-sm">★ 4.8</span>
        </div>
      </Link>
      <div className="product-card-foot">
        <AddButton onClick={() => onAdd(product)} className="psc-add-wide" />
      </div>
    </article>
  );
}
