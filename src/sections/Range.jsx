import { PHONE } from "../data/site.js";

const RANGE_IMG = "images/product-range-banner.jpg";
const RANGE_MOBILE = "images/product-range-banner-mobile.jpg";

const USPS = [
  ["images/icon-premium-rice.png", "Premium Quality"],
  ["images/icon-best-quality.png", "Naturally Aged"],
  ["images/icon-wholesale-supply.png", "Hygienically Packed"],
  ["images/icon-timely-delivery.png", "Timely Delivery"]
];

const REASONS = [
  "100% Natural & Pure",
  "Best Quality Assured",
  "No Artificial Polish",
  "Bulk Supply Available",
  "Pan India Delivery",
  "Trusted by 500+ Businesses"
];

export function RangeShow() {
  const wa = "https://wa.me/919940338654";

  return (
    <section className="range-show" id="range">
      <div className="wrap range-wrap range-desktop">
        <div className="range-hero">
          <div className="range-copy">
            <p className="kicker">BHR Traders · Agri Orga Farm</p>
            <h2>
              Premium quality rice
              <span> for every need</span>
            </h2>
            <p className="range-lead">
              From our fields to your table — purity, taste and trust in every grain.
            </p>
            <div className="range-usps">
              {USPS.map(([img, label]) => (
                <div className="range-usp" key={label}>
                  <span className="range-usp-ico">
                    <img src={img} alt="" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="range-bar">
          <span className="range-flourish" aria-hidden="true" />
          <h3>Our Product Range</h3>
          <span className="range-flourish" aria-hidden="true" />
        </div>

        <div className="range-stage">
          <div className="range-scroll">
            <img src={RANGE_IMG} alt="BHR Traders product range — branded rice packs" />
          </div>
          <aside className="range-why">
            <h3>Why choose BHR Traders?</h3>
            <ul>
              {REASONS.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <a className="range-wa" href={wa} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.33 4.94L2 22l5.4-1.42a10 10 0 0 0 4.64 1.18h.04c5.46 0 9.89-4.4 9.89-9.83C21.97 6.4 17.5 2 12.04 2zm5.74 14.12c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.89-1.25-4.77-4.16-4.92-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.24-.28.54-.35.72-.35h.52c.17 0 .4-.06.62.47.24.56.8 1.94.87 2.08.07.14.12.3.02.49-.1.2-.14.32-.28.5-.14.17-.3.38-.42.51-.14.14-.28.3-.12.57.17.28.74 1.22 1.6 1.98 1.1.97 2.03 1.27 2.32 1.41.28.14.45.12.62-.07.17-.2.72-.84.91-1.13.2-.28.4-.24.66-.14.28.1 1.75.83 2.05.98.3.14.5.22.57.34.08.12.08.7-.16 1.38z" />
              </svg>
              Bulk orders &amp; enquiries
              <strong>{PHONE}</strong>
            </a>
            <a className="range-shop" href="#products">
              Shop the full catalogue
            </a>
          </aside>
        </div>
      </div>

      <div className="range-mobile">
        <img src={RANGE_MOBILE} alt="BHR Traders product range — premium rice packs, benefits and contact" />
      </div>
    </section>
  );
}
