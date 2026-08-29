import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { logCheckoutComplete } from "../lib/visits.js";

const StoreContext = createContext(null);
const CART_KEY = "bhr-cart";

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
  const [packs, setPacks] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackPrefill, setTrackPrefill] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [pdpId, setPdpId] = useState(null);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [enquiryDraft, setEnquiryDraft] = useState({ qty: "", message: "" });

  const ping = useCallback((msg) => {
    setToast(msg);
  }, []);

  const productMap = useMemo(
    () => Object.fromEntries(catalog.map((p) => [p.id, p])),
    [catalog]
  );

  useEffect(() => {
    let live = true;
    setCatalogStatus("loading");
    Promise.all([api.products(), api.categories().catch(() => ({ categories: [] })), api.packs().catch(() => ({ packs: [] }))])
      .then(([prodRes, catRes, packRes]) => {
        if (!live) return;
        setCatalog(prodRes.products || []);
        const cats = (catRes.categories || [])
          .map((c) => ({
            id: String(c.slug || c.id || "").toLowerCase(),
            label: c.name || c.label || c.id
          }))
          .filter((c) => c.id);
        setCategories([{ id: "all", label: "All Varieties" }, ...cats]);
        setPacks(packRes.packs || []);
        setCatalogStatus("ready");
      })
      .catch((err) => {
        if (!live) return;
        setCatalog([]);
        setCatalogStatus("error");
        ping(err.message || "Could not load products from the database.");
      });
    return () => {
      live = false;
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

  useEffect(() => {
    document.body.style.overflow = pdpId || checkoutOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [pdpId, checkoutOpen]);

  const closePdp = useCallback(() => {
    setPdpId(null);
    const hash = location.hash.replace(/^#/, "");
    if (hash.startsWith("product/") && history.replaceState) {
      history.replaceState(null, "", "#products");
    }
  }, []);

  const openPdp = useCallback((id) => {
    setPdpId(id);
  }, []);

  useEffect(() => {
    const route = () => {
      const hash = location.hash.replace(/^#/, "");
      if (hash.startsWith("product/")) openPdp(hash.slice(8));
    };
    route();
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, [openPdp]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        closePdp();
        setCartOpen(false);
        setTrackOpen(false);
        setCheckoutOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closePdp]);

  const addToCart = useCallback((item) => {
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
  }, [ping]);

  const changeQty = useCallback((id, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    );
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const cartSum = useMemo(() => cart.reduce((n, i) => n + i.price * i.qty, 0), [cart]);

  const openCheckout = useCallback(() => {
    if (!cart.length) {
      ping("Your cart is empty.");
      return;
    }
    setCartOpen(false);
    setCheckoutStep(1);
    setCheckoutOpen(true);
  }, [cart.length, ping]);

  const downloadInvoice = useCallback(async (id) => {
    const oid = id || orderId;
    if (!oid) return;
    try {
      await api.downloadInvoice(oid);
    } catch (err) {
      ping(err.message || "Invoice download failed.");
    }
  }, [orderId, ping]);

  const placeOrder = useCallback(async (opts = {}) => {
    if (!cart.length || !checkoutInfo) {
      ping("Your cart is empty.");
      return false;
    }
    const pay = typeof opts === "string" ? opts : opts.pay || "upi";
    const paymentProof = typeof opts === "string" ? "" : opts.paymentProof || "";
    try {
      const res = await api.createOrder({
        ...checkoutInfo,
        pay,
        paymentProof,
        items: cart.map((i) => ({
          id: i.productId || i.id,
          title: i.packLabel ? i.title + " — " + i.packLabel : i.title,
          qty: i.qty,
          price: i.price
        }))
      });
      setCart([]);
      setOrderId(res.order.id);
      setOrderStatus(res.order.status || "");
      setCheckoutStep(3);
      logCheckoutComplete();
      ping("Order placed. Invoice downloading…");
      try {
        await api.downloadInvoice(res.order.id);
      } catch (err) {
        ping(err.message || "Order placed. Invoice download failed — use the button.");
      }
      return true;
    } catch (err) {
      ping(err.message || "Could not place order.");
      return false;
    }
  }, [cart, checkoutInfo, ping]);

  const saveEnquiry = useCallback(async (data) => {
    try {
      await api.createEnquiry(data);
      ping("Enquiry sent. We will contact you shortly.");
    } catch (err) {
      ping(err.message || "Could not send enquiry.");
      throw err;
    }
  }, [ping]);

  const trackOrder = useCallback(async (id) => {
    const res = await api.trackOrder(id);
    return res.order;
  }, []);

  const pickPack = useCallback((qty) => {
    setEnquiryDraft({
      qty,
      message: "Pack size: " + qty + ". Please share current wholesale rate and availability."
    });
    location.hash = "#enquiry";
    ping("Pack size added to enquiry.");
  }, [ping]);

  const value = {
    catalog,
    categories,
    packs,
    catalogStatus,
    productMap,
    cart,
    cartCount,
    cartSum,
    cartOpen,
    setCartOpen,
    trackOpen,
    setTrackOpen,
    trackPrefill,
    setTrackPrefill,
    checkoutOpen,
    setCheckoutOpen,
    checkoutStep,
    setCheckoutStep,
    checkoutInfo,
    setCheckoutInfo,
    orderId,
    orderStatus,
    pdpId,
    openPdp,
    closePdp,
    toast,
    ping,
    menuOpen,
    setMenuOpen,
    enquiryDraft,
    setEnquiryDraft,
    addToCart,
    changeQty,
    removeItem,
    openCheckout,
    placeOrder,
    downloadInvoice,
    saveEnquiry,
    trackOrder,
    pickPack
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
