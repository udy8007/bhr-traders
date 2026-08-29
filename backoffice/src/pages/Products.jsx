import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager, usePager } from "../components/Template.jsx";

export function Products() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");

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
    <>
      <PageHead title="Products" small="Catalog items shown on the storefront." />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <Card
        title="Product list"
        action={<Link className="btn bg-gradient-info btn-sm mb-0" to="/master/products/new">Add product</Link>}
      >
        <div className="d-flex flex-wrap gap-2 mb-3">
          {[
            { id: "all", label: "All (" + rows.length + ")" },
            { id: "active", label: "Active (" + rows.filter((p) => p.active !== false).length + ")" },
            { id: "inactive", label: "Inactive (" + rows.filter((p) => p.active === false).length + ")" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={"btn btn-sm mb-0 " + (tab === t.id ? "bg-gradient-info" : "btn-outline-info")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={"input-group input-group-outline mb-3" + (q ? " is-filled" : "")}>
          <label className="form-label">Search products</label>
          <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="table-responsive">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Product</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Category</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Price</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                <th className="text-end text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((p) => {
                const on = p.active !== false;
                return (
                  <tr key={p.id} className={on ? "" : "opacity-6"}>
                    <td className="ps-3">
                      <h6 className="mb-0 text-sm">{p.title}</h6>
                      <p className="text-xs text-secondary mb-0">{p.short}</p>
                    </td>
                    <td><p className="text-xs mb-0">{p.cat}</p></td>
                    <td><p className="text-xs mb-0">{p.priceLabel}</p></td>
                    <td>
                      <span className={"badge badge-sm bg-gradient-" + (on ? "success" : "secondary")}>{on ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="text-end pe-3">
                      <Link className="btn btn-sm bg-gradient-info mb-0" to={"/master/products/" + p.id}>Edit</Link>{" "}
                      <button className={"btn btn-sm mb-0 " + (on ? "bg-gradient-warning" : "bg-gradient-success")} type="button" onClick={() => toggle(p)}>
                        {on ? "Deactivate" : "Activate"}
                      </button>{" "}
                      <button className="btn btn-sm bg-gradient-danger mb-0" type="button" onClick={() => remove(p.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length ? (
                <tr>
                  <td colSpan="5" className="ps-3 text-sm">No products in this list. Use Add product.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pager {...pager} />
      </Card>
    </>
  );
}
