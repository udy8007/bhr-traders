import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { ProductPreviewModal, productImgSrc, shopProductHref } from "../components/ProductPreview.jsx";
import { PageHead } from "../components/Template.jsx";

const EMPTY = {
  title: "",
  short: "",
  cat: "",
  cats: "",
  price: "",
  desc: "",
  grain: "",
  moisture: "",
  pack: "25 kg / 50 kg bags",
  packs: [{ id: "26_kg", label: "26 KG", kg: 26, price: "" }],
  origin: "India",
  moq: "1 bag",
  broken: "",
  aroma: "",
  cook: "",
  use: "",
  img: "images/product-hero.jpg"
};

const SPECS = [
  { key: "grain", label: "Grain", hint: "e.g. Extra long", icon: "spa" },
  { key: "moisture", label: "Moisture", hint: "e.g. 12–13%", icon: "water_drop" },
  { key: "pack", label: "Pack copy", hint: "e.g. 25 kg / 50 kg bags", icon: "inventory_2" },
  { key: "origin", label: "Origin", hint: "e.g. India", icon: "public" },
  { key: "moq", label: "MOQ", hint: "e.g. 1 ton", icon: "shopping_bag" },
  { key: "broken", label: "Broken", hint: "e.g. < 5%", icon: "percent" },
  { key: "aroma", label: "Aroma", hint: "e.g. Strong basmati", icon: "air" },
  { key: "cook", label: "Cook", hint: "e.g. Elongates well", icon: "skillet" },
  { key: "use", label: "Best use", hint: "e.g. Biryani, hotels", icon: "restaurant" }
];

function patchPack(packs, idx, next) {
  const list = [...packs];
  list[idx] = { ...list[idx], ...next };
  return list;
}

export function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories || [])).catch(() => {});
    if (!isNew) {
      api.product(id).then((r) => {
        const p = r.product;
        setForm({
          title: p.title || "",
          short: p.short || "",
          cat: p.cat || "",
          cats: p.cats || "",
          price: p.price ?? "",
          desc: p.desc || "",
          grain: p.grain || "",
          moisture: p.moisture || "",
          pack: p.pack || "",
          packs: Array.isArray(p.packs) && p.packs.length ? p.packs : [{ id: "26_kg", label: "26 KG", kg: 26, price: p.price || "" }],
          origin: p.origin || "",
          moq: p.moq || "",
          broken: p.broken || "",
          aroma: p.aroma || "",
          cook: p.cook || "",
          use: p.use || "",
          img: p.img || EMPTY.img
        });
      }).catch((e) => setError(e.message));
    }
  }, [id, isNew]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.cat) {
      setError("Pick a rice category.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = { ...form, cats: form.cats || String(form.cat).toLowerCase() };
      if (isNew) await api.createProduct(payload);
      else await api.updateProduct(id, payload);
      navigate("/master/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const preview = productImgSrc(form.img);
  const previewProduct = {
    ...form,
    id: isNew ? "" : id,
    priceLabel: form.price !== "" && form.price != null ? "₹" + Number(form.price).toLocaleString("en-IN") + " / kg" : ""
  };

  return (
    <div className="gform is-wide">
      <PageHead
        title={isNew ? "Add product" : "Edit product"}
        small="Master catalog · Wholesale rice"
        action={
          <button type="button" className="gform-btn-gold mb-0" onClick={() => navigate("/master/products")}>
            <i className="material-symbols-rounded">arrow_back</i>
            Back to products
          </button>
        }
      />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <form className="gform-layout" onSubmit={onSubmit}>
        <div>
          <section className="gform-shell">
            <div className="gform-head">
              <div>
                <p className="gform-kicker">Basic details</p>
                <h4>{form.title || "New rice SKU"}</h4>
              </div>
              <span className="gform-badge">
                <i className="material-symbols-rounded">grocery</i>
                {isNew ? "New" : "Edit"}
              </span>
            </div>

            <div className="gform-split">
              <label className="gform-field">
                <span>Product title</span>
                <input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. 1121 Steam Basmati" />
              </label>
              <label className="gform-field">
                <span>Base ₹ / kg</span>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required placeholder="0.00" />
              </label>
            </div>

            <div className="gform-block">
              <p className="gform-label">Category</p>
              <div className="gform-tiles gform-tiles-3">
                {categories.map((c) => {
                  const on = form.cat === c.name || form.cats === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={"gform-tile" + (on ? " is-on" : "")}
                      onClick={() => {
                        set("cat", c.name);
                        set("cats", c.id);
                      }}
                    >
                      <i className="material-symbols-rounded">grain</i>
                      <strong>{c.name}</strong>
                    </button>
                  );
                })}
              </div>
              {!form.cat ? <p className="gform-hint">Pick a rice category.</p> : null}
            </div>

            <label className="gform-field">
              <span>Short description</span>
              <input value={form.short} onChange={(e) => set("short", e.target.value)} placeholder="One line for the shop card" />
            </label>
            <label className="gform-field">
              <span>Full description</span>
              <textarea rows={4} value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Trade notes, cooking, who it is for…" />
            </label>
            <label className="gform-field">
              <span>Image path</span>
              <input value={form.img} onChange={(e) => set("img", e.target.value)} placeholder="images/product-hero.jpg" />
            </label>
            <p className="gform-help">File under public/, e.g. images/1121-steam.jpg</p>

            <div className="gform-block">
              <p className="gform-label">Pack sizes</p>
              {(form.packs || []).map((pack, idx) => (
                <div className="gform-pack" key={idx}>
                  <label className="gform-field">
                    <span>Label</span>
                    <input
                      value={pack.label}
                      placeholder="26 KG"
                      onChange={(e) => set("packs", patchPack(form.packs, idx, { label: e.target.value }))}
                    />
                  </label>
                  <label className="gform-field">
                    <span>Kg</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={pack.kg}
                      onChange={(e) => {
                        const kg = e.target.value;
                        set("packs", patchPack(form.packs, idx, {
                          kg,
                          id: String(kg).replace(".", "_") + "_kg",
                          label: pack.label || (kg + " KG")
                        }));
                      }}
                    />
                  </label>
                  <label className="gform-field">
                    <span>Bag price (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pack.price}
                      onChange={(e) => set("packs", patchPack(form.packs, idx, { price: e.target.value }))}
                    />
                  </label>
                  <button
                    className="gform-pack-remove"
                    type="button"
                    onClick={() => set("packs", form.packs.filter((_, i) => i !== idx))}
                  >
                    <i className="material-symbols-rounded">close</i>
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="gform-btn-gold"
                type="button"
                onClick={() => set("packs", [...(form.packs || []), { id: "pack-" + Date.now(), label: "", kg: "", price: "" }])}
              >
                <i className="material-symbols-rounded">add</i>
                Add pack size
              </button>
            </div>
          </section>

          <section className="gform-shell mt-3">
            <div className="gform-head">
              <div>
                <p className="gform-kicker">Trade specs</p>
                <h4>Grain, cook, and trade notes</h4>
              </div>
            </div>
            <div className="gform-spec-grid">
              {SPECS.map((s) => (
                <label className="gform-field" key={s.key}>
                  <span>{s.label}</span>
                  <input value={form[s.key]} onChange={(e) => set(s.key, e.target.value)} placeholder={s.hint} title={s.hint} />
                  <em className="gform-hint">{s.hint}</em>
                </label>
              ))}
            </div>
          </section>

          <div className="gform-actions">
            <button className="gform-btn-primary" type="submit" disabled={busy}>
              <i className="material-symbols-rounded">save</i>
              {busy ? "Saving…" : "Save product"}
            </button>
            <button className="gform-btn-gold" type="button" onClick={() => setShowPreview(true)}>
              <i className="material-symbols-rounded">visibility</i>
              Preview
            </button>
            <button className="gform-btn-gold" type="button" onClick={() => navigate("/master/products")}>
              Cancel
            </button>
          </div>
        </div>

        <aside className="gform-aside pform-aside">
          <div className="pform-shot">
            {preview ? <img src={preview} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : (
              <span className="ncfg-icon" aria-hidden="true">
                <i className="material-symbols-rounded">image</i>
              </span>
            )}
          </div>
          <p className="gform-kicker">Preview</p>
          <h5 className="pform-title">{form.title || "Untitled rice"}</h5>
          <p className="gform-help">{form.short || "Short description shows on the shop card."}</p>
          <ul className="gform-steps">
            <li>
              <strong>{form.cat || "No category"}</strong>
              <span>₹ {form.price || "0"} / kg · {(form.packs || []).length} pack{(form.packs || []).length === 1 ? "" : "s"}</span>
            </li>
            <li>
              <strong>Origin {form.origin || "—"}</strong>
              <span>MOQ {form.moq || "—"}</span>
            </li>
          </ul>
          <div className="gform-actions" style={{ marginTop: 12, paddingTop: 12 }}>
            <button className="gform-btn-gold" type="button" onClick={() => setShowPreview(true)}>
              <i className="material-symbols-rounded">visibility</i>
              Preview
            </button>
            {!isNew ? (
              <a className="gform-btn-primary" href={shopProductHref(id)} target="_blank" rel="noreferrer">
                <i className="material-symbols-rounded">open_in_new</i>
                View on shop
              </a>
            ) : null}
          </div>
        </aside>
      </form>
      <ProductPreviewModal product={showPreview ? previewProduct : null} onClose={() => setShowPreview(false)} showEdit={false} />
    </div>
  );
}
