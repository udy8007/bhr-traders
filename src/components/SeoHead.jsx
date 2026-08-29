import { useEffect } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function SeoHead() {
  const { pdpId, productMap } = useStore();

  useEffect(() => {
    const product = pdpId ? productMap[pdpId] : null;
    const title = product
      ? product.title + " | Wholesale Rice | " + SITE_NAME
      : SITE_TITLE;
    const description = product
      ? (product.desc || product.short || SITE_DESCRIPTION).slice(0, 160)
      : SITE_DESCRIPTION;
    const image = product?.img
      ? (product.img.startsWith("http") ? product.img : SITE_URL + "/" + product.img.replace(/^\.\//, ""))
      : SITE_OG_IMAGE;
    const url = SITE_URL + "/";

    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setCanonical(url);

    if (product) {
      setJsonLd("bhr-product-jsonld", {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.desc || product.short || title,
        image,
        brand: { "@type": "Brand", name: SITE_NAME },
        category: product.cat || "Rice",
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: String(product.price || ""),
          availability: "https://schema.org/InStock",
          url,
          seller: { "@type": "Organization", name: SITE_NAME }
        }
      });
    } else {
      document.getElementById("bhr-product-jsonld")?.remove();
    }
  }, [pdpId, productMap]);

  return null;
}
