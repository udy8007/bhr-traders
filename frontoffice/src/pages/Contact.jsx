import { useState } from "react";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { BusinessInfoCard } from "../components/BusinessInfoCard.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { MAP_QUERY } from "../data/site.js";

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
      <section className="section-pad contact-page">
        <BusinessInfoCard />

        <div className="contact-map">
          <iframe
            title="BHR TRADERS location in Anna Nagar West, Chennai"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={"https://maps.google.com/maps?q=" + MAP_QUERY + "&z=15&output=embed"}
          />
        </div>
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
