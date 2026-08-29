import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager, usePager } from "../components/Template.jsx";

const EMPTY_PACK = { size: "", best_for: "", typical_use: "", buying_tip: "" };
const TONES = ["info", "success", "warning", "primary", "danger", "dark"];
const ICONS = ["rice_bowl", "grain", "spa", "local_dining", "star", "eco", "inventory_2", "category"];

function productCount(cat, products) {
  const id = String(cat.id || "").toLowerCase();
  const name = String(cat.name || "").toLowerCase();
  return products.filter((p) => {
    const cats = String(p.cats || "").toLowerCase();
    const catName = String(p.cat || "").toLowerCase();
    return cats === id || catName === name || catName === id;
  }).length;
}

function MixChart({ slices }) {
  const total = slices.reduce((n, s) => n + s.count, 0) || 1;
  const colors = ["#143524", "#c4a35a", "#1f4d32", "#8b7355", "#2a6b40", "#d4af37", "#5e6b57", "#8d6e3d"];
  let angle = 0;
  const segs = slices.map((s, i) => {
    const sweep = (s.count / total) * 360;
    const start = angle;
    angle += sweep;
    return { ...s, start, sweep, color: colors[i % colors.length] };
  });
  const gradient = segs
    .map((s) => s.color + " " + s.start + "deg " + (s.start + s.sweep) + "deg")
    .join(", ");
  return (
    <div className="d-flex align-items-center flex-wrap">
      <div className="cat-mix" style={{ background: "conic-gradient(" + (slices.some((s) => s.count) ? gradient : "#eadfc8 0 360deg") + ")" }}>
        <span>{total}</span>
      </div>
      <div className="ms-3">
        {segs.map((s) => (
          <p className="text-xs mb-1" key={s.id}>
            <span className="dash-dot" style={{ background: s.color }} />
            {s.name} ({s.count})
          </p>
        ))}
        {!slices.length ? <p className="text-xs text-secondary mb-0">No categories yet.</p> : null}
      </div>
    </div>
  );
}

export function Categories() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const pager = usePager(rows, 8);

  function load() {
    Promise.all([api.categories(), api.products()])
      .then(([c, p]) => {
        setRows(c.categories || []);
        setProducts(p.products || []);
      })
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const slices = useMemo(
    () => rows.map((c) => ({ id: c.id, name: c.name, count: productCount(c, products) })),
    [rows, products]
  );

  function cancelEdit() {
    setEditing(null);
    setName("");
  }

  function startEdit(row) {
    setError("");
    setEditing(row);
    setName(row.name || "");
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) await api.updateCategory(editing.id, { name, sort: editing.sort });
      else await api.saveCategory({ name });
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      await api.deleteCategory(id);
      if (editing?.id === id) cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHead title="Categories" small="Group products for the shop catalog." />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <div className="row">
        <div className="col-lg-5 mb-4">
          <Card title={editing ? "Edit category" : "Add category"}>
            <form onSubmit={save}>
              <div className={"input-group input-group-outline mb-3" + (name ? " is-filled" : "")}>
                <label className="form-label">Category name</label>
                <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <button className="btn bg-gradient-info mb-0" type="submit">{editing ? "Update" : "Add"}</button>{" "}
              {editing ? <button className="btn btn-outline-info mb-0" type="button" onClick={cancelEdit}>Cancel</button> : null}
            </form>
          </Card>
        </div>
        <div className="col-lg-7 mb-4">
          <Card title="Products by category">
            <MixChart slices={slices} />
          </Card>
        </div>
      </div>
      <div className="row">
        {pager.slice.map((c, i) => {
          const count = productCount(c, products);
          const max = Math.max(1, ...slices.map((s) => s.count));
          const tone = TONES[i % TONES.length];
          const idx = rows.findIndex((r) => r.id === c.id);
          return (
            <div className="col-xl-3 col-md-6 mb-4" key={c.id}>
              <div className="card cat-card h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className={"icon icon-lg icon-shape bg-gradient-" + tone + " shadow-" + tone + " text-center border-radius-lg"}>
                      <i className="material-symbols-rounded opacity-10">{ICONS[idx % ICONS.length]}</i>
                    </div>
                    <span className="text-xs text-secondary">{c.id}</span>
                  </div>
                  <h6 className="mt-3 mb-1">{c.name}</h6>
                  <p className="text-sm mb-2"><strong>{count}</strong> live product{count === 1 ? "" : "s"}</p>
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar mb-3">
                    <rect width="100" height="8" rx="4" fill="#eadfc8" />
                    <rect width={Math.max(count ? 8 : 0, (count / max) * 100)} height="8" rx="4" fill="#c4a35a" />
                  </svg>
                  <button className="btn btn-sm bg-gradient-info mb-0" type="button" onClick={() => startEdit(c)}>Edit</button>{" "}
                  <button className="btn btn-sm bg-gradient-danger mb-0" type="button" onClick={() => remove(c.id)}>Delete</button>{" "}
                  <Link className="btn btn-sm btn-outline-info mb-0" to="/master/products">View</Link>
                </div>
              </div>
            </div>
          );
        })}
        {!rows.length ? (
          <div className="col-12">
            <p className="text-sm text-secondary">No categories yet. Add one above.</p>
          </div>
        ) : null}
      </div>
      <Pager {...pager} />
    </>
  );
}

export function Packs() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_PACK);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const pager = usePager(rows, 10);

  function load() {
    api.packs().then((r) => setRows(r.packs || [])).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_PACK);
  }

  function startEdit(row) {
    setError("");
    setEditing(row);
    setForm({
      size: row.size || "",
      best_for: row.best_for || "",
      typical_use: row.typical_use || "",
      buying_tip: row.buying_tip || ""
    });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      if (editing) await api.updatePack(editing.id, { ...form, sort: editing.sort });
      else await api.savePack(form);
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this pack size?")) return;
    setError("");
    try {
      await api.deletePack(id);
      if (editing?.id === id) cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHead title="Pack sizes" small="Bag sizes offered to wholesale buyers." />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <Card title={editing ? "Edit pack size" : "Add pack size"}>
        <form className="row" onSubmit={save}>
          {["size", "best_for", "typical_use", "buying_tip"].map((k) => (
            <div className="col-md-3 mb-3" key={k}>
              <div className={"input-group input-group-outline" + (form[k] ? " is-filled" : "")}>
                <label className="form-label">{k.replace("_", " ")}</label>
                <input
                  className="form-control"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  required={k === "size"}
                />
              </div>
            </div>
          ))}
          <div className="col-12">
            <button className="btn bg-gradient-info mb-0" type="submit">{editing ? "Update" : "Save pack"}</button>{" "}
            {editing ? <button className="btn btn-outline-info mb-0" type="button" onClick={cancelEdit}>Cancel</button> : null}
          </div>
        </form>
        <div className="table-responsive mt-4">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Size</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Best for</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Typical use</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Tip</th>
                <th className="text-end text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Action</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((p) => (
                <tr key={p.id}>
                  <td className="ps-3"><p className="text-xs font-weight-bold mb-0">{p.size}</p></td>
                  <td><p className="text-xs mb-0">{p.best_for}</p></td>
                  <td><p className="text-xs mb-0">{p.typical_use}</p></td>
                  <td><p className="text-xs mb-0">{p.buying_tip}</p></td>
                  <td className="text-end pe-3">
                    <button className="btn btn-sm bg-gradient-info mb-0" type="button" onClick={() => startEdit(p)}>Edit</button>{" "}
                    <button className="btn btn-sm bg-gradient-danger mb-0" type="button" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan="5" className="ps-3 text-sm">No pack sizes yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pager {...pager} />
      </Card>
    </>
  );
}
