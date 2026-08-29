import { useEffect, useState } from "react";
import { ABOUT_FEATS, ADDRESS, EMAIL, GSTIN, MAP_QUERY, PHONE, PHONE_2 } from "../data/site.js";
import { ArrowIcon, SectionHead } from "../components/Icons.jsx";
import { useStore } from "../context/StoreContext.jsx";

export function About() {
  return (
    <section className="section" id="about">
      <div className="wrap about-grid">
        <img className="about-photo" src="images/about-banner.jpg" alt="BHR Traders premium quality rice wholesale supply" />
        <div className="about-copy">
          <div className="kicker">About BHR Traders</div>
          <h2>Your Trusted Wholesale Rice Partner</h2>
          <p>
            We are committed to delivering the best quality rice with consistent supply, competitive pricing, and reliable service. Customer satisfaction and trust are the foundation of our business.
          </p>
          <ul className="about-feats">
            {ABOUT_FEATS.map((f) => (
              <li key={f}>
                <span className="about-check" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
          <a className="btn btn-green" href="#contact">
            Know More About Us
          </a>
        </div>
      </div>
    </section>
  );
}

export function CtaStats() {
  return (
    <>
      <section className="cta">
        <div className="wrap">
          <h2>
            Looking for the best quality rice at the best price? Partner with <span>BHR TRADERS</span> today!
          </h2>
          <a className="btn btn-gold" href="#products">
            Shop Now
            <ArrowIcon />
          </a>
        </div>
      </section>
      <section className="stats">
        <div className="wrap">
          <div className="stat"><strong>10+</strong><span>Years of Experience</span></div>
          <div className="stat"><strong>500+</strong><span>Happy Customers</span></div>
          <div className="stat"><strong>1000+</strong><span>Tons of Rice Delivered</span></div>
          <div className="stat"><strong>100%</strong><span>Customer Satisfaction</span></div>
        </div>
      </section>
    </>
  );
}

export function Shop() {
  return (
    <section className="shop-show" id="shop">
      <div className="wrap">
        <SectionHead kicker="Our Shop" title="BHR Rice Mandi, Chennai" />
        <div className="shop-mosaic">
          <figure className="shop-tile wide">
            <img src="images/shop-exterior.jpg" alt="BHR Rice Mandi shop exterior at dusk" />
            <figcaption>
              Shop exterior<span>Anna Nagar West, Chennai</span>
            </figcaption>
          </figure>
          <figure className="shop-tile">
            <img src="images/shop-storefront.jpg" alt="BHR rice shop glass storefront and product shelves" />
            <figcaption>
              Storefront<span>Wholesale and retail rice packs</span>
            </figcaption>
          </figure>
          <figure className="shop-tile">
            <img src="images/shop-interior.jpg" alt="Inside BHR Rice Mandi with sample trays and rice bags" />
            <figcaption>
              Inside the mandi<span>Samples, bulk bags, and service counter</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function Location() {
  return (
    <section className="location" id="contact">
      <div className="wrap">
        <SectionHead
          kicker="Our Location"
          title="Find BHR TRADERS"
          text="We are located in the heart of Chennai, Tamil Nadu. Visit us for the best quality rice and reliable wholesale service."
        />
        <div className="loc-map">
          <iframe
            title="BHR TRADERS location in Anna Nagar West, Chennai"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={"https://maps.google.com/maps?q=" + MAP_QUERY + "&z=15&output=embed"}
          />
          <aside className="loc-card">
            <div className="loc-card-head">
              <svg className="pin" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
              <h3>BHR TRADERS</h3>
              <em>Premium Quality Rice Wholesaler</em>
            </div>
            <div className="loc-row">
              <span className="loc-ico" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
                </svg>
              </span>
              <span>{ADDRESS}</span>
            </div>
            <div className="loc-row">
              <span className="loc-ico" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z" />
                </svg>
              </span>
              <span>
                <a href="tel:+919940338654">{PHONE}</a>
                <br />
                <a href="tel:+919940339654">{PHONE_2}</a>
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-ico" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 7 9-7" />
                </svg>
              </span>
              <a href={"mailto:" + EMAIL}>{EMAIL}</a>
            </div>
            <div className="loc-row">
              <span className="loc-ico" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <span>
                Monday to Saturday 9:00 AM – 7:00 PM
                <br />
                Sunday Closed
              </span>
            </div>
            <div className="loc-row">
              <span className="loc-ico" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              </span>
              <span>GSTIN {GSTIN}</span>
            </div>
            <a
              className="btn btn-directions"
              href={"https://www.google.com/maps/dir/?api=1&destination=" + MAP_QUERY}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Directions
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}

export function Enquiry() {
  const { saveEnquiry, enquiryDraft, setEnquiryDraft, catalog } = useStore();
  const [qty, setQty] = useState("");
  const [message, setMessage] = useState("");
  const [product, setProduct] = useState("");
  const [otherProduct, setOtherProduct] = useState("");
  const otherSelected = product === "others";

  useEffect(() => {
    if (enquiryDraft.qty) setQty(enquiryDraft.qty);
    if (enquiryDraft.message) setMessage(enquiryDraft.message);
  }, [enquiryDraft]);

  return (
    <section className="enquiry" id="enquiry">
      <div className="wrap">
        <SectionHead
          kicker="Enquiry"
          title="Send us an enquiry"
          text="Share your requirement for wholesale rice. We will get back to you with availability and pricing."
        />
        <form
          className="enq-card"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
              let chosen = product;
              if (product === "mixed") chosen = "Mixed varieties";
              if (product === "others") chosen = "Others — " + otherProduct.trim();
              await saveEnquiry({
                name: String(fd.get("name")),
                phone: String(fd.get("phone")),
                email: String(fd.get("email")),
                company: String(fd.get("company") || ""),
                product: chosen,
                qty: String(fd.get("qty")),
                message: String(fd.get("message"))
              });
              e.target.reset();
              setQty("");
              setMessage("");
              setProduct("");
              setOtherProduct("");
              setEnquiryDraft({ qty: "", message: "" });
            } catch {
              /* toast already shown */
            }
          }}
        >
          <div className="enq-grid">
            <label>Full name<input name="name" required placeholder="Your name" /></label>
            <label>Phone<input name="phone" required placeholder="+91" /></label>
            <label>Email<input name="email" type="email" required placeholder="you@email.com" /></label>
            <label>Company / shop<input name="company" placeholder="Optional" /></label>
            <label>
              Product
              <select required value={product} onChange={(e) => setProduct(e.target.value)}>
                <option value="">Select a variety</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.title + " (" + p.cat + ")"}>{p.title} — {p.cat}</option>
                ))}
                <option value="mixed">Mixed varieties</option>
                <option value="others">Others</option>
              </select>
            </label>
            <label>
              Quantity needed
              <input name="qty" required placeholder="e.g. 1 ton / 50 bags" value={qty} onChange={(e) => setQty(e.target.value)} />
            </label>
            {otherSelected ? (
              <label className="full">
                Specify other product
                <input
                  required
                  value={otherProduct}
                  onChange={(e) => setOtherProduct(e.target.value)}
                  placeholder="Type the rice variety or requirement"
                />
              </label>
            ) : null}
            <label className="full">
              Message
              <textarea
                name="message"
                required
                placeholder="Tell us about packing, delivery location, and timeline"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
          </div>
          <button className="btn btn-green" type="submit" style={{ marginTop: 4 }}>
            Submit enquiry
          </button>
        </form>
      </div>
    </section>
  );
}
