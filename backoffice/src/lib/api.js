import { hideLoader, showLoader } from "./loader.js";

const KEY = "bhr-admin-token";

export function getToken() {
  return localStorage.getItem(KEY) || "";
}

export function setSession(token, user) {
  localStorage.setItem(KEY, token);
  localStorage.setItem("bhr-admin-user", JSON.stringify(user || {}));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("bhr-admin-user");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("bhr-admin-user") || "{}");
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const quiet = options.quiet;
  const rest = { ...options };
  delete rest.quiet;
  if (!quiet) showLoader();
  try {
    const headers = { "Content-Type": "application/json", ...(rest.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    const res = await fetch(path, { ...rest, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearSession();
      if (!path.includes("/auth/login")) window.location.hash = "#/login";
    }
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } finally {
    if (!quiet) hideLoader();
  }
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/api/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    request("/api/auth/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  stats: (quiet) => request("/api/admin/stats", { quiet }),
  products: () => request("/api/products"),
  product: (id) => request("/api/products/" + encodeURIComponent(id)),
  createProduct: (body) => request("/api/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => request("/api/products/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(body) }),
  setProductActive: (id, active) => request("/api/products/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteProduct: (id) => request("/api/products/" + encodeURIComponent(id), { method: "DELETE" }),
  categories: () => request("/api/categories"),
  saveCategory: (body) => request("/api/categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id, body) => request("/api/categories/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(body) }),
  deleteCategory: (id) => request("/api/categories/" + encodeURIComponent(id), { method: "DELETE" }),
  packs: () => request("/api/packs"),
  savePack: (body) => request("/api/packs", { method: "POST", body: JSON.stringify(body) }),
  updatePack: (id, body) => request("/api/packs/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(body) }),
  deletePack: (id) => request("/api/packs/" + encodeURIComponent(id), { method: "DELETE" }),
  orders: () => request("/api/admin/orders"),
  order: (id) => request("/api/admin/orders/" + encodeURIComponent(id)),
  updateOrder: (id, status, extra = {}) =>
    request("/api/admin/orders/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ status, ...extra }) }),
  deleteOrder: (id) => request("/api/admin/orders/" + encodeURIComponent(id), { method: "DELETE" }),
  downloadOrderInvoice: async (id) => {
    showLoader();
    try {
      const headers = {};
      const token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
      const res = await fetch("/api/orders/" + encodeURIComponent(id) + "/invoice", { headers });
      if (res.status === 401) {
        clearSession();
        window.location.hash = "#/login";
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invoice download failed");
      }
      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="([^"]+)"/);
      const name = match ? match[1] : "BHR-Invoice-" + id + ".pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      hideLoader();
    }
  },
  enquiries: () => request("/api/admin/enquiries"),
  updateEnquiry: (id, status) => request("/api/admin/enquiries/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ status }) }),
  resetEnquiries: (opts = {}) => request("/api/admin/enquiries", { method: "DELETE", quiet: opts.quiet }),
  customers: () => request("/api/admin/customers"),
  logs: (kind, opts = {}) => {
    const q = new URLSearchParams({
      kind: kind || "all",
      page: String(opts.page || 1),
      pageSize: String(opts.pageSize || 10)
    });
    if (opts.entity) q.set("entity", opts.entity);
    if (opts.level) q.set("level", opts.level);
    return request("/api/admin/logs?" + q.toString(), { quiet: opts.quiet });
  },
  notificationConfig: () => request("/api/admin/notifications/config"),
  saveNotificationConfig: (body) => request("/api/admin/notifications/config", { method: "PUT", body: JSON.stringify(body) }),
  notificationLogs: (opts = {}) => {
    const q = new URLSearchParams({
      page: String(opts.page || 1),
      pageSize: String(opts.pageSize || 10),
      channel: opts.channel || "all"
    });
    return request("/api/admin/notifications/logs?" + q.toString(), { quiet: opts.quiet });
  },
  inbox: (opts = {}) => request("/api/admin/notifications/inbox", { quiet: opts.quiet }),
  ingestNtfy: (msg, opts = {}) => request("/api/admin/notifications/inbox", { method: "POST", body: JSON.stringify(msg || {}), quiet: opts.quiet }),
  readInbox: (id, opts = {}) => request("/api/admin/notifications/inbox/" + encodeURIComponent(id), { method: "PATCH", quiet: opts.quiet }),
  readAllInbox: (opts = {}) => request("/api/admin/notifications/inbox", { method: "PATCH", quiet: opts.quiet }),
  clearInbox: (opts = {}) => request("/api/admin/notifications/inbox", { method: "DELETE", quiet: opts.quiet }),
  resetNotificationLogs: (opts = {}) => request("/api/admin/notifications/logs", { method: "DELETE", quiet: opts.quiet }),
  reportBug: (body) => request("/api/admin/bugs", { method: "POST", body: JSON.stringify(body) }),
  reviewsAdmin: () => request("/api/admin/reviews"),
  deleteReview: (id) => request("/api/admin/reviews/" + encodeURIComponent(id), { method: "DELETE" }),
  reportSchedule: () => request("/api/admin/reports/schedule"),
  saveReportSchedule: (body) => request("/api/admin/reports/schedule", { method: "PUT", body: JSON.stringify(body) }),
  sendReportNow: (body) => request("/api/admin/reports/schedule", { method: "POST", body: JSON.stringify(body || {}) }),
  backupSchedule: () => request("/api/admin/backup"),
  saveBackupSchedule: (body) => request("/api/admin/backup", { method: "PUT", body: JSON.stringify(body) }),
  sendBackupNow: (body) => request("/api/admin/backup", { method: "POST", body: JSON.stringify(body || {}) }),
  downloadReportPdf: async (kind, category) => {
    showLoader();
    try {
      const q = new URLSearchParams({ kind: kind || "overall" });
      if (category) q.set("category", category);
      const headers = {};
      const token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
      const res = await fetch("/api/admin/reports/pdf?" + q.toString(), { headers });
      if (res.status === 401) {
        clearSession();
        window.location.hash = "#/login";
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="([^"]+)"/);
      const name = match ? match[1] : "BHR-report.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      hideLoader();
    }
  }
};
