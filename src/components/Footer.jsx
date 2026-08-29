import { ADDRESS, EMAIL, GSTIN, NAV_LINKS, PHONE, PHONE_2 } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";

export function Footer() {
  const { catalog } = useStore();
  const footerProducts = catalog.filter((p) => p.active !== false).slice(0, 5);
  return (
    <footer>
      <div className="wrap foot-grid">
        <div>
          <a className="logo" href="#home">
            <img src="images/logo.png" alt="BHR TRADERS" />
          </a>
          <p style={{ marginTop: 12 }}>
            BHR TRADERS is a wholesale rice trading business offering high-quality rice at very competitive and affordable prices.
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            {NAV_LINKS.filter((l) => l.href !== "#shop").map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Our Products</h4>
          <ul>
            {footerProducts.map((p) => (
              <li key={p.id}>
                <a href={"#product/" + p.id}>{p.title}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Contact Us</h4>
          <div className="contact-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z" />
            </svg>
            <a href="tel:+919940338654">{PHONE}</a>
            <br />
            <a href="tel:+919940339654">{PHONE_2}</a>
          </div>
          <div className="contact-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 7 9-7" />
            </svg>
            <a href={"mailto:" + EMAIL}>{EMAIL}</a>
          </div>
          <div className="contact-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M2 12h20" />
            </svg>
            <a href="https://www.bhrtraders.com/">www.bhrtraders.com</a>
          </div>
          <div className="contact-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.3" />
            </svg>
            {ADDRESS}
          </div>
          <div className="contact-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
            GSTIN {GSTIN}
          </div>
        </div>
      </div>
      <div className="foot-bottom">
        <div className="wrap">
          <span>© 2026 BHR TRADERS. All Rights Reserved. GSTIN {GSTIN}</span>
          <span>
            Designed with <span className="heart">♥</span>{" "}
            <a
              className="foot-credit"
              href="https://udy8007.github.io/udyilangovan/index.html"
              target="_blank"
              rel="noreferrer"
            >
              udyilangovan
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
