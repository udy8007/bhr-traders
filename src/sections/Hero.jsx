import { AppDownloadButton } from "../components/AppDownload.jsx";
import { ArrowIcon } from "../components/Icons.jsx";
import { PriceListButton } from "../components/PriceListButton.jsx";

export function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-visual" role="img" aria-label="BHR Traders rice products and storefront" />
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span>Wholesale rice traders</span>
          </p>
          <h1>
            <span className="hero-brand">BHR</span>
            <span className="hero-name">Traders</span>
          </h1>
          <p className="hero-tag">The leader in rice · Since 1970</p>
          <p className="hero-lead">
            Premium grains at honest wholesale prices — consistent supply, reliable service, and value you can count on.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-green" href="#products">
              Our Products
              <ArrowIcon />
            </a>
            <PriceListButton />
            <AppDownloadButton variant="hero" />
          </div>
          <div className="hero-points">
            <div className="hero-point">
              <img src="images/icon-premium-rice.png" alt="" />
              Premium Quality Rice
            </div>
            <div className="hero-point">
              <img src="images/icon-competitive-prices.png" alt="" />
              Competitive Prices
            </div>
            <div className="hero-point">
              <img src="images/icon-timely-delivery.png" alt="" />
              Timely Delivery &amp; Reliable Service
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section className="services">
      <div className="wrap">
        <div className="svc-card">
          {[
            ["images/icon-wholesale-supply.png", "Wholesale Supply", "Bulk rice supply for traders, retailers and institutions."],
            ["images/icon-best-quality.png", "Best Quality Rice", "Carefully selected grains with consistent aroma and purity."],
            ["images/icon-svc-competitive.png", "Competitive Prices", "Fair wholesale rates without compromising on quality."],
            ["images/icon-svc-delivery.png", "Timely Delivery", "Reliable logistics so your stock arrives on schedule."],
            ["images/icon-svc-satisfaction.png", "Customer Satisfaction", "Dedicated support and repeat business built on trust."],
            ["images/icon-svc-partnership.png", "Long Term Partnership", "Steady supply relationships for growing businesses."]
          ].map(([img, title, text]) => (
            <article className="svc" key={title}>
              <div className="svc-icon">
                <img src={img} alt="" />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
