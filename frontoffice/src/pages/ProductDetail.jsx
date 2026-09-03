import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { categoryStyle } from "../data/site.js";
import { api } from "../lib/api.js";
import { cartLineId, defaultPack, formatInr, productPacks } from "../lib/packs.js";

const POLICY_ITEMS = [
  { title: "Below 20 KG", text: "No returns if the seal is opened or broken." },
  { title: "Above 20 KG", text: "Returns allowed within 7 business days if usage is less than 1 KG." },
  { title: "No Returns", text: "VKR Sivaji, MRN, Muthyam & Unity brands (manufacturer packaging)." },
  { title: "Exceptions", text: "Returns accepted for damaged, defective, or incorrect products only." }
];

const SPEC_ROWS = [
  { key: "title", label: "Variety" },
  { key: "cat", label: "Category" },
  { key: "grain", label: "Grain type" },
  { key: "moisture", label: "Moisture" },
  { key: "broken", label: "Broken grains", fallback: "Max 2%" },
  { key: "aroma", label: "Aroma", fallback: "Mild, clean aroma" },
  { key: "cook", label: "Cooking", fallback: "Fluffy grains with good elongation" },
  { key: "pack", label: "Packing" },
  { key: "origin", label: "Origin" },
  { key: "moq", label: "Minimum order" },
  { key: "use", label: "Best for", fallback: "Hotels, retail shops and wholesale supply" }
];

function starChars(n) {
  const r = Math.max(1, Math.min(5, Number(n) || 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function PdpHero({ product }) {
  const [active, setActive] = useState(false);
  const catStr = typeof product.cats === "string" ? product.cats : "";
  const cat = catStr.split(",")[0]?.trim() || product.cat || "all";
  const style = categoryStyle(cat);

  return (
    <div
      className={"pdp-img pdp-img-interactive" + (active ? " active" : "")}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      onTouchCancel={() => setActive(false)}
    >
      <div className="pdp-img-glow" style={{ background: style.ring }} aria-hidden="true" />
      <div className="pdp-img-ring" style={{ borderColor: style.ring }} aria-hidden="true" />
      <div className="pdp-shine" aria-hidden="true" />
      <img src={product.img} alt={product.title} draggable={false} />
      <span className="pdp-cat-badge" style={{ background: style.ring }}>
        {style.emoji} {style.label}
      </span>
      <span className="pdp-zoom-hint">{active ? "✨ Preview" : "Tap image"}</span>
    </div>
  );
}

function ReturnPolicyModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="policy-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policyTitle"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="policy-box">
        <button type="button" className="policy-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2 id="policyTitle">Return & Refund Policy</h2>
        <ul className="policy-list">
          {POLICY_ITEMS.map((item) => (
            <li key={item.title}>
              <strong>{item.title}:</strong> {item.text}
            </li>
          ))}
        </ul>
        <p className="policy-note">All returns are subject to inspection and approval.</p>
      </div>
    </div>,
    document.body
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { productMap, addToCart, ping } = useStore();
  const p = productMap[id];
  const [qty, setQty] = useState(1);
  const [packId, setPackId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [policyOpen, setPolicyOpen] = useState(false);

  useEffect(() => {
    setQty(1);
    setPackId("");
    setReviews([]);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.reviews(id).then((d) => setReviews(d.reviews || [])).catch(() => setReviews([]));
  }, [id]);

  if (!p) {
    return (
      <MobileLayout title="Product" back hideNav>
        <div className="empty-state">
          <p>Product not found.</p>
          <button type="button" className="btn btn-outline" onClick={() => navigate("/shop")}>
            Back to shop
          </button>
        </div>
      </MobileLayout>
    );
  }

  const packs = productPacks(p);
  const pack = packs.find((x) => x.id === packId) || defaultPack(p);
  const lineTotal = pack.price * qty;
  const avg = reviews.length
    ? Math.round((reviews.reduce((n, r) => n + Number(r.rating || 5), 0) / reviews.length) * 10) / 10
    : 0;

  function add() {
    addToCart({
      id: cartLineId(p.id, pack.id),
      productId: p.id,
      packId: pack.id,
      packLabel: pack.label,
      title: p.title,
      price: pack.price,
      img: p.img,
      qty
    });
    navigate("/cart");
  }

  return (
    <MobileLayout title={p.title} back hideNav>
      <div className="pdp-page">
        <PdpHero product={p} />

        <div className="pdp-body">
          <nav className="pdp-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <Link to="/shop">Products</Link>
            <span>›</span>
            <span>{p.title}</span>
          </nav>

          {p.cat && <div className="pdp-kicker">{p.cat}</div>}
          <h2>{p.title}</h2>

          <div className="pdp-rating-row">
            {reviews.length ? (
              <>
                <span className="pdp-stars">{starChars(Math.round(avg))}</span>
                <span>
                  {avg} out of 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </>
            ) : (
              <span className="pdp-no-reviews">No reviews yet</span>
            )}
          </div>

          {p.short && <p className="pdp-short">{p.short}</p>}
          {p.desc && <p className="pdp-desc">{p.desc}</p>}

          {packs.length > 0 && (
            <div className="pack-picker">
              <label>Select pack size</label>
              <div className="chip-row">
                {packs.map((pk) => (
                  <button
                    type="button"
                    key={pk.id}
                    className={"chip" + (pack.id === pk.id ? " on" : "")}
                    onClick={() => setPackId(pk.id)}
                  >
                    {pk.label} · {formatInr(pk.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pdp-price-block">
            <span className="pdp-price">{formatInr(pack.price)}</span>
            <span className="pdp-gst">(inclusive of GST)</span>
          </div>

          <div className="pdp-section">
            <h3 className="pdp-section-title">Product details</h3>
            <button type="button" className="policy-link" onClick={() => setPolicyOpen(true)}>
              Return & Refund Policy
            </button>
            <div className="pdp-specs">
              {SPEC_ROWS.map((row) => {
                const val = p[row.key] || row.fallback;
                if (!val) return null;
                return (
                  <div className="pdp-spec-row" key={row.key}>
                    <span>{row.label}</span>
                    <strong>{val}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="qty-row">
            <label>Qty (bags)</label>
            <div className="qty-box">
              <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                −
              </button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((n) => n + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="pdp-actions-row">
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => {
                ping("Call us for bulk pricing.");
                navigate("/contact");
              }}
            >
              Enquire bulk price
            </button>
          </div>

          <div className="pdp-section">
            <h3 className="pdp-section-title">Customer reviews</h3>
            <p className="pdp-review-hint">
              Write a review from <Link to="/profile">My profile → My orders</Link> after you sign in.
            </p>

            <div className="pdp-reviews">
              {!reviews.length ? (
                <p className="pdp-review-empty">No reviews yet for this product.</p>
              ) : (
                reviews.map((r) => (
                  <article className="pdp-review-card" key={r.id || r.orderId + r.comment}>
                    <div className="pdp-stars">{r.stars || starChars(r.rating)}</div>
                    <q>{r.comment || r.text}</q>
                    <strong>{r.orderId || "Verified purchase"}</strong>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pdp-sticky-bar">
          <div className="pdp-sticky-price">
            <strong>{formatInr(lineTotal)}</strong>
            <span>
              {qty} × {pack.label || "bag"}
            </span>
          </div>
          <button type="button" className="btn btn-accent pdp-add-btn" onClick={add}>
            Add to cart
          </button>
        </div>
      </div>

      <ReturnPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
    </MobileLayout>
  );
}
