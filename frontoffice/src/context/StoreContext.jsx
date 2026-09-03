import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { logCheckoutComplete } from "../lib/visits.js";

const StoreContext = createContext(null);
const CART_KEY = "bhr-mobile-cart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function StoreProvider({ children }) {
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([{ id: "all", label: "All Varieties" }]);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [cart, setCart] = useState(loadCart);
  const [toast, setToast] = useState("");

  const ping = useCallback((msg) => setToast(msg), []);

  const productMap = useMemo(
    () => Object.fromEntries(catalog.map((p) => [p.id, p])),
    [catalog]
  );

  useEffect(() => {
    let live = true;
    let retryTimer;

    async function load(attempt = 0) {
      setCatalogStatus("loading");
      try {
        const [prodRes, catRes] = await Promise.all([
          api.products(),
          api.categories().catch(() => ({ categories: [] }))
        ]);
        if (!live) return;
        setCatalog(prodRes.products || []);
        const cats = (catRes.categories || [])
          .map((c) => ({
            id: String(c.slug || c.id || "").toLowerCase(),
            label: c.name || c.label || c.id
          }))
          .filter((c) => c.id);
        setCategories([{ id: "all", label: "All Varieties" }, ...cats]);
        setCatalogStatus("ready");
      } catch (err) {
        if (!live) return;
        if (attempt < 4) {
          retryTimer = setTimeout(() => load(attempt + 1), 1500 * (attempt + 1));
          return;
        }
        setCatalog([]);
        setCatalogStatus("error");
        ping(err.message || "Could not load products.");
      }
    }

    load();

    return () => {
      live = false;
      clearTimeout(retryTimer);
    };
  }, [ping]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const addToCart = useCallback(
    (item) => {
      setCart((prev) => {
        const found = prev.find((i) => i.id === item.id);
        if (found) {
          return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + (item.qty || 1) } : i));
        }
        return [
          ...prev,
          {
            id: item.id,
            productId: item.productId || item.id,
            packId: item.packId || "",
            packLabel: item.packLabel || "",
            title: item.title,
            price: item.price,
            img: item.img,
            qty: item.qty || 1
          }
        ];
      });
      ping(item.title + " added to cart");
    },
    [ping]
  );

  const changeQty = useCallback((id, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    );
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const cartSum = useMemo(() => cart.reduce((n, i) => n + i.price * i.qty, 0), [cart]);

  const placeOrder = useCallback(
    async (checkoutInfo, opts = {}) => {
      if (!cart.length || !checkoutInfo) {
        ping("Your cart is empty.");
        return null;
      }
      const pay = opts.pay || "upi";
      const paymentProof = opts.paymentProof || "";
      const skipPayment = Boolean(opts.skipPayment);
      try {
        const res = await api.createOrder({
          ...checkoutInfo,
          pay,
          paymentProof,
          skipPayment,
          items: cart.map((i) => ({
            id: i.productId || i.id,
            title: i.packLabel ? i.title + " — " + i.packLabel : i.title,
            qty: i.qty,
            price: i.price
          }))
        });
        setCart([]);
        logCheckoutComplete();
        ping(skipPayment ? "Order saved as pending." : "Order placed successfully.");
        try {
          await api.downloadInvoice(res.order.id);
        } catch {
          /* invoice optional */
        }
        return res.order;
      } catch (err) {
        ping(err.message || "Could not place order.");
        return null;
      }
    },
    [cart, ping]
  );

  const saveEnquiry = useCallback(
    async (data) => {
      try {
        await api.createEnquiry(data);
        ping("Enquiry sent. We will contact you shortly.");
        return true;
      } catch (err) {
        ping(err.message || "Could not send enquiry.");
        return false;
      }
    },
    [ping]
  );

  const trackOrder = useCallback(async (id) => {
    const res = await api.trackOrder(id);
    return res.order;
  }, []);

  const value = {
    catalog,
    categories,
    catalogStatus,
    productMap,
    cart,
    cartCount,
    cartSum,
    toast,
    ping,
    addToCart,
    changeQty,
    removeItem,
    clearCart,
    placeOrder,
    saveEnquiry,
    trackOrder
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
