import { useState } from "react";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { ADDRESS, EMAIL, GSTIN, HOURS_SUNDAY, HOURS_WEEKDAY, MAP_QUERY, PHONE, PHONE_2 } from "../data/site.js";

export function Contact() {
  const { saveEnquiry } = useStore();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      return;
    }
    setBusy(true);
    const ok = await saveEnquiry(form);
    setBusy(false);
    if (ok) {
      setSent(true);
      setForm({ name: "", phone: "", message: "" });
    }
  }

  return (
    <MobileLayout title="Contact">
      <section className="contact-hero">
        <img src="/images/shop-exterior.jpg" alt="BHR Traders shop" />
      </section>

      <section className="section-pad contact-cards">
        <a href={"tel:" + PHONE.replace(/\s/g, "")} className="contact-card">
          <span className="contact-label">Call</span>
          <strong>{PHONE}</strong>
        </a>
        <a href={"tel:" + PHONE_2.replace(/\s/g, "")} className="contact-card">
          <span className="contact-label">Alternate</span>
          <strong>{PHONE_2}</strong>
        </a>
        <a href={"mailto:" + EMAIL} className="contact-card">
          <span className="contact-label">Email</span>
          <strong>{EMAIL}</strong>
        </a>
        <a
          href={"https://www.google.com/maps/search/?api=1&query=" + MAP_QUERY}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-card"
        >
          <span className="contact-label">Address</span>
          <strong>{ADDRESS}</strong>
        </a>
      </section>

      <section className="section-pad">
        <h2>Store hours</h2>
        <p>{HOURS_WEEKDAY}</p>
        <p>{HOURS_SUNDAY}</p>
        <p className="gst-note">GSTIN {GSTIN}</p>
      </section>

      <section className="section-pad">
        <h2>Send an enquiry</h2>
        {sent ? (
          <div className="success-banner">Thank you — we will contact you shortly.</div>
        ) : (
          <form className="checkout-form" onSubmit={submit}>
            <label>
              Name *
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </label>
            <label>
              Phone *
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </label>
            <label>
              Message
              <textarea rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Pack size, variety, quantity…" />
            </label>
            <button type="submit" className="btn btn-gold btn-block" disabled={busy}>
              {busy ? "Sending…" : "Send enquiry"}
            </button>
          </form>
        )}
      </section>
    </MobileLayout>
  );
}
