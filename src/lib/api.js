const API = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
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
  downloadPriceList: () => downloadBlob("/api/price-list", "BHR-Price-List.pdf")
};
