const API = import.meta.env.VITE_API_URL || "";

import { loadToken } from "./customerSession.js";

let customerToken = loadToken();

export function setCustomerToken(token) {
  customerToken = token || "";
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (customerToken) headers.Authorization = "Bearer " + customerToken;
  const res = await fetch(API + path, { ...options, headers });
  let data = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(res.status === 404 ? "API not found. Is the server running on port 3001?" : "Request failed (" + res.status + ")");
  }
  if (!res.ok) {
    const err = new Error(data.error || "Request failed (" + res.status + ")");
    err.status = res.status;
    if (data.field) err.field = data.field;
    if (data.code) err.code = data.code;
    if (data.attemptsRemaining != null) err.attemptsRemaining = data.attemptsRemaining;
    throw err;
  }
  return data;
}

async function downloadBlob(path, fallback) {
  const res = await fetch((API || "") + path);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Download failed");
  }
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition") || "";
  const match = disp.match(/filename="([^"]+)"/);
  const name = match ? match[1] : fallback;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  products: () => request("/api/products"),
  categories: () => request("/api/categories"),
  packs: () => request("/api/packs"),
  product: (id) => request("/api/products/" + encodeURIComponent(id)),
  createEnquiry: (body) => request("/api/enquiries", { method: "POST", body: JSON.stringify(body) }),
  createOrder: (body) => request("/api/orders", { method: "POST", body: JSON.stringify(body) }),
  trackOrder: (id) => request("/api/orders/" + encodeURIComponent(id)),
  downloadInvoice: (id) => downloadBlob("/api/orders/" + encodeURIComponent(id) + "/invoice", "BHR-Invoice.pdf"),
  reviews: (productId) => request("/api/reviews" + (productId ? "?product_id=" + encodeURIComponent(productId) : "")),
  createReview: (body) => request("/api/reviews", { method: "POST", body: JSON.stringify(body) }),
  downloadPriceList: () => downloadBlob("/api/price-list", "BHR-Price-List.pdf"),
  registerCustomer: (body) => request("/api/customer/register", { method: "POST", body: JSON.stringify(body) }),
  loginCustomer: (body) => request("/api/customer/login", { method: "POST", body: JSON.stringify(body) }),
  requestAccountUnlock: (body) => request("/api/customer/unlock-request", { method: "POST", body: JSON.stringify(body) }),
  changeCustomerPassword: (body) => request("/api/customer/password", { method: "POST", body: JSON.stringify(body) }),
  customerMe: () => request("/api/customer/me"),
  updateCustomer: (body) => request("/api/customer/me", { method: "PATCH", body: JSON.stringify(body) }),
  customerOrders: () => request("/api/customer/orders"),
  customerReview: (body) => request("/api/customer/orders", { method: "POST", body: JSON.stringify(body) })
};
