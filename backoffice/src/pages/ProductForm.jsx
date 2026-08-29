import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { PageHead, Card } from "../components/Template.jsx";

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
  { key: "grain", label: "Grain", hint: "e.g. Extra long" },
  { key: "moisture", label: "Moisture", hint: "e.g. 12–13%" },
  { key: "pack", label: "Pack", hint: "e.g. 25 kg / 50 kg bags" },
  { key: "origin", label: "Origin", hint: "e.g. India" },
  { key: "moq", label: "MOQ", hint: "e.g. 1 ton" },
  { key: "broken", label: "Broken", hint: "e.g. < 5%" },
  { key: "aroma", label: "Aroma", hint: "e.g. Strong basmati" },
  { key: "cook", label: "Cook", hint: "e.g. Elongates well" },
  { key: "use", label: "Best use", hint: "e.g. Biryani, hotels" }
];

function Field({ label, filled, children }) {
  return (
    <div className={"input-group input-group-outline mb-3" + (filled ? " is-filled focused" : "")}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <>
      <PageHead title={isNew ? "Add product" : "Edit product"} small="Master catalog" />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <form className="product-form" onSubmit={onSubmit}>
        <Card title="Basic details">
          <div className="row">
            <div className="col-md-6">
              <Field label="Product title" filled={!!form.title}>
                <input className="form-control" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder=" " />
              </Field>
            </div>
            <div className="col-md-3">
              <Field label="Base ₹ / kg (filter)" filled={form.price !== "" && form.price != null}>
                <input className="form-control" type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required placeholder=" " />
              </Field>
            </div>
            <div className="col-md-3">
              <div className="input-group input-group-static mb-3">
                <label>Category</label>
                <select
                  className="form-control"
                  value={form.cat}
                  required
                  onChange={(e) => {
                    const name = e.target.value;
                    const found = categories.find((c) => c.name === name || c.id === name);
                    set("cat", found?.name || name);
                    set("cats", found?.id || name.toLowerCase());
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-12">
              <Field label="Short description" filled={!!form.short}>
                <input className="form-control" value={form.short} onChange={(e) => set("short", e.target.value)} placeholder=" " />
              </Field>
            </div>
            <div className="col-md-12">
              <Field label="Full description" filled={!!form.desc}>
                <textarea className="form-control" rows="4" value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder=" " />
              </Field>
            </div>
            <div className="col-md-12">
              <Field label="Image path" filled={!!form.img}>
                <input className="form-control" value={form.img} onChange={(e) => set("img", e.target.value)} placeholder=" " />
              </Field>
            </div>
            <div className="col-md-12">
              <p className="text-sm text-bold mb-2">Pack sizes</p>
              {(form.packs || []).map((pack, idx) => (
                <div className="row" key={idx}>
                  <div className="col-md-3">
                    <Field label="Label" filled={!!pack.label}>
                      <input className="form-control" value={pack.label} placeholder=" " onChange={(e) => {
                        const packs = [...form.packs];
                        packs[idx] = { ...pack, label: e.target.value };
                        set("packs", packs);
                      }} />
                    </Field>
                  </div>
                  <div className="col-md-3">
                    <Field label="Kg" filled={pack.kg !== "" && pack.kg != null}>
                      <input className="form-control" type="number" step="0.1" min="0" value={pack.kg} placeholder=" " onChange={(e) => {
                        const kg = e.target.value;
                        const packs = [...form.packs];
                        packs[idx] = { ...pack, kg, id: String(kg).replace(".", "_") + "_kg", label: pack.label || (kg + " KG") };
                        set("packs", packs);
                      }} />
                    </Field>
                  </div>
                  <div className="col-md-3">
                    <Field label="Bag price (₹)" filled={pack.price !== "" && pack.price != null}>
                      <input className="form-control" type="number" step="0.01" min="0" value={pack.price} placeholder=" " onChange={(e) => {
                        const packs = [...form.packs];
                        packs[idx] = { ...pack, price: e.target.value };
                        set("packs", packs);
                      }} />
                    </Field>
                  </div>
                  <div className="col-md-3 d-flex align-items-center">
                    <button className="btn btn-outline-secondary btn-sm mb-3" type="button" onClick={() => set("packs", form.packs.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>
              ))}
              <button
                className="btn btn-outline-info btn-sm mb-3"
                type="button"
                onClick={() => set("packs", [...(form.packs || []), { id: "pack-" + Date.now(), label: "", kg: "", price: "" }])}
              >
                Add pack size
              </button>
            </div>
          </div>
        </Card>
        <div className="mt-4">
          <Card title="Trade specs">
            <div className="row">
              {SPECS.map((s) => (
                <div className="col-md-4" key={s.key}>
                  <Field label={s.label} filled={!!form[s.key]}>
                    <input className="form-control" value={form[s.key]} onChange={(e) => set(s.key, e.target.value)} placeholder=" " title={s.hint} />
                  </Field>
                  <p className="text-xs text-secondary mt-n2 mb-3">{s.hint}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-3 mb-4">
          <button className="btn bg-gradient-info mb-0" type="submit" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>{" "}
          <button className="btn btn-outline-secondary mb-0" type="button" onClick={() => navigate("/master/products")}>Cancel</button>
        </div>
      </form>
    </>
  );
}
