import { useEffect, useState } from "react";

import { ORDER_STATUSES, statusTone } from "../lib/orderStatus.js";

export function Icon({ name }) {
  return <i className="material-symbols-rounded">{name}</i>;
}

export function usePager(rows, pageSize = 10) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  return { page: current, setPage, pages, pageSize, total, start, slice };
}

function pageWindow(page, pages, max = 7) {
  if (pages <= max) {
    const nums = [];
    for (let i = 1; i <= pages; i++) nums.push(i);
    return nums;
  }
  const half = Math.floor(max / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(pages, start + max - 1);
  start = Math.max(1, end - max + 1);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return nums;
}

export function Pager({ page, setPage, pages, pageSize, total, start }) {
  if (!total) return null;
  const from = start + 1;
  const to = Math.min(start + pageSize, total);
  const nums = pageWindow(page, pages);

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between px-3 py-3">
      <p className="text-xs text-secondary mb-0">
        Showing {from} to {to} of {total} entries
      </p>
      <ul className="pagination pagination-primary mb-0">
        <li className={"page-item" + (page <= 1 ? " disabled" : "")}>
          <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}>
            Prev
          </a>
        </li>
        {nums[0] > 1 ? (
          <li className="page-item disabled"><span className="page-link">…</span></li>
        ) : null}
        {nums.map((n) => (
          <li key={n} className={"page-item" + (n === page ? " active" : "")}>
            <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); setPage(n); }}>
              {n}
            </a>
          </li>
        ))}
        {nums[nums.length - 1] < pages ? (
          <li className="page-item disabled"><span className="page-link">…</span></li>
        ) : null}
        <li className={"page-item" + (page >= pages ? " disabled" : "")}>
          <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); if (page < pages) setPage(page + 1); }}>
            Next
          </a>
        </li>
      </ul>
    </div>
  );
}

export function PageHead({ title, small, action }) {
  return (
    <div className="page-head mb-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h3 className="mb-0 h4 font-weight-bolder bhr-page-title">{title}</h3>
          {small ? <p className="mb-0 text-sm bhr-page-sub">{small}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function StatusSelect({ value, onChange, options: statusOptions }) {
  const list = statusOptions || ORDER_STATUSES;
  const options = list.includes(value) || !value ? list : [value, ...list];
  return (
    <select
      className="form-control form-control-sm"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

export function StatusBadge({ status }) {
  return <span className={"badge badge-sm bg-gradient-" + statusTone(status)}>{status || "—"}</span>;
}

export function Card({ title, action, children, bodyClass = "p-3" }) {
  return (
    <div className="card">
      {(title || action) ? (
        <div className="card-header pb-0 d-flex justify-content-between align-items-center">
          {title ? <h6 className="mb-0 bhr-card-title">{title}</h6> : <span />}
          {action}
        </div>
      ) : null}
      <div className={"card-body " + bodyClass}>{children}</div>
    </div>
  );
}
