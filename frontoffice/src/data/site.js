export const SITE_NAME = "BHR TRADERS";
export const PHONE = "+91 99403 38654";
export const PHONE_2 = "+91 99403 39654";
export const EMAIL = "info@bhrtraders.com";
export const GSTIN = "33BDJPB0270L2ZT";
export const UPI_ID = "bhr270906@okhdfcbank";
export const UPI_QR = "/images/upi-qr.png";
export const ADDRESS =
  "No: 66, Kannagi Nagar, PadiKuppam Main Road, Anna Nagar West, Chennai, Tamil Nadu - 600040.";
export const MAP_QUERY =
  "No.+66,+Kannagi+Nagar,+PadiKuppam+Main+Road,+Anna+Nagar+West,+Chennai+600040";
export const HOURS_WEEKDAY = "Mon–Sat 7:00 AM – 9:00 PM";
export const HOURS_SUNDAY = "Sun 7:00 AM – 2:00 PM";
export const LOCATION_LABEL = "Anna Nagar West, Chennai";

export const PROMOS = [
  {
    id: "wholesale",
    title: "Wholesale Prices",
    sub: "Best rates on 25–50 kg bags",
    cta: "Shop now",
    gradient: "linear-gradient(135deg, #FF6B35 0%, #F72585 100%)",
    emoji: "🏷️"
  },
  {
    id: "delivery",
    title: "Same-Day Delivery",
    sub: "Across Chennai · 7 AM – 9 PM",
    cta: "Order rice",
    gradient: "linear-gradient(135deg, #06D6A0 0%, #118AB2 100%)",
    emoji: "🚚"
  },
  {
    id: "gst",
    title: "GST Invoice Ready",
    sub: "Trade billing for hotels & shops",
    cta: "Enquire",
    gradient: "linear-gradient(135deg, #8338EC 0%, #3A86FF 100%)",
    emoji: "📋"
  }
];

export const CATEGORY_STYLE = {
  all: { emoji: "🌾", bg: "#FFF3E0", ring: "#FF9800", label: "All" },
  boiled: { emoji: "🍚", bg: "#FFEBEE", ring: "#E53935", label: "Boiled" },
  raw: { emoji: "✨", bg: "#FFF8E1", ring: "#FFB300", label: "Raw" },
  steam: { emoji: "💨", bg: "#E0F7FA", ring: "#00ACC1", label: "Steam" },
  idly: { emoji: "🥞", bg: "#F3E5F5", ring: "#AB47BC", label: "Idly" },
  biriyani: { emoji: "👑", bg: "#FCE4EC", ring: "#EC407A", label: "Biryani" },
  broken: { emoji: "🌿", bg: "#E8F5E9", ring: "#66BB6A", label: "Broken" },
  millets: { emoji: "🌱", bg: "#F1F8E9", ring: "#7CB342", label: "Millets" },
  dhall: { emoji: "🫘", bg: "#FFF3E0", ring: "#FB8C00", label: "Dhall" }
};

export const WHY_BUY = [
  { title: "Hand-picked lots", text: "Moisture, aroma & cooking finish checked.", emoji: "🔍", color: "#FF6B35" },
  { title: "Wholesale pricing", text: "Fair mandi rates — no compromise.", emoji: "💰", color: "#06D6A0" },
  { title: "On-time supply", text: "City-wide delivery you can count on.", emoji: "⚡", color: "#8338EC" },
  { title: "GST invoices", text: "Trade-ready billing every order.", emoji: "📄", color: "#3A86FF" }
];

export const STATS = [
  { value: "10+", label: "Years", color: "#FF6B35" },
  { value: "114+", label: "Varieties", color: "#06D6A0" },
  { value: "4.9★", label: "Rating", color: "#F72585" },
  { value: "1000+", label: "Tons sold", color: "#8338EC" }
];

export const PAY_LABELS = {
  cod: "Cash on delivery",
  upi: "UPI",
  bank: "Bank transfer"
};

export function categoryStyle(id) {
  return CATEGORY_STYLE[id] || { emoji: "🌾", bg: "#F5F5F5", ring: "#9E9E9E", label: id };
}
