import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager, usePager } from "../components/Template.jsx";

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function StarBar({ dist, total }) {
  const max = Math.max(1, total);
  return (
    <div className="rev-dist">
      {dist.map((d) => (
        <div className="rev-dist-row" key={d.star}>
          <span>{d.star}★</span>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eef0f3" />
            <rect width={Math.max(d.count ? 4 : 0, (d.count / max) * 100)} height="8" rx="4" fill="#fb8c00" />
          </svg>
          <strong>{d.count}</strong>
        </div>
      ))}
    </div>
  );
}

export function CustomerReviews() {
  const [params] = useSearchParams();
  const jumpId = String(params.get("id") || "").trim();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  function load() {
    api.reviewsAdmin().then(setData).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  useEffect(() => {
    if (!jumpId) return;
    const el = document.getElementById("review-" + jumpId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [jumpId, data]);

  const rows = useMemo(() => {
    let list = data?.reviews || [];
    if (filter !== "all") list = list.filter((r) => String(r.rating) === String(filter));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((r) => [r.orderId, r.comment, r.productTitle, r.name].join(" ").toLowerCase().includes(s));
    }
    return list;
  }, [data, filter, q]);

  const pager = usePager(rows, 8);
  const stats = data?.stats || { count: 0, average: 0, fiveStar: 0, products: 0 };

  async function remove(id) {
    if (!confirm("Remove this review?")) return;
    try {
      await api.deleteReview(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <PageHead title="Customer reviews" small="Star ratings and comments from the shop product pages." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="rev-kpi">
            <p className="text-xs text-secondary mb-1">Average rating</p>
            <h3 className="mb-0">{stats.average || "—"}</h3>
            <p className="rev-stars mb-0">{"★".repeat(Math.round(stats.average || 0))}{"☆".repeat(5 - Math.round(stats.average || 0))}</p>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="rev-kpi">
            <p className="text-xs text-secondary mb-1">Total reviews</p>
            <h3 className="mb-0">{stats.count}</h3>
            <p className="text-xs text-secondary mb-0">From the storefront</p>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="rev-kpi">
            <p className="text-xs text-secondary mb-1">Five-star</p>
            <h3 className="mb-0">{stats.fiveStar}</h3>
            <p className="text-xs text-secondary mb-0">Top scores</p>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="rev-kpi">
            <p className="text-xs text-secondary mb-1">Products reviewed</p>
            <h3 className="mb-0">{stats.products}</h3>
            <p className="text-xs text-secondary mb-0">With at least one review</p>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="Rating mix">
            <StarBar dist={data?.dist || []} total={stats.count} />
          </Card>
        </div>
        <div className="col-lg-8 mb-4">
          <Card title="Top reviewed products">
            <div className="row">
              {(data?.products || []).slice(0, 6).map((p) => (
                <div className="col-md-6 mb-3" key={p.productId}>
                  <div className="rev-prod">
                    <p className="text-sm font-weight-bold mb-1">{p.title}</p>
                    <p className="rev-stars mb-1">{"★".repeat(Math.round(p.average))}{"☆".repeat(5 - Math.round(p.average))}</p>
                    <p className="text-xs text-secondary mb-0">{p.average} avg · {p.count} reviews</p>
                  </div>
                </div>
              ))}
              {!data?.products?.length ? <p className="text-sm text-secondary px-3">Reviews appear after customers submit them on a product page.</p> : null}
            </div>
          </Card>
        </div>
      </div>
      <Card title="All reviews">
        <div className="d-flex flex-wrap gap-2 mb-3">
          {["all", "5", "4", "3", "2", "1"].map((f) => (
            <button
              key={f}
              type="button"
              className={"btn btn-sm mb-0 " + (filter === f ? "bg-gradient-warning" : "btn-outline-warning")}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f + "★"}
            </button>
          ))}
        </div>
        <div className={"input-group input-group-outline mb-3" + (q ? " is-filled" : "")}>
          <label className="form-label">Search order id, product, comment</label>
          <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="row">
          {pager.slice.map((r) => (
            <div className="col-md-6 mb-3" key={r.id} id={"review-" + r.id}>
              <div className="rev-card" style={jumpId && r.id === jumpId ? { outline: "2px solid #fb8c00" } : undefined}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="rev-stars mb-1">{r.stars}</p>
                    <p className="text-sm font-weight-bold mb-0">{r.orderId || "Order"}</p>
                    <p className="text-xs text-secondary mb-2">{r.productTitle || r.productId}</p>
                  </div>
                  <button type="button" className="btn btn-link text-danger text-xs p-0 mb-0" onClick={() => remove(r.id)}>Remove</button>
                </div>
                <p className="text-sm mb-2">{r.comment}</p>
                <p className="text-xs text-secondary mb-0">{when(r.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
        {!pager.slice.length ? <p className="text-sm text-secondary mb-0">No customer reviews yet.</p> : null}
        <Pager {...pager} />
      </Card>
    </>
  );
}
