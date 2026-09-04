import {
  ADDRESS,
  EMAIL,
  GSTIN,
  HOURS_SUNDAY_FULL,
  HOURS_WEEKDAY_FULL,
  MAP_QUERY,
  PHONE,
  PHONE_2,
  SITE_NAME,
  TAGLINE
} from "../data/site.js";

const MAPS_DIR_URL = "https://www.google.com/maps/dir/?api=1&destination=" + MAP_QUERY;

export function BusinessInfoCard() {
  return (
    <aside className="biz-info-card">
      <div className="biz-info-bg" aria-hidden="true" />
      <div className="biz-info-deco biz-info-deco-a" aria-hidden="true" />
      <div className="biz-info-deco biz-info-deco-b" aria-hidden="true" />
      <div className="biz-info-deco biz-info-deco-c" aria-hidden="true" />
      <span className="biz-info-float biz-info-float-a" aria-hidden="true">🌾</span>
      <span className="biz-info-float biz-info-float-b" aria-hidden="true">🍚</span>
      <span className="biz-info-float biz-info-float-c" aria-hidden="true">🌾</span>

      <div className="biz-info-hero">
        <img src="/images/shop-exterior.jpg" alt="" className="biz-info-hero-img" />
        <div className="biz-info-hero-overlay" aria-hidden="true" />
        <div className="biz-info-hero-content">
          <img className="biz-info-logo" src="/images/logo.png" alt={SITE_NAME} />
          <div className="biz-info-head">
            <svg className="biz-info-pin" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
            <h2>{SITE_NAME}</h2>
            <em>{TAGLINE}</em>
          </div>
        </div>
      </div>

      <div className="biz-info-body">
        <div className="biz-info-actions">
          <a href={"tel:" + PHONE.replace(/\s/g, "")} className="biz-action-btn">
            <span className="biz-action-ico" aria-hidden="true">📞</span>
            Call us
          </a>
          <a href={"mailto:" + EMAIL} className="biz-action-btn">
            <span className="biz-action-ico" aria-hidden="true">✉️</span>
            Email
          </a>
          <a href={MAPS_DIR_URL} target="_blank" rel="noopener noreferrer" className="biz-action-btn">
            <span className="biz-action-ico" aria-hidden="true">🗺️</span>
            Map
          </a>
        </div>

        <div className="biz-info-tiles">
          <div className="biz-tile biz-tile-wide">
            <span className="biz-info-ico" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
            </span>
            <div>
              <span className="biz-tile-label">Visit us</span>
              <p>{ADDRESS}</p>
            </div>
          </div>

          <div className="biz-tile">
            <span className="biz-info-ico" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z" />
              </svg>
            </span>
            <div>
              <span className="biz-tile-label">Phone</span>
              <p>
                <a href={"tel:" + PHONE.replace(/\s/g, "")}>{PHONE}</a>
                <br />
                <a href={"tel:" + PHONE_2.replace(/\s/g, "")}>{PHONE_2}</a>
              </p>
            </div>
          </div>

          <div className="biz-tile">
            <span className="biz-info-ico" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            <div>
              <span className="biz-tile-label">Open hours</span>
              <p>
                {HOURS_WEEKDAY_FULL}
                <br />
                {HOURS_SUNDAY_FULL}
              </p>
            </div>
          </div>
        </div>

        <div className="biz-info-footer">
          <span className="biz-gst-badge">GSTIN {GSTIN}</span>
          <a className="btn btn-directions" href={MAPS_DIR_URL} target="_blank" rel="noopener noreferrer">
            Get Directions
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
