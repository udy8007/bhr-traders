import { ArrowIcon } from "../components/Icons.jsx";
import { PriceListButton } from "../components/PriceListButton.jsx";

export function Hero() {
  return (
    <section className="hero" id="home">
      <div className="wrap hero-grid">
        <div>
          <div className="eyebrow">WHOLESALE RICE TRADERS</div>
          <h1>
            BHR <span>TRADERS</span>
          </h1>
          <p>
            BHR TRADERS is a wholesale rice trading business offering high-quality rice at very competitive and affordable prices. We focus on providing good-quality rice with consistent supply, reliable service, and value for money to our customers.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-green" href="#products">
              Our Products
              <ArrowIcon />
            </a>
            <PriceListButton />
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
