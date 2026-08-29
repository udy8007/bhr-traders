import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { ProductPreviewModal, productImgSrc } from "../components/ProductPreview.jsx";
import { PageHead, Pager, usePager } from "../components/Template.jsx";

export function Products() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  function load() {
    api.products().then((r) => setRows(r.products || [])).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const filtered = rows.filter((p) => {
    const hit = !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.cat.toLowerCase().includes(q.toLowerCase());
    if (!hit) return false;
    if (tab === "active") return p.active !== false;
    if (tab === "inactive") return p.active === false;
    return true;
  });
  const pager = usePager(filtered, 10);
  const activeCount = rows.filter((p) => p.active !== false).length;
  const inactiveCount = rows.filter((p) => p.active === false).length;

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(p) {
    try {
      await api.setProductActive(p.id, p.active === false);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="gform is-wide">
      <PageHead
        title="Products"
        small="Catalog items shown on the storefront."
        action={
          <Link className="gform-btn-primary mb-0" to="/master/products/new">
            <i className="material-symbols-rounded">add</i>
            Add product
          </Link>
        }
      />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}

      <section className="gform-shell">
        <div className="gform-head">
          <div>
            <p className="gform-kicker">Master catalog</p>
            <h4>{rows.length} rice SKUs</h4>
          </div>
          <span className="gform-badge">
            <i className="material-symbols-rounded">grocery</i>
            Wholesale
          </span>
        </div>

        <div className="gform-block">
          <p className="gform-label">Status</p>
          <div className="gform-tiles gform-tiles-3">
            {[
              { id: "all", label: "All", count: rows.length, icon: "inventory_2" },
              { id: "active", label: "Active", count: activeCount, icon: "check_circle" },
              { id: "inactive", label: "Inactive", count: inactiveCount, icon: "pause_circle" }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={"gform-tile" + (tab === t.id ? " is-on" : "")}
                onClick={() => setTab(t.id)}
              >
                <i className="material-symbols-rounded">{t.icon}</i>
                <strong>{t.label}</strong>
                <span className="ep-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="gform-field">
          <span>Search</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or category" />
        </label>

        <div className="ep-list plist">
          {pager.slice.map((p) => {
            const on = p.active !== false;
            const src = productImgSrc(p.img);
            return (
              <article className={"plist-row" + (on ? "" : " is-off")} key={p.id}>
                <div className="plist-thumb">
                  {src ? <img src={src} alt="" /> : <i className="material-symbols-rounded">image</i>}
                </div>
                <div className="ep-copy">
                  <strong className="plist-title">{p.title}</strong>
                  <p>{p.short || p.desc || "No description yet."}</p>
                </div>
                <span className="ep-auth is-public">{p.cat || "Uncategorised"}</span>
                <span className="plist-price">{p.priceLabel || "—"}</span>
                <span className={"ep-auth " + (on ? "is-admin" : "is-cron")}>{on ? "Active" : "Inactive"}</span>
                <div className="plist-actions">
                  <button className="gform-btn-gold gform-btn-sm" type="button" onClick={() => setPreview(p)}>
                    Preview
                  </button>
                  <Link className="gform-btn-primary gform-btn-sm" to={"/master/products/" + p.id}>
                    Edit
                  </Link>
                  <button className="gform-btn-gold gform-btn-sm" type="button" onClick={() => toggle(p)}>
                    {on ? "Deactivate" : "Activate"}
                  </button>
                  <button className="gform-btn-danger gform-btn-sm" type="button" onClick={() => remove(p.id)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!filtered.length ? <p className="gform-help">No products in this list. Use Add product.</p> : null}
        <Pager {...pager} />
      </section>
      <ProductPreviewModal product={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
