import { Link } from "react-router-dom";

export function shopOrigin() {
  const env = String(import.meta.env.VITE_SHOP_URL || "").replace(/\/$/, "");
  if (env) return env;
  const { protocol, hostname, port, pathname, origin } = window.location;
  if (pathname.startsWith("/admin")) return origin;
  if (port === "5174") return protocol + "//" + hostname + ":5173";
  return origin;
}

export function shopProductHref(id) {
  if (!id) return shopOrigin();
  return shopOrigin() + "/#product/" + encodeURIComponent(id);
}

export function productImgSrc(path) {
  const v = String(path || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || v.startsWith("data:")) return v;
  return shopOrigin() + "/" + v.replace(/^\//, "");
}

export function ProductPreviewModal({ product, onClose, showEdit = true }) {
  if (!product) return null;
  const src = productImgSrc(product.img);
  const price = product.priceLabel || ("₹" + Number(product.price || 0).toLocaleString("en-IN"));
  return (
    <div className="pform-modal" role="dialog" aria-modal="true" aria-label="Product preview" onClick={onClose}>
      <div className="gform-shell pform-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="gform-head">
          <div>
            <p className="gform-kicker">Storefront preview</p>
            <h4>{product.title || "Untitled rice"}</h4>
          </div>
          <button type="button" className="gform-pack-remove" onClick={onClose} aria-label="Close">
            <i className="material-symbols-rounded">close</i>
          </button>
        </div>
        <div className="pform-shot pform-shot-lg">
          {src ? <img src={src} alt="" /> : <i className="material-symbols-rounded">image</i>}
        </div>
        <p className="gform-help mb-2">{product.short || product.desc || "No description yet."}</p>
        <ul className="gform-steps">
          <li>
            <strong>{product.cat || "Uncategorised"}</strong>
            <span>{price}</span>
          </li>
          <li>
            <strong>{product.active === false ? "Inactive" : "Active"}</strong>
            <span>{(product.packs || []).map((x) => x.label).filter(Boolean).join(" · ") || product.pack || "No packs"}</span>
          </li>
        </ul>
        <div className="gform-actions">
          {product.id ? (
            <a className="gform-btn-primary" href={shopProductHref(product.id)} target="_blank" rel="noreferrer">
              <i className="material-symbols-rounded">open_in_new</i>
              View on shop
            </a>
          ) : null}
          {showEdit && product.id ? (
            <Link className="gform-btn-gold" to={"/master/products/" + product.id} onClick={onClose}>
              Edit product
            </Link>
          ) : (
            <button className="gform-btn-gold" type="button" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
