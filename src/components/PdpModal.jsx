import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { cartLineId, defaultPack, formatInr, productPacks } from "../lib/packs.js";
import { useStore } from "../context/StoreContext.jsx";
import { PriceListButton } from "./PriceListButton.jsx";

function starChars(n) {
  const r = Math.max(1, Math.min(5, Number(n) || 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function ZoomImage({ src, alt }) {
  const box = useRef(null);
  const [zoom, setZoom] = useState(null);

  function move(e) {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setZoom({ x, y });
  }

  return (
    <div
      ref={box}
      className={"pdp-zoom" + (zoom ? " on" : "")}
      onMouseEnter={move}
      onMouseMove={move}
      onMouseLeave={() => setZoom(null)}
    >
      <img className="pdp-zoom-base" src={src} alt={alt} />
      <img
        className="pdp-zoom-hi"
        src={src}
        alt=""
        aria-hidden="true"
        style={
          zoom
            ? {
                transformOrigin: zoom.x * 100 + "% " + zoom.y * 100 + "%",
                transform: "scale(2.6)"
              }
            : undefined
        }
      />
      <span className="pdp-zoom-hint">Hover to zoom</span>
    </div>
  );
}

export function PdpModal() {
  const { pdpId, closePdp, addToCart, productMap } = useStore();
  const [qty, setQty] = useState(1);
  const [packId, setPackId] = useState("");
  const [live, setLive] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const p = pdpId ? productMap[pdpId] : null;

  useEffect(() => {
    setQty(1);
    setPackId("");
    setMsg("");
    setComment("");
    setRating(5);
    setName("");
    setPhone("");
    setOrderId("");
    setCity("");
    setLive([]);
    setPolicyOpen(false);
  }, [pdpId]);

  useEffect(() => {
    if (!policyOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setPolicyOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [policyOpen]);

  useEffect(() => {
    if (!pdpId) return;
    api.reviews(pdpId).then((d) => setLive(d.reviews || [])).catch(() => setLive([]));
  }, [pdpId]);

  if (!p) return null;
  const packs = productPacks(p);
  const selected = packs.find((x) => x.id === packId) || defaultPack(p);
  const reviews = live;
  const avg = live.length
    ? Math.round((live.reduce((n, r) => n + Number(r.rating || 5), 0) / live.length) * 10) / 10
    : 0;

  async function submitReview(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await api.createReview({
        productId: p.id,
        productTitle: p.title,
        name,
        phone,
        orderId,
        city,
        rating,
        comment
      });
      setLive((prev) => [res.review, ...prev]);
      setName("");
      setPhone("");
      setOrderId("");
      setCity("");
      setComment("");
      setRating(5);
      setMsg("Thank you. Your review is live.");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-labelledby="pdpTitle"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePdp();
      }}
    >
      <div className="modal-box pdp-box">
        <div className="modal-head">
          <div className="crumbs">Home &gt; Products &gt; {p.title}</div>
          <button className="modal-close" type="button" aria-label="Close details" onClick={closePdp}>
            ×
          </button>
        </div>
        <div className="pdp-banner" role="img" aria-label="Premium rice in a wooden bowl and burlap sack" />
        <div className="pdp-grid">
          <div className="pdp-photo">
            <ZoomImage src={p.img} alt={p.title} />
          </div>
          <div className="pdp-info">
            <div className="pdp-kicker">{p.cat}</div>
            <h1 id="pdpTitle">{p.title}</h1>
            <div className="pdp-rating">
              {reviews.length ? (
                <>
                  <span className="stars">{starChars(Math.round(avg))}</span> {avg} out of 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </>
              ) : (
                <span>No reviews yet</span>
              )}
            </div>
            <p>{p.desc}</p>
            {packs.length ? (
              <div className="pack-pick">
                <h3>Select Pack Size</h3>
                <div className="pack-opts" role="listbox" aria-label="Pack size">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      role="option"
                      aria-selected={selected.id === pack.id}
                      className={"pack-opt" + (selected.id === pack.id ? " on" : "")}
                      onClick={() => setPackId(pack.id)}
                    >
                      {pack.label} - {formatInr(pack.price)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="pdp-price-row">
              <div className="pdp-price">{formatInr(selected.price)}</div>
              <span className="pdp-gst">(inclusive of GST)</span>
            </div>
            <div className="pdp-block">
              <h3>Product details</h3>
              <button className="policy-link" type="button" onClick={() => setPolicyOpen(true)}>
                Return &amp; Refund Policy
              </button>
              <table className="pdp-specs">
                <tbody>
                  <tr><th>Variety</th><td>{p.title}</td></tr>
                  <tr><th>Category</th><td>{p.cat}</td></tr>
                  <tr><th>Grain type</th><td>{p.grain}</td></tr>
                  <tr><th>Moisture</th><td>{p.moisture}</td></tr>
                  <tr><th>Broken grains</th><td>{p.broken || "Max 2%"}</td></tr>
                  <tr><th>Aroma</th><td>{p.aroma || "Mild, clean aroma"}</td></tr>
                  <tr><th>Cooking</th><td>{p.cook || "Fluffy grains with good elongation"}</td></tr>
                  <tr><th>Packing</th><td>{p.pack}</td></tr>
                  <tr><th>Origin</th><td>{p.origin}</td></tr>
                  <tr><th>Minimum order</th><td>{p.moq}</td></tr>
                  <tr><th>Best for</th><td>{p.use || "Hotels, retail shops and wholesale supply"}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="pdp-qty">
              Qty (bags)
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="pdp-actions">
              <button
                className="btn btn-green"
                type="button"
                onClick={() =>
                  addToCart({
                    id: cartLineId(p.id, selected.id),
                    productId: p.id,
                    packId: selected.id,
                    packLabel: selected.label,
                    title: p.title,
                    price: selected.price,
                    img: p.img,
                    qty: Math.max(1, Number(qty) || 1)
                  })
                }
              >
                Add to Cart
              </button>
              <PriceListButton />
            </div>
            <div className="pdp-block">
              <h3>Customer reviews</h3>
              <form className="pdp-review-form" onSubmit={submitReview}>
                <p className="pdp-review-label">Write a review</p>
                <p className="pdp-review-hint">Only customers who purchased this variety can post. Enter the order ID and the phone number used at checkout.</p>
                <div className="pdp-star-pick" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} className={"pdp-star-btn" + (n <= rating ? " on" : "")} onClick={() => setRating(n)} aria-label={n + " stars"}>
                      ★
                    </button>
                  ))}
                </div>
                <div className="pdp-review-grid">
                  <input required placeholder="Order ID (e.g. BHR-1234)" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                  <input required placeholder="Phone on the order" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  <input placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <textarea required rows={3} placeholder="Your comment" value={comment} onChange={(e) => setComment(e.target.value)} />
                {msg ? <p className={"pdp-review-msg" + (msg.toLowerCase().includes("thank") ? "" : " err")}>{msg}</p> : null}
                <button className="btn btn-green" type="submit" disabled={busy}>{busy ? "Saving…" : "Submit review"}</button>
              </form>
              <div className="pdp-reviews">
                {!reviews.length ? (
                  <p className="pdp-review-empty">No reviews yet for this product.</p>
                ) : (
                  reviews.map((r) => (
                    <article className="pdp-review" key={r.id || r.name + r.comment}>
                      <div className="stars">{r.stars || starChars(r.rating)}</div>
                      <q>{r.comment || r.text}</q>
                      <strong>{r.name}</strong>{" "}
                      <span>{r.city || ""}{r.verified ? (r.city ? " · Verified purchase" : "Verified purchase") : ""}</span>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {policyOpen ? (
        <div
          className="policy-overlay"
          role="dialog"
          aria-labelledby="policyTitle"
          aria-modal="true"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setPolicyOpen(false);
          }}
        >
          <div className="policy-box">
            <button className="policy-close" type="button" aria-label="Close policy" onClick={() => setPolicyOpen(false)}>
              ×
            </button>
            <h2 id="policyTitle">Return &amp; Refund Policy</h2>
            <ul>
              <li>
                <strong>Below 20 KG:</strong> No returns if the seal is opened or broken.
              </li>
              <li>
                <strong>Above 20 KG:</strong> Returns allowed within 7 business days if usage is less than 1 KG.
              </li>
              <li>
                <strong>No Returns:</strong> VKR Sivaji, MRN, Muthyam &amp; Unity brands (due to manufacturer packaging).
              </li>
              <li>
                <strong>Exceptions:</strong> Returns accepted for damaged, defective, or incorrect products only.
              </li>
            </ul>
            <p>All returns are subject to inspection and approval.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
